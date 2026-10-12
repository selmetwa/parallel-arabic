/**
 * Which push notification, if any, a learner is due right now.
 *
 * At most one a day, in the evening of their own time zone. What they get
 * depends on how long they have been away:
 *
 *   never started, the day after onboarding  → first_day
 *   active yesterday, streak ends tonight    → streak
 *   away 1–2 days, no streak to lose         → reviews (only if enough are due)
 *   away 3 days, and again at 7              → comeback
 *
 * After day 7 they hear nothing more until they come back.
 */
import { daysBetween, localDayKey, localHour, streakAtRisk } from './streak';

export type PushKind = 'streak' | 'first_day' | 'comeback' | 'reviews';

/** Fewer due words than this is not worth a notification. */
export const REVIEWS_MIN = 10;

/** Local hours (inclusive start, exclusive end) when a push may go out. Matches the streak email. */
const EVENING = [16, 23] as const;
/** Never twice in one evening, whichever of the day's cron runs gets there first. */
const RESEND_AFTER_MS = 12 * 60 * 60 * 1000;
const COMEBACK_DAYS = [3, 7];

export interface PushUser {
	current_streak: number | null;
	longest_streak: number | null;
	streak_freezes: number | null;
	last_activity_date: number | null;
	onboarding_completed_at: number | null;
	timezone: string | null;
	push_sent_at: number | null;
}

/** 'reviews' still depends on how many words are due: the caller checks REVIEWS_MIN. */
export function pickPush(user: PushUser, now: number): PushKind | null {
	const hour = localHour(now, user.timezone);
	if (hour < EVENING[0] || hour >= EVENING[1]) return null;
	if (user.push_sent_at && now - user.push_sent_at < RESEND_AFTER_MS) return null;

	const today = localDayKey(now, user.timezone);

	if (user.last_activity_date === null) {
		if (!user.onboarding_completed_at) return null;
		const sinceOnboarding = daysBetween(localDayKey(user.onboarding_completed_at, user.timezone), today);
		return sinceOnboarding === 1 ? 'first_day' : null;
	}

	const atRisk = streakAtRisk(
		{
			current: user.current_streak ?? 0,
			longest: user.longest_streak ?? 0,
			freezes: user.streak_freezes ?? 0,
			lastActivity: user.last_activity_date,
			timezone: user.timezone
		},
		now
	);
	if (atRisk) return 'streak';

	const away = daysBetween(localDayKey(user.last_activity_date, user.timezone), today);
	if (COMEBACK_DAYS.includes(away)) return 'comeback';
	if (away === 1 || away === 2) return 'reviews';
	return null;
}
