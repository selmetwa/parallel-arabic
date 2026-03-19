import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { awardXp } from '$lib/helpers/award-xp';

/**
 * POST /api/daily-challenge/[id]/complete
 *
 * Marks a daily challenge as completed and awards bonus XP.
 * For story challenges: the story must already be completed (user_story_completion row must exist).
 * For sentence challenges: marks complete immediately.
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	const { supabase, safeGetSession } = locals;
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	const { id: challengeId } = params;

	// Fetch the challenge
	const { data: challenge, error: fetchError } = await supabase
		.from('daily_challenge')
		.select('id, user_id, challenge_type, story_id, completed, xp_awarded, bonus_xp')
		.eq('id', challengeId)
		.maybeSingle();

	if (fetchError || !challenge) {
		return json({ success: false, error: 'Challenge not found' }, { status: 404 });
	}

	if (challenge.user_id !== user.id) {
		return json({ success: false, error: 'Unauthorized' }, { status: 403 });
	}

	if (challenge.xp_awarded) {
		return json({ success: false, alreadyCompleted: true });
	}

	// For story challenges, verify the story was actually completed first
	if (challenge.challenge_type === 'story' && challenge.story_id) {
		const { data: storyCompletion } = await supabase
			.from('user_story_completion')
			.select('id')
			.eq('user_id', user.id)
			.eq('story_id', challenge.story_id)
			.maybeSingle();

		if (!storyCompletion) {
			return json({ success: false, error: 'Complete the story first' }, { status: 400 });
		}
	}

	// Award bonus XP
	const bonusResult = await awardXp(user.id, 'challenge_bonus', supabase);

	if (!bonusResult.success) {
		return json({ success: false, error: bonusResult.error }, { status: 500 });
	}

	// Mark challenge as completed
	const now = Date.now();
	await supabase
		.from('daily_challenge')
		.update({ completed: true, completed_at: now, xp_awarded: true })
		.eq('id', challengeId);

	return json({
		success: true,
		xpAwarded: bonusResult.xpAwarded,
		newTotalXp: bonusResult.newTotalXp,
		newLevel: bonusResult.newLevel,
		leveledUp: bonusResult.leveledUp
	});
};
