import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { sendBrandedEmail } from '$lib/server/email';
import { countActivity } from '$lib/server/activity';
import { dueWordCount } from '$lib/server/push-reminders';
import { nextStep, weeklyRecapEmail } from '$lib/server/retention-email';
import { describeGoal, parseGoal } from '$lib/constants/daily-goal';
import { isPaywalled } from '$lib/server/paywall-experiment';
import { checkUserSubscription } from '$lib/helpers/subscription';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Free learners quiet for longer than this get nothing; subscribers always get one. */
const ACTIVE_WITHIN_MS = 30 * DAY_MS;
/** A retried run mustn't send the same week twice. */
const RESEND_AFTER_MS = 6 * DAY_MS;
const BATCH_SIZE = 10;

type Recipient = {
	id: string;
	email: string;
	is_subscriber: boolean | null;
	current_streak: number | null;
	longest_streak: number | null;
	total_lessons_viewed: number | null;
	daily_goal: unknown;
	last_content_type: string | null;
	last_content_id: string | null;
	last_content_dialect: string | null;
	last_content_position: number | null;
	weekly_email_sent_at: number | null;
	paywall_variant: string | null;
	onboarding_completed: boolean | null;
	subscription_end_date: number | null;
};

const count = (query: PromiseLike<{ count: number | null }>) =>
	Promise.resolve(query).then((r) => r.count ?? 0);

async function sendRecap(user: Recipient, now: number): Promise<boolean> {
	const since = now - 7 * DAY_MS;
	const head = { count: 'exact', head: true } as const;

	const [counts, daysActive, wordsSaved, deckSize, dueWords] = await Promise.all([
		countActivity(user.id, since),
		count(
			supabase
				.from('user_daily_activity')
				.select('id', head)
				.eq('user_id', user.id)
				.gte('activity_date', since)
		),
		count(
			supabase.from('saved_word').select('id', head).eq('user_id', user.id).gte('created_at', since)
		),
		count(supabase.from('saved_word').select('id', head).eq('user_id', user.id)),
		dueWordCount(user.id, now)
	]);

	const goal = parseGoal(user.daily_goal);
	const email = weeklyRecapEmail({
		daysActive,
		counts,
		wordsSaved,
		streak: user.current_streak ?? 0,
		longestStreak: user.longest_streak ?? 0,
		deckSize,
		dueWords,
		totalLessons: user.total_lessons_viewed ?? 0,
		isSubscriber: !!user.is_subscriber,
		goalText: goal ? describeGoal(goal) : null,
		next: nextStep(user)
	});
	if (!email) return false;

	await sendBrandedEmail(user.email, email);
	await supabase.from('user').update({ weekly_email_sent_at: now }).eq('id', user.id);
	return true;
}

/**
 * Sunday afternoon (UTC): each learner's week, replayed back to them (Value
 * Replay). Subscribers who didn't practise get a version that reminds them
 * what they've built and what their plan includes.
 */
export const GET: RequestHandler = async ({ request }) => {
	const cronSecret = process.env.CRON_SECRET;
	if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const now = Date.now();
	const { data: users, error } = await supabase
		.from('user')
		.select(
			'id, email, is_subscriber, current_streak, longest_streak, total_lessons_viewed, daily_goal, last_content_type, last_content_id, last_content_dialect, last_content_position, weekly_email_sent_at, paywall_variant, onboarding_completed, subscription_end_date'
		)
		.eq('email_notifications_enabled', true)
		.not('email', 'is', null)
		.or(`is_subscriber.eq.true,last_activity_date.gte.${now - ACTIVE_WITHIN_MS}`);

	if (error) {
		console.error('Error fetching users for weekly recap:', error);
		return json({ error: 'Failed to fetch users' }, { status: 500 });
	}

	let sent = 0;
	const recipients = ((users ?? []) as Recipient[]).filter(
		(u) =>
			(!u.weekly_email_sent_at || now - u.weekly_email_sent_at > RESEND_AFTER_MS) &&
			// Behind the hard paywall, every link in the recap leads back to /paywall.
			!isPaywalled(u, checkUserSubscription(u))
	);
	for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
		await Promise.allSettled(
			recipients.slice(i, i + BATCH_SIZE).map(async (user) => {
				try {
					if (await sendRecap(user, now)) sent++;
				} catch (err) {
					console.error(`Failed to send weekly recap to user ${user.id}:`, err);
				}
			})
		);
	}

	return json({ success: true, sent, considered: recipients.length });
};
