import { error } from '@sveltejs/kit';
import { getLessonById } from '$lib/helpers/lesson-helpers';
import { trackActivitySimple } from '$lib/helpers/track-activity';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent, locals, setHeaders }) => {
	const { session, user } = await parent();
	const lessonId = params.id;

	if (!lessonId) {
		throw error(400, { message: 'Lesson ID is required' });
	}

	// Try to get lesson from database
	const lessonResult = await getLessonById(lessonId);

	if (!lessonResult.success || !lessonResult.lesson) {
		// Lesson not found in database - might be in sessionStorage (client-side)
		// Return a flag so the client can check sessionStorage
		return {
			lessonId,
			lesson: null,
			error: lessonResult.error || 'Lesson not found',
			checkSessionStorage: true // Flag to check sessionStorage on client
		};
	}

	// Track lesson view (non-blocking)
	if (user?.id) {
		trackActivitySimple(user.id, 'lesson', 1).catch(err => {
			console.error('Error tracking lesson view:', err);
		});
	}

	// Add dialect display name
	const lesson = lessonResult.lesson as {
		dialect: string;
		[key: string]: unknown;
	};

	const dialectNames: Record<string, string> = {
		'egyptian-arabic': 'Egyptian Arabic',
		'darija': 'Moroccan Darija',
		'fusha': 'Modern Standard Arabic',
		'levantine': 'Levantine Arabic',
	};

	// Set cache headers - lesson content rarely changes
	// Cache for 30 min in browser, 2 hours on CDN
	setHeaders({
		'Cache-Control': 'public, max-age=1800, s-maxage=7200, stale-while-revalidate=3600'
	});

	return {
		lessonId,
		lesson: {
			...lesson,
			dialect_name: dialectNames[lesson.dialect] || lesson.dialect
		},
		checkSessionStorage: false,
		session,
		user
	};
};

