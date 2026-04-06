import { getAllLessons, getLessonsByUser } from '$lib/helpers/lesson-helpers';

export const load = async ({ parent }) => {
	// Get session and subscription status from layout
	const { session, isSubscribed, user } = await parent();

	// Fetch public lessons and (if logged in) user's private lessons in parallel
	const [lessonsResult, privateResult] = await Promise.all([
		getAllLessons(),
		user?.id ? getLessonsByUser(user.id, { privateOnly: true }) : Promise.resolve({ success: true, lessons: [] })
	]);

	let allUserGeneratedLessons: object[] = [];
	let privateLesson: object[] = [];

	if (lessonsResult.success && lessonsResult.lessons) {
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

	if (privateResult.success && privateResult.lessons) {
		privateLesson = privateResult.lessons.map((lesson: object) => {
			const lessonWithDialect = lesson as { dialect: string };
			return {
				...lesson,
				dialect_name: getDialectDisplayName(lessonWithDialect.dialect)
			};
		});
	}

	return {
		session,
		isSubscribed,
		hasActiveSubscription: isSubscribed,
		user_generated_lessons: allUserGeneratedLessons,
		private_lessons: privateLesson,
		user: user,
	};
};

// Helper function to get display names for dialects
function getDialectDisplayName(dialect: string) {
	const dialectNames = {
		'egyptian-arabic': 'Egyptian Arabic',
		'levantine': 'Levantine Arabic',
		'darija': 'Moroccan Darija',
		'fusha': 'Modern Standard Arabic',
	};
	return dialectNames[dialect as keyof typeof dialectNames] || dialect;
}

