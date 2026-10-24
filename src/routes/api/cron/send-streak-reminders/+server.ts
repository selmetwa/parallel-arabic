import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recordCronRun } from '$lib/server/health-checks';
import { supabase } from '$lib/supabaseClient';
import { sendBrandedEmail, sendStreakReminderEmail } from '$lib/server/email';
import { daysBetween, localDayKey, localHour, streakAtRisk } from '$lib/helpers/streak';
import { dueWordCount, sendPushReminders } from '$lib/server/push-reminders';
import { comebackEmail, nextStep } from '$lib/server/retention-email';
import { describeGoal, parseGoal } from '$lib/constants/daily-goal';

/**
 * Local hours (inclusive start, exclusive end) when a reminder may go out.
 * Seven hours, so that with runs six hours apart, and Hobby firing a cron
 * anywhere within its hour, every time zone still gets at least one run.
 */
const EVENING = [16, 23] as const;
/** Never twice in one evening, whichever of the day's runs gets there first. */
const RESEND_AFTER_MS = 12 * 60 * 60 * 1000;
const LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000;
/** Days away after which a learner gets a comeback email, as the push plan does. */
const COMEBACK_DAYS = [3, 7];
const COMEBACK_LOOKBACK_MS = 9 * 24 * 60 * 60 * 1000;

const goalTextOf = (raw: unknown) => {
	const goal = parseGoal(raw);
	return goal ? describeGoal(goal) : null;
};

/**
 * Runs four times a day, six hours apart (four daily crons in vercel.json,
 * because the Hobby plan only allows daily schedules). Every time zone has
 * at least one run in its 16:00–23:00 evening, and that run emails learners
 * whose streak ends tonight: active yesterday (their time), not yet today.
 */
export const GET: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	const cronSecret = process.env.CRON_SECRET;

	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const now = Date.now();

		// Pushes go first: a streak push stamps streak_reminder_sent_at, so app
		// users don't also get the email below. A push failure must not stop the emails.
		const pushesSent = await sendPushReminders(now).catch((err) => {
			console.error('Error sending push reminders:', err);
			return 0;
		});

		const { data: users, error: fetchError } = await supabase
			.from('user')
			.select('id, email, current_streak, longest_streak, streak_freezes, last_activity_date, timezone, streak_reminder_sent_at, daily_goal')
			.eq('email_notifications_enabled', true)
			.gt('current_streak', 0)
			.gte('last_activity_date', now - LOOKBACK_MS)
			.not('email', 'is', null);

		if (fetchError) {
			console.error('Error fetching users for streak reminders:', fetchError);
			return json({ error: 'Failed to fetch users' }, { status: 500 });
		}

		const due = (users ?? []).filter((u) => {
			const hour = localHour(now, u.timezone);
			if (hour < EVENING[0] || hour >= EVENING[1]) return false;
			if (u.streak_reminder_sent_at && now - u.streak_reminder_sent_at < RESEND_AFTER_MS) return false;
			return streakAtRisk(
				{
					current: u.current_streak ?? 0,
					longest: u.longest_streak ?? 0,
					freezes: u.streak_freezes ?? 0,
					lastActivity: u.last_activity_date,
					timezone: u.timezone
				},
				now
			);
		});

		let emailsSent = 0;
		const BATCH_SIZE = 50;
		for (let i = 0; i < due.length; i += BATCH_SIZE) {
			await Promise.allSettled(
				due.slice(i, i + BATCH_SIZE).map(async (user) => {
					try {
						await sendStreakReminderEmail(user.email, user.current_streak, user.id, goalTextOf(user.daily_goal));
						await supabase.from('user').update({ streak_reminder_sent_at: now }).eq('id', user.id);
						emailsSent++;
					} catch (err) {
						console.error(`Failed to send streak reminder to user ${user.id}:`, err);
					}
				})
			);
		}

		const comebacksSent = await sendComebackEmails(now).catch((err) => {
			console.error('Error sending comeback emails:', err);
			return 0;
		});

		await recordCronRun('send-streak-reminders');
		return json({ success: true, emailsSent, comebacksSent, pushesSent, considered: users?.length ?? 0 });
	} catch (error) {
		console.error('Error in send-streak-reminders cron job:', error);
		return json(
			{ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};

/**
 * Learners away for 3 or 7 days (their time), in their evening: one email that
 * replays what they built and links straight back to it (Value Replay). App
 * users who got a push this evening are skipped.
 */
async function sendComebackEmails(now: number): Promise<number> {
	const { data: users, error } = await supabase
		.from('user')
		.select(
			'id, email, last_activity_date, timezone, push_sent_at, comeback_email_sent_at, total_lessons_viewed, daily_goal, last_content_type, last_content_id, last_content_dialect, last_content_position'
		)
		.eq('email_notifications_enabled', true)
		.not('email', 'is', null)
		.gte('last_activity_date', now - COMEBACK_LOOKBACK_MS);
	if (error) throw error;

	const due = (users ?? []).filter((u) => {
		const hour = localHour(now, u.timezone);
		if (hour < EVENING[0] || hour >= EVENING[1]) return false;
		if (u.comeback_email_sent_at && now - u.comeback_email_sent_at < RESEND_AFTER_MS) return false;
		if (u.push_sent_at && now - u.push_sent_at < RESEND_AFTER_MS) return false;
		const away = daysBetween(localDayKey(u.last_activity_date, u.timezone), localDayKey(now, u.timezone));
		return COMEBACK_DAYS.includes(away);
	});

	let sent = 0;
	for (const user of due) {
		try {
			const [dueWords, { count: deckSize }] = await Promise.all([
				dueWordCount(user.id, now),
				supabase.from('saved_word').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
			]);
			const day = daysBetween(localDayKey(user.last_activity_date, user.timezone), localDayKey(now, user.timezone));
			await sendBrandedEmail(
				user.email,
				comebackEmail({
					day,
					dueWords,
					deckSize: deckSize ?? 0,
					totalLessons: user.total_lessons_viewed ?? 0,
					goalText: goalTextOf(user.daily_goal),
					next: nextStep(user)
				})
			);
			await supabase.from('user').update({ comeback_email_sent_at: now }).eq('id', user.id);
			sent++;
		} catch (err) {
			console.error(`Failed to send comeback email to user ${user.id}:`, err);
		}
	}
	return sent;
}
