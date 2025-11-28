import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { type GeneratedLesson } from '$lib/schemas/curriculum-schema';

// Resolve lessons directory - try multiple approaches for compatibility
async function findLessonsDir(): Promise<string | null> {
    const possiblePaths = [
        // 1. Relative to current file (works in dev)
        (() => {
            try {
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = path.dirname(__filename);
                return path.resolve(__dirname, '../../data/lessons');
            } catch {
                return null;
            }
        })(),
        // 2. From process.cwd() with src path (standard SvelteKit structure)
        path.join(process.cwd(), 'src/lib/data/lessons'),
        // 3. From process.cwd() directly (if we're already in src)
        path.join(process.cwd(), 'lib/data/lessons'),
        // 4. .svelte-kit structure (Vercel build output)
        path.join(process.cwd(), '.svelte-kit/output/server/chunks/lib/data/lessons'),
    ].filter((p): p is string => p !== null);

    // Try each path to see which one exists
    for (const dirPath of possiblePaths) {
        try {
            await fs.access(dirPath);
            console.log(`[findLessonsDir] Found lessons directory at: ${dirPath}`);
            return dirPath;
        } catch {
            // Path doesn't exist, try next one
            continue;
        }
    }
    
    console.warn(`[findLessonsDir] Could not find lessons directory. Tried:`, possiblePaths);
    // Return the first path as fallback (will fail gracefully later)
    return possiblePaths[0] || path.join(process.cwd(), 'src/lib/data/lessons');
}

// Cache the resolved directory path
let LESSONS_DIR_CACHE: string | null = null;

async function getLessonsDir(): Promise<string> {
    if (!LESSONS_DIR_CACHE) {
        LESSONS_DIR_CACHE = await findLessonsDir() || path.join(process.cwd(), 'src/lib/data/lessons');
    }
    return LESSONS_DIR_CACHE;
}

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
async function getDialectDir(dialect: string): Promise<string> {
    const lessonsDir = await getLessonsDir();
    return path.join(lessonsDir, normalizeDialect(dialect));
}

/**
 * Gets the file path for a lesson
 */
async function getLessonPath(topicId: string, dialect: string): Promise<string> {
    const dialectDir = await getDialectDir(dialect);
    return path.join(dialectDir, `${topicId}.json`);
}

/**
 * Saves a generated lesson to a JSON file.
 * File structure: {dialect}/{topicId}.json
 */
export async function saveLesson(lesson: GeneratedLesson): Promise<void> {
    if (!lesson.dialect) {
        throw new Error('Lesson dialect is required');
    }
    
    const dialectDir = await getDialectDir(lesson.dialect);
    // Ensure dialect directory exists
    await fs.mkdir(dialectDir, { recursive: true });
    
    const filePath = await getLessonPath(lesson.topicId, lesson.dialect);
    await fs.writeFile(filePath, JSON.stringify(lesson, null, 2), 'utf-8');
}

/**
 * Loads a lesson by topic ID and optional dialect.
 * If dialect is not provided, searches across all dialect directories.
 * Returns null if the file doesn't exist.
 */
export async function loadLesson(topicId: string, dialect?: string): Promise<GeneratedLesson | null> {
    const lessonsDir = await getLessonsDir();
    
    // If dialect is specified, load from that specific dialect directory
    if (dialect) {
        const filePath = await getLessonPath(topicId, dialect);
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
        const dialectDirs = await fs.readdir(lessonsDir, { withFileTypes: true });
        
        for (const dirent of dialectDirs) {
            if (dirent.isDirectory()) {
                const filePath = path.join(lessonsDir, dirent.name, `${topicId}.json`);
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
    
    // Get the lessons directory (will try multiple paths)
    let lessonsDir: string;
    try {
        lessonsDir = await getLessonsDir();
    } catch (error) {
        console.error(`[checkExistingLessons] Failed to resolve lessons directory:`, error);
        return existing; // Return empty results if we can't find the directory
    }
    
    // List all dialect directories
    let dialectDirs: string[] = [];
    try {
        console.log(`[checkExistingLessons] Looking for lessons in: ${lessonsDir}`);
        const entries = await fs.readdir(lessonsDir, { withFileTypes: true });
        dialectDirs = entries.filter(e => e.isDirectory()).map(e => e.name);
        console.log(`[checkExistingLessons] Found dialect directories:`, dialectDirs);
    } catch (error) {
        // Directory might not exist - on Vercel filesystem is read-only
        // If directory doesn't exist, just return empty results (no lessons exist)
        const err = error as NodeJS.ErrnoException;
        console.warn(`[checkExistingLessons] Could not read lessons directory at ${lessonsDir}:`, err.code, err.message);
        if (err.code === 'ENOENT') {
            dialectDirs = [];
        } else {
            throw error;
        }
    }
    
    // Check each dialect directory for lesson files
    for (const dialectDir of dialectDirs) {
        try {
            const files = await fs.readdir(path.join(lessonsDir, dialectDir));
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

