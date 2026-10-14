import { supabase } from '$lib/supabaseClient';
import type { ActivityCounts } from '$lib/constants/daily-goal';

/** Activity with no table of its own: a game round started, a sentence spoken. */
export type LoggedActivity = 'game' | 'speak';

/** Fire-and-forget: a missed row only undercounts a daily goal. */
export async function logActivity(userId: string, kind: LoggedActivity): Promise<void> {
	const { error } = await supabase
		.from('activity_event')
		.insert({ user_id: userId, kind, created_at: Date.now() });
	if (error) console.error('Error logging activity:', error.message);
}

/** How much of each daily-goal activity the learner did from `since` (ms) on. */
export async function countActivity(userId: string, since: number): Promise<ActivityCounts> {
	const count = (query: PromiseLike<{ count: number | null }>) =>
		Promise.resolve(query).then(
			(r) => r.count ?? 0,
			() => 0
		);
	const head = { count: 'exact', head: true } as const;

	const [review, game, speak, tutor, lesson, story] = await Promise.all([
		count(
			supabase
				.from('word_review')
				.select('id', head)
				.eq('user_id', userId)
				.gte('reviewed_at', since)
		),
		count(
			supabase
				.from('activity_event')
				.select('id', head)
				.eq('user_id', userId)
				.eq('kind', 'game')
				.gte('created_at', since)
		),
		count(
			supabase
				.from('activity_event')
				.select('id', head)
				.eq('user_id', userId)
				.eq('kind', 'speak')
				.gte('created_at', since)
		),
		count(
			supabase
				.from('tutor_conversation')
				.select('id', head)
				.eq('user_id', userId)
				.gte('created_at', since)
		),
		count(
			supabase
				.from('structured_lesson_progress')
				.select('id', head)
				.eq('user_id', userId)
				.eq('status', 'completed')
				// Lesson progress is stamped in seconds, not ms.
				.gte('completed_at', Math.floor(since / 1000))
		),
		count(
			supabase
				.from('user_story_completion')
				.select('id', head)
				.eq('user_id', userId)
				.gte('completed_at', since)
		)
	]);

	return { review, game, speak, tutor, lesson, story };
}
