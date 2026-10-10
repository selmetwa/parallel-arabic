import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { sendStreakReminderEmail } from '$lib/server/email';
import { localHour, streakAtRisk } from '$lib/helpers/streak';

/**
 * Local hours (inclusive start, exclusive end) when a reminder may go out.
 * Seven hours, so that with runs six hours apart, and Hobby firing a cron
 * anywhere within its hour, every time zone still gets at least one run.
 */
const EVENING = [16, 23] as const;
/** Never twice in one evening, whichever of the day's runs gets there first. */
const RESEND_AFTER_MS = 12 * 60 * 60 * 1000;
const LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000;

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

		const { data: users, error: fetchError } = await supabase
			.from('user')
			.select('id, email, current_streak, longest_streak, streak_freezes, last_activity_date, timezone, streak_reminder_sent_at')
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
						await sendStreakReminderEmail(user.email, user.current_streak, user.id);
						await supabase.from('user').update({ streak_reminder_sent_at: now }).eq('id', user.id);
						emailsSent++;
					} catch (err) {
						console.error(`Failed to send streak reminder to user ${user.id}:`, err);
					}
				})
			);
		}

		return json({ success: true, emailsSent, considered: users?.length ?? 0 });
	} catch (error) {
		console.error('Error in send-streak-reminders cron job:', error);
		return json(
			{ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
