import { getAllLessons } from '$lib/helpers/lesson-helpers';

export const load = async ({ parent }) => {
	// Get session and subscription status from layout
	const { session, isSubscribed } = await parent();
	
	// Fetch all generated lessons in one efficient query
	const lessonsResult = await getAllLessons();
	
	let allUserGeneratedLessons: object[] = [];
	
	if (lessonsResult.success && lessonsResult.lessons) {
		// Add dialect display names to each lesson
		allUserGeneratedLessons = lessonsResult.lessons.map((lesson: object) => {
			const lessonWithDialect = lesson as { dialect: string };
			return {
				...lesson,
				dialect_name: getDialectDisplayName(lessonWithDialect.dialect)
			};
		});
	} else if (!lessonsResult.success) {
		console.error('Error fetching lessons:', lessonsResult.error);
	}

	// Lessons are already sorted by created_at desc from the query
	return {
		session,
		isSubscribed,
		hasActiveSubscription: isSubscribed, // Keep for backward compatibility
		user_generated_lessons: allUserGeneratedLessons
	};
};

// Helper function to get display names for dialects
function getDialectDisplayName(dialect: string) {
	const dialectNames = {
		'egyptian-arabic': 'Egyptian Arabic',
		'darija': 'Moroccan Darija',
		'fusha': 'Modern Standard Arabic',
	};
	
	return dialectNames[dialect as keyof typeof dialectNames] || dialect;
}


