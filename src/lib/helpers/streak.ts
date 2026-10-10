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
