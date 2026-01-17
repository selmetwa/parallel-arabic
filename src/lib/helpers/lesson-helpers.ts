import { supabase } from '$lib/supabaseClient';
import { downloadLessonFromStorage } from './storage-helpers';
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from '$lib/server/redis';

/**
 * Get a lesson by ID with full JSON content from storage
 * Uses Redis caching for improved performance
 */
export async function getLessonById(lessonId: string): Promise<{ success: boolean; lesson?: object; error?: string }> {
	try {
		// Check Redis cache first
		const cacheKey = CACHE_KEYS.LESSON_SINGLE(lessonId);
		const cached = await getCached<object>(cacheKey);
		if (cached) {
			return { success: true, lesson: cached };
		}

		// First, get the lesson metadata from database
		const { data: lessonMetadata, error: dbError } = await supabase
			.from('generated_lesson')
			.select('*')
			.eq('id', lessonId)
			.single();

		if (dbError || !lessonMetadata) {
			console.error('Lesson not found in database:', dbError);
			return { success: false, error: 'Lesson not found' };
		}

		// Download the lesson content from storage
		const storageResult = await downloadLessonFromStorage(lessonMetadata.lesson_body);
		
		if (!storageResult.success) {
			console.error('Failed to download lesson from storage:', storageResult.error);
			return { success: false, error: `Failed to load lesson content: ${storageResult.error}` };
		}

		// Combine metadata with lesson content
		const fullLesson = {
			...lessonMetadata,
			lesson_body: storageResult.data // Replace file key with actual JSON content
		};

		// Cache the result
		await setCached(cacheKey, fullLesson, CACHE_TTL.LESSON_SINGLE);

		return { success: true, lesson: fullLesson };
	} catch (error) {
		return { success: false, error: (error as Error).message };
	}
}

/**
 * Get lessons by user ID with full JSON content from storage
 */
export async function getLessonsByUser(userId: string): Promise<{ success: boolean; lessons?: object[]; error?: string }> {
	try {
		// Get all lesson metadata for the user
		const { data: lessonsMetadata, error: dbError } = await supabase
			.from('generated_lesson')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false });

		if (dbError) {
			console.error('Error fetching user lessons:', dbError);
			return { success: false, error: 'Failed to fetch lessons' };
		}

		if (!lessonsMetadata || lessonsMetadata.length === 0) {
			return { success: true, lessons: [] };
		}

		// Download lesson content for each lesson in parallel
		const lessonsWithContent = await Promise.all(
			lessonsMetadata.map(async (lessonMeta) => {
				// Download lesson content
				const storageResult = await downloadLessonFromStorage(lessonMeta.lesson_body);
				
				if (!storageResult.success) {
					console.warn(`Failed to load content for lesson ${lessonMeta.id}:`, storageResult.error);
					// Return lesson without content rather than failing entirely
					return {
						...lessonMeta,
						lesson_body: null, // Indicate content failed to load
						content_error: storageResult.error
					};
				}

				return {
					...lessonMeta,
					lesson_body: storageResult.data
				};
			})
		);

		return { success: true, lessons: lessonsWithContent };
	} catch (error) {
		return { success: false, error: (error as Error).message };
	}
}

/**
 * Get all lessons from all dialects with full JSON content from storage
 * Uses Redis caching for improved performance
 */
export async function getAllLessons(limit?: number): Promise<{ success: boolean; lessons?: object[]; error?: string }> {
	try {
		// Only cache if no limit (full list)
		const cacheKey = limit ? null : CACHE_KEYS.LESSONS_ALL;
		
		if (cacheKey) {
			const cached = await getCached<object[]>(cacheKey);
			if (cached) {
				return { success: true, lessons: cached };
			}
		}

		let query = supabase
			.from('generated_lesson')
			.select('*')
			.order('created_at', { ascending: false });

		if (limit) {
			query = query.limit(limit);
		}

		const { data: lessonsMetadata, error: dbError } = await query;

		if (dbError) {
			console.error('Error fetching all lessons:', dbError);
			// If table doesn't exist, return empty array instead of error
			if (dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
				console.warn('⚠️ generated_lesson table does not exist yet.');
				return { success: true, lessons: [] };
			}
			return { success: false, error: 'Failed to fetch lessons' };
		}

		if (!lessonsMetadata || lessonsMetadata.length === 0) {
			return { success: true, lessons: [] };
		}

		// Download lesson content for each lesson in parallel
		const lessonsWithContent = await Promise.all(
			lessonsMetadata.map(async (lessonMeta) => {
				// Download lesson content
				const storageResult = await downloadLessonFromStorage(lessonMeta.lesson_body);
				
				if (!storageResult.success) {
					console.warn(`Failed to load content for lesson ${lessonMeta.id}:`, storageResult.error);
					return {
						...lessonMeta,
						lesson_body: null,
						content_error: storageResult.error
					};
				}

				return {
					...lessonMeta,
					lesson_body: storageResult.data
				};
			})
		);

		// Cache the result (only if no limit)
		if (cacheKey) {
			await setCached(cacheKey, lessonsWithContent, CACHE_TTL.LESSONS_ALL);
		}

		return { success: true, lessons: lessonsWithContent };
	} catch (error) {
		return { success: false, error: (error as Error).message };
	}
}

/**
 * Get lessons by dialect with full JSON content from storage
 * Uses Redis caching for improved performance
 */
export async function getLessonsByDialect(dialect: string, limit?: number): Promise<{ success: boolean; lessons?: object[]; error?: string }> {
	try {
		// Only cache if no limit (full list for dialect)
		const cacheKey = limit ? null : CACHE_KEYS.LESSONS_DIALECT(dialect);
		
		if (cacheKey) {
			const cached = await getCached<object[]>(cacheKey);
			if (cached) {
				return { success: true, lessons: cached };
			}
		}

		let query = supabase
			.from('generated_lesson')
			.select('*')
			.eq('dialect', dialect)
			.order('created_at', { ascending: false });

		if (limit) {
			query = query.limit(limit);
		}

		const { data: lessonsMetadata, error: dbError } = await query;

		if (dbError) {
			console.error(`Error fetching ${dialect} lessons:`, dbError);
			// If table doesn't exist, return empty array instead of error
			if (dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
				console.warn('⚠️ generated_lesson table does not exist yet.');
				return { success: true, lessons: [] };
			}
			return { success: false, error: 'Failed to fetch lessons' };
		}

		if (!lessonsMetadata || lessonsMetadata.length === 0) {
			return { success: true, lessons: [] };
		}

		// Download lesson content for each lesson in parallel
		const lessonsWithContent = await Promise.all(
			lessonsMetadata.map(async (lessonMeta) => {
				// Download lesson content
				const storageResult = await downloadLessonFromStorage(lessonMeta.lesson_body);
				
				if (!storageResult.success) {
					console.warn(`Failed to load content for lesson ${lessonMeta.id}:`, storageResult.error);
					return {
						...lessonMeta,
						lesson_body: null,
						content_error: storageResult.error
					};
				}

				return {
					...lessonMeta,
					lesson_body: storageResult.data
				};
			})
		);

		// Cache the result (only if no limit)
		if (cacheKey) {
			await setCached(cacheKey, lessonsWithContent, CACHE_TTL.LESSONS_DIALECT);
		}

		console.log(`✅ Retrieved ${lessonsWithContent.length} ${dialect} lessons`);
		return { success: true, lessons: lessonsWithContent };
	} catch (error) {
		console.error('Error retrieving lessons by dialect:', error);
		return { success: false, error: (error as Error).message };
	}
}

