import { type GeneratedLesson } from '$lib/schemas/curriculum-schema';
import { supabase } from '$lib/supabaseClient';
import { getCached, setCached, deleteCached, deleteCachedByPattern } from '$lib/server/redis';

const STRUCTURED_LESSONS_BUCKET = 'structured_lesson';

// Cache TTL for structured lessons (these rarely change)
const STRUCTURED_LESSON_TTL = 86400; // 24 hours

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
 * Invalidates relevant caches after saving.
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

    // Invalidate caches for this lesson
    await deleteCached(`structured_lesson:${normalizedDialect}:${lesson.topicId}`);
    await deleteCached(`structured_lesson:any:${lesson.topicId}`);
    await deleteCached('structured_lessons:existence_map');
}

/**
 * Loads a lesson by topic ID and optional dialect from Supabase storage.
 * If dialect is not provided, searches across all dialects.
 * Returns null if the file doesn't exist.
 * Uses Redis caching for improved performance (24h TTL).
 */
export async function loadLesson(topicId: string, dialect?: string): Promise<GeneratedLesson | null> {
    // Create cache key
    const cacheKey = dialect 
        ? `structured_lesson:${normalizeDialect(dialect)}:${topicId}`
        : `structured_lesson:any:${topicId}`;
    
    // Check cache first
    const cached = await getCached<GeneratedLesson>(cacheKey);
    if (cached) {
        return cached;
    }

    let lesson: GeneratedLesson | null = null;

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
        lesson = JSON.parse(jsonText) as GeneratedLesson;
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
                lesson = JSON.parse(jsonText) as GeneratedLesson;
                break;
            }
        }
    }

    // Cache the result if found
    if (lesson) {
        await setCached(cacheKey, lesson, STRUCTURED_LESSON_TTL);
    }

    return lesson;
}

/**
 * Checks which lessons exist for a given list of topic IDs.
 * Reads from Supabase storage.
 * Returns a map of topicId -> { exists: boolean, dialects?: string[] }
 * If a lesson exists in multiple dialects, dialects array contains all dialects where it exists.
 * Uses Redis caching for the full lesson existence map (1 hour TTL).
 */
export async function checkExistingLessons(topicIds: string[]): Promise<Record<string, { exists: boolean; dialects?: string[] }>> {
    // Cache the full existence map (not per topic, as we usually need them all)
    const cacheKey = 'structured_lessons:existence_map';
    
    // Try to get cached existence map
    const cachedMap = await getCached<Record<string, { exists: boolean; dialects?: string[] }>>(cacheKey);
    
    if (cachedMap) {
        // Return only the requested topic IDs from the cached map
        const result: Record<string, { exists: boolean; dialects?: string[] }> = {};
        for (const id of topicIds) {
            result[id] = cachedMap[id] || { exists: false };
        }
        return result;
    }

    // Build the full existence map
    const allExisting: Record<string, { exists: boolean; dialects?: string[] }> = {};
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
                        if (!allExisting[topicId]) {
                            allExisting[topicId] = { exists: true, dialects: [] };
                        }
                        if (!allExisting[topicId].dialects) {
                            allExisting[topicId].dialects = [];
                        }
                        allExisting[topicId].dialects!.push(normalizedDialect);
                    }
                }
            }
        } catch (error) {
            console.warn(`[checkExistingLessons] Error processing dialect ${dialect}:`, error);
            continue;
        }
    }
    
    // Cache the full map for 1 hour
    await setCached(cacheKey, allExisting, 3600);
    
    // Return only the requested topic IDs
    const result: Record<string, { exists: boolean; dialects?: string[] }> = {};
    for (const id of topicIds) {
        result[id] = allExisting[id] || { exists: false };
    }
    
    return result;
}
