import type { PageServerLoad } from './$types';
import { loadLesson1 } from '$lib/constants/lessons';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const lessonId = params.lessonId;

		if (!lessonId) {
			throw error(404, 'Lesson ID required');
		}

		if (lessonId === 'lesson-1') {
			const lesson = await loadLesson1();
			if (!lesson) {
				throw error(404, 'Lesson 1 has not been generated yet. Please visit /lessons/generate to create it.');
			}
			
			// Validate lesson structure
			if (!lesson.id || !lesson.title || !lesson.subLessons || !Array.isArray(lesson.subLessons)) {
				console.error('Invalid lesson structure:', lesson);
				throw error(500, 'Lesson data is invalid. Please regenerate the lesson.');
			}
			
			return {
				lesson,
				lessonId
			};
		}

		throw error(404, 'Lesson not found');
	} catch (e) {
		console.error('Error loading lesson:', e);
		if (e && typeof e === 'object' && 'status' in e && 'body' in e) {
			throw e; // Re-throw SvelteKit errors
		}
		throw error(500, `Failed to load lesson: ${e instanceof Error ? e.message : 'Unknown error'}`);
	}
};
