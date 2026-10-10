import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '$lib/supabaseClient';
import { awardXp } from '$lib/helpers/award-xp';
import { touchStreak } from '$lib/helpers/track-activity';
import { puzzleNumber } from '$lib/games/daily-root';
import { TODAY_BONUS_EVENTS, challengeDate } from '$lib/games/today';
import { isGameDialect } from '$lib/games/themes';

/**
 * Record today's challenge as done and pay its bonus, once per day. The row's
 * unique (user_id, challenge_date) key makes a second claim a no-op.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = (locals as { user?: { id?: string } | null }).user?.id;
	if (!userId) return json({ ok: false }, { status: 401 });

	const { dialect } = await request.json().catch(() => ({}));
	const now = Date.now();
	const { error } = await supabase.from('daily_challenge').insert({
		id: uuidv4(),
		user_id: userId,
		challenge_date: challengeDate(puzzleNumber(now)),
		challenge_type: 'game',
		dialect: isGameDialect(dialect) ? dialect : 'egyptian-arabic',
		bonus_xp: 0,
		completed: true,
		completed_at: now,
		xp_awarded: true,
		created_at: now
	});

	if (error) {
		// 23505: already claimed today.
		if (error.code === '23505') return json({ ok: true, alreadyDone: true, xpAwarded: 0 });
		console.error('Could not record the daily challenge:', error);
		return json({ ok: false }, { status: 500 });
	}

	let xpAwarded = 0;
	for (let i = 0; i < TODAY_BONUS_EVENTS; i++) {
		const result = await awardXp(userId, 'challenge_bonus');
		if (result.success) xpAwarded += result.xpAwarded;
	}
	await supabase
		.from('daily_challenge')
		.update({ bonus_xp: xpAwarded })
		.eq('user_id', userId)
		.eq('challenge_date', challengeDate(puzzleNumber(now)));
	await touchStreak(userId);
	return json({ ok: true, alreadyDone: false, xpAwarded });
};
