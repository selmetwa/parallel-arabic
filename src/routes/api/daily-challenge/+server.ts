import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateDailyChallenge } from '$lib/server/challenge-generator';

function getTodayMidnight(): number {
	const now = new Date();
	return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * GET /api/daily-challenge
 * Returns today's challenge for the authenticated user, if one exists.
 */
export const GET: RequestHandler = async ({ locals }) => {
	const { supabase, safeGetSession } = locals;
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	const todayMidnight = getTodayMidnight();

	const { data: challenge, error } = await supabase
		.from('daily_challenge')
		.select('id, challenge_type, dialect, story_id, sentences, completed, bonus_xp')
		.eq('user_id', user.id)
		.eq('challenge_date', todayMidnight)
		.maybeSingle();

	if (error) {
		console.error('Error fetching daily challenge:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}

	return json({ success: true, challenge });
};

/**
 * POST /api/daily-challenge
 * Lazily generates today's challenge for the authenticated user.
 * Idempotent — safe to call multiple times (DB unique constraint guards duplicates).
 */
export const POST: RequestHandler = async ({ locals }) => {
	const { supabase, safeGetSession } = locals;
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	const todayMidnight = getTodayMidnight();

	// Check if a challenge already exists for today
	const { data: existing } = await supabase
		.from('daily_challenge')
		.select('id')
		.eq('user_id', user.id)
		.eq('challenge_date', todayMidnight)
		.maybeSingle();

	if (existing) {
		return json({ success: true, challengeId: existing.id, alreadyExists: true });
	}

	// Fetch user's dialect, proficiency level, and saved words
	const { data: userData } = await supabase
		.from('user')
		.select('target_dialect, proficiency_level')
		.eq('id', user.id)
		.single();

	const dialect = userData?.target_dialect ?? 'egyptian-arabic';
	const proficiencyLevel = userData?.proficiency_level ?? 'A1';

	const { data: savedWords } = await supabase
		.from('saved_word')
		.select('arabic_word, english_word, transliterated_word')
		.eq('user_id', user.id)
		.eq('dialect', dialect)
		.order('created_at', { ascending: false })
		.limit(10);

	const result = await generateDailyChallenge(
		user.id,
		dialect,
		savedWords ?? [],
		todayMidnight,
		proficiencyLevel
	);

	if ('error' in result) {
		console.error('Challenge generation error:', result.error);
		return json({ success: false, error: result.error }, { status: 500 });
	}

	return json({ success: true, challengeId: result.challengeId });
};
