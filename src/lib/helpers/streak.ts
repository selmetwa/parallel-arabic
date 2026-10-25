/**
 * Streak rules, in the learner's own time zone.
 *
 * A day is the learner's calendar day, so a streak doesn't break at UTC
 * midnight (4pm in California). Missing a day uses up a streak freeze if one
 * is held; a freeze is earned at every FREEZE_EVERY-th day in a row.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
export const FREEZE_EVERY = 7;
export const MAX_FREEZES = 2;
/** Badges for the longest streak reached. */
export const STREAK_BADGES = [
	{ days: 7, label: 'One week', emoji: '🔥' },
	{ days: 30, label: 'One month', emoji: '🌙' },
	{ days: 100, label: '100 days', emoji: '💯' }
] as const;

/** The time zone to use: the learner's if it's a real one, otherwise UTC. */
export function safeTimeZone(tz: string | null | undefined): string {
	if (!tz) return 'UTC';
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: tz });
		return tz;
	} catch {
		return 'UTC';
	}
}

/** "2026-10-10": the calendar day of `ts` in `tz`. */
export function localDayKey(ts: number, tz: string | null | undefined): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: safeTimeZone(tz),
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(ts);
}

/** The hour (0–23) of `ts` in `tz`. */
export function localHour(ts: number, tz: string | null | undefined): number {
	const hour = new Intl.DateTimeFormat('en-US', {
		timeZone: safeTimeZone(tz),
		hour: 'numeric',
		hourCycle: 'h23'
	}).format(ts);
	return Number(hour) % 24;
}

/**
 * Local hours (inclusive start, exclusive end) when the daily reminder may go
 * out, by the time the learner picked in onboarding. Seven hours each, so that
 * with cron runs six hours apart, and Hobby firing a cron anywhere within its
 * hour, every time zone still gets at least one run. Night wraps past midnight.
 */
export const REMINDER_WINDOWS = {
	morning: [6, 13],
	afternoon: [11, 18],
	evening: [16, 23],
	night: [20, 3]
} as const;

export type ReminderTime = keyof typeof REMINDER_WINDOWS;

/**
 * Whether a reminder may go out at this local hour. No choice means evening,
 * the only window there was before onboarding asked; 'off' means never.
 */
export function inReminderWindow(hour: number, window: string | null | undefined): boolean {
	if (window === 'off') return false;
	const [start, end] = REMINDER_WINDOWS[(window ?? 'evening') as ReminderTime] ?? REMINDER_WINDOWS.evening;
	return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

/**
 * "Day 6 of your 14-day goal. A few minutes keeps it going.", for reminders, while
 * the streak is short of the goal they set in onboarding. Null otherwise.
 */
export function streakGoalLine(streak: number | null, goal: number | null): string | null {
	if (!goal || !streak || streak >= goal) return null;
	return `Day ${streak} of your ${goal}-day goal. A few minutes keeps it going.`;
}

/** How far `tz`'s wall clock is ahead of UTC at `ts` (ms). */
function zoneOffset(ts: number, tz: string): number {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			hourCycle: 'h23',
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric'
		})
			.formatToParts(ts)
			.map((p) => [p.type, Number(p.value)])
	);
	const wall = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour % 24, parts.minute, parts.second);
	return wall - Math.floor(ts / 1000) * 1000;
}

/** When the learner's current calendar day began (ms), in `tz`. */
export function localDayStart(ts: number, tz: string | null | undefined): number {
	const zone = safeTimeZone(tz);
	const [y, m, d] = localDayKey(ts, zone).split('-').map(Number);
	const midnight = Date.UTC(y, m - 1, d);
	// Twice, so a day that starts on a daylight-saving change still lands on midnight.
	const first = midnight - zoneOffset(midnight, zone);
	return midnight - zoneOffset(first, zone);
}

/** Whole days from day key `a` to day key `b`. */
export function daysBetween(a: string, b: string): number {
	const toUtc = (key: string) => {
		const [y, m, d] = key.split('-').map(Number);
		return Date.UTC(y, m - 1, d);
	};
	return Math.round((toUtc(b) - toUtc(a)) / DAY_MS);
}

export interface StreakState {
	current: number;
	longest: number;
	freezes: number;
	/** When the learner was last active (ms), or null if never. */
	lastActivity: number | null;
	timezone: string | null;
}

export interface StreakUpdate {
	current: number;
	longest: number;
	freezes: number;
	/** Freezes used up to bridge missed days. */
	freezesUsed: number;
	/** Freezes earned by reaching a multiple of FREEZE_EVERY. */
	freezeEarned: boolean;
	/** False when the learner was already active today: nothing to write but the time. */
	newDay: boolean;
}

/** What activity now does to the streak. */
export function nextStreak(state: StreakState, now: number): StreakUpdate {
	const today = localDayKey(now, state.timezone);
	const gap =
		state.lastActivity === null ? Infinity : daysBetween(localDayKey(state.lastActivity, state.timezone), today);

	let current = state.current;
	let freezes = state.freezes;
	let freezesUsed = 0;

	if (gap <= 0) {
		// Already active today (a clock change can make the gap negative).
		current = Math.max(current, 1);
	} else if (gap === 1) {
		current = current + 1;
	} else if (Number.isFinite(gap) && gap - 1 <= freezes && current > 0) {
		freezesUsed = gap - 1;
		freezes -= freezesUsed;
		current = current + 1;
	} else {
		current = 1;
	}

	const freezeEarned = current > state.current && current % FREEZE_EVERY === 0 && freezes < MAX_FREEZES;
	if (freezeEarned) freezes += 1;

	return {
		current,
		longest: Math.max(state.longest, current),
		freezes,
		freezesUsed,
		freezeEarned,
		newDay: gap > 0
	};
}

/**
 * Whether the streak ends tonight unless the learner does something: they
 * were last active yesterday (their time) and haven't been today.
 */
export function streakAtRisk(state: StreakState, now: number): boolean {
	if (state.current <= 0 || state.lastActivity === null) return false;
	const gap = daysBetween(localDayKey(state.lastActivity, state.timezone), localDayKey(now, state.timezone));
	return gap === 1;
}

export function earnedBadges(longest: number) {
	return STREAK_BADGES.filter((b) => longest >= b.days);
}
