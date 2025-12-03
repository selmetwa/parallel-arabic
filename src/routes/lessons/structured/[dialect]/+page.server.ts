import { curriculum } from '$lib/data/curriculum';
import { checkExistingLessons } from '$lib/helpers/lesson-file-helper';
import { supabase } from '$lib/supabaseClient';

// Whitelist of emails that have all lessons unlocked
const WHITELISTED_EMAILS = [
	'selmetwa@gmail.com',
	'sherifliketheclash@gmail.com'
];

// Normalize dialect name for file paths (matches lesson-file-helper logic)
function normalizeDialect(dialect: string): string {
	return dialect.toLowerCase().replace(/\s+/g, '-');
}

export const load = async ({ params, parent }) => {
	const { session, isSubscribed, user } = await parent();
	const { dialect } = params;
	
	// Check if user is whitelisted
	const isWhitelisted = user?.email && WHITELISTED_EMAILS.includes(user.email.toLowerCase());

	// Map URL-friendly names to actual dialect names
	const dialectMap: Record<string, string> = {
		'darija': 'darija',
		'msa': 'fusha',
		'fusha': 'fusha',
		'levantine': 'levantine',
		'egyptian': 'egyptian-arabic',
		'egyptian-arabic': 'egyptian-arabic',
		'alphabet': 'alphabet',
		'grammar': 'grammar'
	};

	const dialectName = dialectMap[dialect.toLowerCase()] || dialect.toLowerCase();
	const normalizedDialect = normalizeDialect(dialectName);

	// Filter curriculum based on dialect/module type
	let filteredCurriculum = curriculum;
	if (dialectName === 'alphabet') {
		filteredCurriculum = curriculum.filter(m => m.id === 'module-alphabet');
	} else if (dialectName === 'grammar') {
		filteredCurriculum = curriculum.filter(m => m.id === 'module-grammar');
	} else {
		// For dialects, exclude alphabet and grammar modules
		filteredCurriculum = curriculum.filter(m => m.id !== 'module-alphabet' && m.id !== 'module-grammar');
	}

	// Flatten filtered curriculum to get relevant topic IDs
	const allTopicIds = filteredCurriculum.flatMap(m => m.topics.map(t => t.id));
	
	// Check which lessons exist
	const existingLessonsAll = await checkExistingLessons(allTopicIds);
	
	// Filter to only show lessons that exist for this dialect/module
	// Note: checkExistingLessons returns directory names which are already normalized
	const existingLessons: Record<string, { exists: boolean; dialects?: string[] }> = {};
	for (const [topicId, info] of Object.entries(existingLessonsAll)) {
		if (info.exists && info.dialects) {
			// For alphabet and grammar, check if lesson exists (they're not dialect-specific)
			if (dialectName === 'alphabet' || dialectName === 'grammar') {
				// Check if lesson exists in any dialect (alphabet/grammar lessons might be stored under 'fusha' or a generic location)
				existingLessons[topicId] = {
					exists: true,
					dialects: info.dialects
				};
			} else {
				// For regular dialects, check if this lesson exists for the requested dialect
				// The dialects array contains normalized directory names (e.g., "darija", "egyptian-arabic")
				const existsForDialect = info.dialects.includes(normalizedDialect);
				existingLessons[topicId] = {
					exists: existsForDialect,
					dialects: existsForDialect ? [normalizedDialect] : []
				};
			}
		} else {
			existingLessons[topicId] = { exists: false };
		}
	}

	// Load user progress for this dialect if user is logged in
	const userProgress: Record<string, { status: string; completed_at?: number }> = {};
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
		curriculum: filteredCurriculum, // Return filtered curriculum
		dialect: dialectName, // Return the actual dialect name (not normalized) for use in API calls
		existingLessons,
		userProgress,
		isWhitelisted: isWhitelisted || false
	};
};

