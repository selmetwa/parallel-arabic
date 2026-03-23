import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { awardXp } from '$lib/helpers/award-xp';
import type { XpEventType } from '$lib/helpers/xp-levels';

const VALID_EVENT_TYPES: XpEventType[] = ['review_cycle', 'review_correct', 'sentence_correct', 'story_complete', 'game_correct', 'challenge_bonus', 'conjugation_correct'];

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, safeGetSession } = locals;
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { eventType, storyId } = body;

		if (!VALID_EVENT_TYPES.includes(eventType)) {
			return json({ success: false, error: 'Invalid event type' }, { status: 400 });
		}

		// Deduplicate story completions
		if (eventType === 'story_complete') {
			if (!storyId) {
				return json({ success: false, error: 'storyId required for story_complete' }, { status: 400 });
			}

			const { data: existing } = await supabase
				.from('user_story_completion')
				.select('id')
				.eq('user_id', user.id)
				.eq('story_id', storyId)
				.maybeSingle();

			if (existing) {
				return json({ success: false, alreadyCompleted: true });
			}

			const result = await awardXp(user.id, eventType, supabase);

			if (result.success) {
				const now = Date.now();
				await supabase.from('user_story_completion').insert({
					id: `${user.id}-${storyId}`,
					user_id: user.id,
					story_id: storyId,
					completed_at: now,
					created_at: now
				});
			}

			return json(result);
		}

		const result = await awardXp(user.id, eventType, supabase);
		return json(result);
	} catch (error) {
		console.error('Error in award-xp endpoint:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
