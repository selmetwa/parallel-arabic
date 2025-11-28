import { type GeneratedLesson } from '$lib/schemas/curriculum-schema';
import { supabase } from '$lib/supabaseClient';

const STRUCTURED_LESSONS_BUCKET = 'structured_lesson';

/**
 * Normalizes dialect name for use in storage paths
 */
function normalizeDialect(dialect: string): string {
    // Convert dialect to a safe directory name
    return dialect.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Saves a generated lesson to Supabase storage.
 * File structure: {dialect}/{topicId}.json
 */
export async function saveLesson(lesson: GeneratedLesson): Promise<void> {
    if (!lesson.dialect || !lesson.topicId) {
        throw new Error('Lesson dialect and topicId are required');
    }
    
    const normalizedDialect = normalizeDialect(lesson.dialect);
    const storagePath = `${normalizedDialect}/${lesson.topicId}.json`;
    const fileContent = JSON.stringify(lesson, null, 2);
    
    const { error } = await supabase.storage
        .from(STRUCTURED_LESSONS_BUCKET)
        .upload(storagePath, fileContent, {
            contentType: 'application/json',
            upsert: true
        });
    
    if (error) {
        throw new Error(`Failed to save lesson to storage: ${error.message}`);
    }
}

/**
 * Loads a lesson by topic ID and optional dialect from Supabase storage.
 * If dialect is not provided, searches across all dialects.
 * Returns null if the file doesn't exist.
 */
export async function loadLesson(topicId: string, dialect?: string): Promise<GeneratedLesson | null> {
    if (dialect) {
        const normalizedDialect = normalizeDialect(dialect);
        const storagePath = `${normalizedDialect}/${topicId}.json`;
        
        const { data, error } = await supabase.storage
            .from(STRUCTURED_LESSONS_BUCKET)
            .download(storagePath);
        
        if (error || !data) {
            return null;
        }
        
        const jsonText = await data.text();
        return JSON.parse(jsonText) as GeneratedLesson;
    } else {
        // If no dialect specified, try all dialects in storage
        const dialects = ['egyptian-arabic', 'levantine', 'darija', 'fusha'];
        for (const d of dialects) {
            const normalizedDialect = normalizeDialect(d);
            const storagePath = `${normalizedDialect}/${topicId}.json`;
            
            const { data, error } = await supabase.storage
                .from(STRUCTURED_LESSONS_BUCKET)
                .download(storagePath);
            
            if (!error && data) {
                const jsonText = await data.text();
                return JSON.parse(jsonText) as GeneratedLesson;
            }
        }
        
        return null;
    }
}

/**
 * Checks which lessons exist for a given list of topic IDs.
 * Reads from Supabase storage.
 * Returns a map of topicId -> { exists: boolean, dialects?: string[] }
 * If a lesson exists in multiple dialects, dialects array contains all dialects where it exists.
 */
export async function checkExistingLessons(topicIds: string[]): Promise<Record<string, { exists: boolean; dialects?: string[] }>> {
    const existing: Record<string, { exists: boolean; dialects?: string[] }> = {};
    
    // Initialize all topic IDs as not existing
    for (const id of topicIds) {
        existing[id] = { exists: false };
    }
    
    const dialects = ['egyptian-arabic', 'levantine', 'darija', 'fusha'];
    
    for (const dialect of dialects) {
        const normalizedDialect = normalizeDialect(dialect);
        
        try {
            // List files in the dialect folder
            const { data: files, error } = await supabase.storage
                .from(STRUCTURED_LESSONS_BUCKET)
                .list(normalizedDialect, {
                    limit: 1000,
                    sortBy: { column: 'name', order: 'asc' }
                });
            
            if (error) {
                console.warn(`[checkExistingLessons] Error listing files for dialect ${dialect}:`, error.message);
                continue;
            }
            
            if (files) {
                for (const file of files) {
                    if (file.name.endsWith('.json')) {
                        const topicId = file.name.replace('.json', '');
                        if (topicIds.includes(topicId)) {
                            if (!existing[topicId].exists) {
                                existing[topicId] = { exists: true, dialects: [] };
                            }
                            if (!existing[topicId].dialects) {
                                existing[topicId].dialects = [];
                            }
                            existing[topicId].dialects!.push(normalizedDialect);
                        }
                    }
                }
            }
        } catch (error) {
            console.warn(`[checkExistingLessons] Error processing dialect ${dialect}:`, error);
            continue;
        }
    }
    
    return existing;
}
