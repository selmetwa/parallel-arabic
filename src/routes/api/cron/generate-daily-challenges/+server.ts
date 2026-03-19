import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { generateDailyChallenge } from '$lib/server/challenge-generator';

const BATCH_SIZE = parseInt(process.env.CHALLENGE_BATCH_SIZE ?? '15');
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function getTodayMidnight(): number {
	const now = new Date();
	return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * GET /api/cron/generate-daily-challenges
 *
 * Vercel cron job that pre-generates daily challenges for users
 * who have been active in the last 3 days.
 *
 * Schedule: "0 2 * * *" (02:00 UTC daily)
 */
export const GET: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	const cronSecret = process.env.CRON_SECRET;

	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const todayMidnight = getTodayMidnight();
	const threeDaysAgo = Date.now() - THREE_DAYS_MS;

	let generated = 0;
	let errors = 0;

	try {
		// Find users active in last 3 days who don't have today's challenge yet
		const { data: activeUsers, error: fetchError } = await supabase
			.from('user')
			.select('id, target_dialect, proficiency_level')
			.gte('last_activity_date', threeDaysAgo)
			.not('id', 'in', `(SELECT user_id FROM daily_challenge WHERE challenge_date = ${todayMidnight})`)
			.limit(BATCH_SIZE);

		if (fetchError) {
			console.error('Error fetching active users:', fetchError);
			return json({ error: 'Failed to fetch active users' }, { status: 500 });
		}

		if (!activeUsers || activeUsers.length === 0) {
			return json({ success: true, message: 'No users need challenges', generated: 0, errors: 0 });
		}

		// Process users sequentially to avoid Gemini rate limits
		for (const userData of activeUsers) {
			try {
				const dialect = userData.target_dialect ?? 'egyptian-arabic';
				const proficiencyLevel = userData.proficiency_level ?? 'A1';

				// Fetch saved words for this user
				const { data: savedWords } = await supabase
					.from('saved_word')
					.select('arabic_word, english_word, transliterated_word')
					.eq('user_id', userData.id)
					.eq('dialect', dialect)
					.order('created_at', { ascending: false })
					.limit(10);

				const result = await generateDailyChallenge(
					userData.id,
					dialect,
					savedWords ?? [],
					todayMidnight,
					proficiencyLevel
				);

				if ('error' in result) {
					console.error(`Challenge generation failed for user ${userData.id}:`, result.error);
					errors++;
				} else {
					generated++;
				}
			} catch (e) {
				console.error(`Unexpected error for user ${userData.id}:`, e);
				errors++;
			}
		}

		return json({
			success: true,
			message: `Generated ${generated} challenge(s), ${errors} error(s)`,
			generated,
			errors,
			todayMidnight
		});
	} catch (e) {
		console.error('Cron error:', e);
		return json(
			{ error: 'Internal server error', message: e instanceof Error ? e.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};

/**
 * POST endpoint for manual testing
 */
export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	const cronSecret = process.env.CRON_SECRET;

	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	return GET({ request } as Parameters<typeof GET>[0]);
};
