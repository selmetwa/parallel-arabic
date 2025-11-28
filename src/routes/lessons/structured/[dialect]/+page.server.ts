import { curriculum } from '$lib/data/curriculum';
import { checkExistingLessons } from '$lib/helpers/lesson-file-helper';

// Normalize dialect name for file paths (matches lesson-file-helper logic)
function normalizeDialect(dialect: string): string {
	return dialect.toLowerCase().replace(/\s+/g, '-');
}

export const load = async ({ params, parent, locals }) => {
	const { session, isSubscribed, user } = await parent();
	const { dialect } = params;
	const { supabase } = locals;

	// Map URL-friendly names to actual dialect names
	const dialectMap: Record<string, string> = {
		'darija': 'darija',
		'msa': 'fusha',
		'fusha': 'fusha',
		'levantine': 'levantine',
		'egyptian': 'egyptian-arabic',
		'egyptian-arabic': 'egyptian-arabic'
	};

	const dialectName = dialectMap[dialect.toLowerCase()] || dialect.toLowerCase();
	const normalizedDialect = normalizeDialect(dialectName);

	// Flatten curriculum to get all topic IDs
	const allTopicIds = curriculum.flatMap(m => m.topics.map(t => t.id));
	
	// Check which lessons exist for this specific dialect
	const existingLessonsAll = await checkExistingLessons(allTopicIds);
	
	// Filter to only show lessons that exist for this dialect
	// Note: checkExistingLessons returns directory names which are already normalized
	const existingLessons: Record<string, { exists: boolean; dialects?: string[] }> = {};
	for (const [topicId, info] of Object.entries(existingLessonsAll)) {
		if (info.exists && info.dialects) {
			// Check if this lesson exists for the requested dialect
			// The dialects array contains normalized directory names (e.g., "darija", "egyptian-arabic")
			const existsForDialect = info.dialects.includes(normalizedDialect);
			existingLessons[topicId] = {
				exists: existsForDialect,
				dialects: existsForDialect ? [normalizedDialect] : []
			};
		} else {
			existingLessons[topicId] = { exists: false };
		}
	}

	// Load user progress for this dialect if user is logged in
	let userProgress: Record<string, { status: string; completed_at?: number }> = {};
	if (user && session) {
		const { data: progressData, error: progressError } = await supabase
			.from('structured_lesson_progress')
			.select('topic_id, status, completed_at')
			.eq('user_id', user.id)
			.eq('dialect', dialectName);

		if (!progressError && progressData) {
			for (const progress of progressData) {
				userProgress[progress.topic_id] = {
					status: progress.status,
					completed_at: progress.completed_at || undefined
				};
			}
		}
	}

	return {
		session,
		isSubscribed,
		hasActiveSubscription: isSubscribed,
		user: user,
		curriculum,
		dialect: dialectName, // Return the actual dialect name (not normalized) for use in API calls
		existingLessons,
		userProgress
	};
};

