import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { type GeneratedLesson } from '$lib/schemas/curriculum-schema';

// Resolve lessons directory relative to this file's location
// This works in both development and production (Vercel)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LESSONS_DIR = path.resolve(__dirname, '../../data/lessons');

/**
 * Normalizes dialect name for use in file paths
 */
function normalizeDialect(dialect: string): string {
    // Convert dialect to a safe directory name
    return dialect.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Gets the directory path for a specific dialect
 */
function getDialectDir(dialect: string): string {
    return path.join(LESSONS_DIR, normalizeDialect(dialect));
}

/**
 * Gets the file path for a lesson
 */
function getLessonPath(topicId: string, dialect: string): string {
    return path.join(getDialectDir(dialect), `${topicId}.json`);
}

/**
 * Saves a generated lesson to a JSON file.
 * File structure: {dialect}/{topicId}.json
 */
export async function saveLesson(lesson: GeneratedLesson): Promise<void> {
    if (!lesson.dialect) {
        throw new Error('Lesson dialect is required');
    }
    
    const dialectDir = getDialectDir(lesson.dialect);
    // Ensure dialect directory exists
    await fs.mkdir(dialectDir, { recursive: true });
    
    const filePath = getLessonPath(lesson.topicId, lesson.dialect);
    await fs.writeFile(filePath, JSON.stringify(lesson, null, 2), 'utf-8');
}

/**
 * Loads a lesson by topic ID and optional dialect.
 * If dialect is not provided, searches across all dialect directories.
 * Returns null if the file doesn't exist.
 */
export async function loadLesson(topicId: string, dialect?: string): Promise<GeneratedLesson | null> {
    // If dialect is specified, load from that specific dialect directory
    if (dialect) {
        const filePath = getLessonPath(topicId, dialect);
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data) as GeneratedLesson;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }
    
    // If no dialect specified, search across all dialect directories
    try {
        const dialectDirs = await fs.readdir(LESSONS_DIR, { withFileTypes: true });
        
        for (const dirent of dialectDirs) {
            if (dirent.isDirectory()) {
                const filePath = path.join(LESSONS_DIR, dirent.name, `${topicId}.json`);
                try {
                    const data = await fs.readFile(filePath, 'utf-8');
                    return JSON.parse(data) as GeneratedLesson;
                } catch (error) {
                    // File doesn't exist in this dialect, continue searching
                    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                        throw error;
                    }
                }
            }
        }
        
        return null;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

/**
 * Checks which lessons exist for a given list of topic IDs.
 * Returns a map of topicId -> { exists: boolean, dialects?: string[] }
 * If a lesson exists in multiple dialects, dialects array contains all dialects where it exists.
 */
export async function checkExistingLessons(topicIds: string[]): Promise<Record<string, { exists: boolean; dialects?: string[] }>> {
    const existing: Record<string, { exists: boolean; dialects?: string[] }> = {};
    
    // Initialize all topic IDs as not existing
    for (const id of topicIds) {
        existing[id] = { exists: false };
    }
    
    // List all dialect directories
    let dialectDirs: string[] = [];
    try {
        const entries = await fs.readdir(LESSONS_DIR, { withFileTypes: true });
        dialectDirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    } catch (error) {
        // Directory might not exist - on Vercel filesystem is read-only
        // If directory doesn't exist, just return empty results (no lessons exist)
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            dialectDirs = [];
        } else {
            throw error;
        }
    }
    
    // Check each dialect directory for lesson files
    for (const dialectDir of dialectDirs) {
        try {
            const files = await fs.readdir(path.join(LESSONS_DIR, dialectDir));
            const lessonFiles = files.filter(f => f.endsWith('.json'));
            
            for (const file of lessonFiles) {
                const topicId = file.replace('.json', '');
                if (topicIds.includes(topicId)) {
                    if (!existing[topicId].exists) {
                        existing[topicId] = { exists: true, dialects: [] };
                    }
                    if (!existing[topicId].dialects) {
                        existing[topicId].dialects = [];
                    }
                    // Store the normalized dialect name (directory name)
                    existing[topicId].dialects!.push(dialectDir);
                }
            }
        } catch (error) {
            // Skip directories that can't be read
            console.warn(`Could not read dialect directory ${dialectDir}:`, error);
        }
    }
    
    return existing;
}

