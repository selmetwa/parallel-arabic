/**
 * The habit questions in onboarding (docs/onboarding-questions-plan.md):
 * what's hard for them, how long a day, when to remind them, and a streak to
 * aim for. Shared by the screens, /api/onboarding and the reminder crons.
 */
import type { DailyGoal, GoalItem } from './daily-goal';

export type ChallengeId = 'listening' | 'speaking' | 'where_to_start' | 'motivation' | 'grammar' | 'vocabulary';

export const CHALLENGES: { id: ChallengeId; label: string; emoji: string }[] = [
	{ id: 'listening', label: 'Understanding people', emoji: '👂' },
	{ id: 'speaking', label: 'Speaking', emoji: '🗣️' },
	{ id: 'where_to_start', label: 'Where to start', emoji: '🧭' },
	{ id: 'motivation', label: 'Staying motivated', emoji: '💪' },
	{ id: 'grammar', label: 'Grammar', emoji: '📘' },
	{ id: 'vocabulary', label: 'Remembering words', emoji: '🧠' }
];

/** What the plan starts with, for the Building screen. */
export const CHALLENGE_FOCUS: Record<ChallengeId, string> = {
	listening: 'listening',
	speaking: 'speaking',
	where_to_start: 'a clear path',
	motivation: 'a daily habit',
	grammar: 'grammar',
	vocabulary: 'remembering words'
};

/**
 * Dialects with graded stories. The newest (Iraqi, Khaleeji, Saudi) have none
 * yet, so "understanding people" points them at audio and tap-to-translate.
 */
const STORY_DIALECTS = ['egyptian-arabic', 'levantine', 'fusha', 'darija'];

export interface ChallengeHelp {
	/** FEATURES slug, for the screenshot. */
	feature: string;
	title: string;
	body: string;
	/** What it adds to the daily goal. */
	goal: GoalItem;
	/** The Try-it step that tackles it, which gets a "this is the hard part" tag. */
	tryStep?: 'read' | 'conversation' | 'play';
	/** Where the plan screen sends them first, when it isn't the first lesson. */
	start?: { href: string; title: string };
}

/** How the app answers each challenge, shown right after they pick and used through the rest of onboarding. */
export function challengeHelp(id: ChallengeId, dialect: string, dialectName: string): ChallengeHelp {
	const name = dialectName || 'Arabic';
	switch (id) {
		case 'listening':
			return STORY_DIALECTS.includes(dialect)
				? {
						feature: 'arabic-reading-practice',
						title: 'Stories with audio',
						body: `Graded stories in ${name}, read aloud. Tap any word to hear it and see what it means.`,
						goal: { kind: 'story', target: 1 },
						tryStep: 'read',
						start: { href: '/stories', title: `A story in ${name}` }
					}
				: {
						feature: 'tap-to-translate',
						title: 'Hear every word',
						body: 'Every phrase comes with audio, and tapping a word shows what it means in context.',
						goal: { kind: 'review', target: 10 },
						tryStep: 'read'
					};
		case 'speaking':
			return {
				feature: 'arabic-conversation-practice',
				title: 'Speak from day one',
				body: `Talk out loud with the AI Tutor. It answers in ${name} and corrects you as you go.`,
				goal: { kind: 'speak', target: 5 },
				tryStep: 'conversation',
				start: { href: '/tutor', title: 'A conversation with your tutor' }
			};
		case 'where_to_start':
			return {
				feature: 'arabic-course',
				title: 'A clear path',
				body: 'Short lessons in order, from your level to your goal. One a day is enough.',
				goal: { kind: 'lesson', target: 1 }
			};
		case 'motivation':
			return {
				feature: 'learn-arabic-by-playing',
				title: 'Small wins every day',
				body: 'A daily goal, a streak and quick games, so even five minutes counts.',
				goal: { kind: 'game', target: 1 },
				tryStep: 'play'
			};
		case 'grammar':
			return {
				feature: 'arabic-verb-conjugation-practice',
				title: 'Grammar in small pieces',
				body: `Verb tables for ${name}, and drills until the forms come without thinking.`,
				goal: { kind: 'lesson', target: 1 },
				start: { href: `/${dialect}/conjugations`, title: `${name} verb tables` }
			};
		case 'vocabulary':
			return {
				feature: 'arabic-spaced-repetition',
				title: 'Words that stick',
				body: "Save any word and it comes back right before you'd forget it.",
				goal: { kind: 'review', target: 10 },
				tryStep: 'play'
			};
	}
}

export function parseChallenges(raw: unknown): ChallengeId[] | null {
	if (!Array.isArray(raw)) return null;
	const ids = CHALLENGES.map((c) => c.id) as string[];
	const picked = [...new Set(raw)].filter((v): v is ChallengeId => ids.includes(v));
	return picked.length ? picked : null;
}

export const DAILY_MINUTES = [5, 10, 15, 20, 30] as const;
export type DailyMinutes = (typeof DAILY_MINUTES)[number];

export function isDailyMinutes(value: unknown): value is DailyMinutes {
	return DAILY_MINUTES.includes(value as DailyMinutes);
}

/** A word for each stop on the slider. */
export const MINUTES_LABEL: Record<DailyMinutes, string> = {
	5: 'a quick habit',
	10: 'steady',
	15: 'solid commitment',
	20: 'serious',
	30: 'all in'
};

/**
 * Rough new words a month at this pace, for the slider's chip. A placeholder
 * estimate (ten a month for each daily minute); confirm before relying on it.
 */
export function wordsPerMonth(minutes: DailyMinutes): number {
	return minutes * 10;
}

/** How many things the daily goal asks for at this pace. */
function goalSize(minutes: DailyMinutes): number {
	return minutes <= 5 ? 1 : minutes <= 15 ? 2 : 3;
}

/**
 * The daily goal: the time sets how many items, their challenges which ones
 * (in the order they picked), topped up from the old presets.
 */
export function buildGoal(
	minutes: DailyMinutes,
	challenges: ChallengeId[],
	dialect: string
): DailyGoal {
	const items: GoalItem[] = [];
	const add = (item: GoalItem) => {
		if (items.length < goalSize(minutes) && !items.some((i) => i.kind === item.kind)) items.push(item);
	};
	for (const id of challenges) add(challengeHelp(id, dialect, '').goal);
	for (const item of minutesToGoal(minutes)) add(item);
	// Twenty minutes or more reviews twenty words, as the old Serious preset did.
	return items.map((i) => (i.kind === 'review' && minutes >= 20 ? { ...i, target: 20 } : i));
}

/** The daily goal a time budget turns into, from the presets the old goal picker offered. */
export function minutesToGoal(minutes: DailyMinutes): DailyGoal {
	if (minutes <= 5) return [{ kind: 'review', target: 10 }];
	if (minutes <= 15)
		return [
			{ kind: 'review', target: 10 },
			{ kind: 'game', target: 1 }
		];
	return [
		{ kind: 'review', target: 20 },
		{ kind: 'game', target: 1 },
		{ kind: 'lesson', target: 1 }
	];
}

export type ReminderWindow = 'morning' | 'afternoon' | 'evening' | 'night' | 'off';

export const REMINDER_OPTIONS: { id: ReminderWindow; label: string; hint: string; emoji: string }[] = [
	{ id: 'morning', label: 'Morning', hint: 'before lunch', emoji: '🌅' },
	{ id: 'afternoon', label: 'Afternoon', hint: 'after lunch', emoji: '☀️' },
	{ id: 'evening', label: 'Evening', hint: 'after work', emoji: '🌆' },
	{ id: 'night', label: 'Night', hint: 'before bed', emoji: '🌙' },
	{ id: 'off', label: 'No reminders', hint: "I'll remember myself", emoji: '🔕' }
];

export function isReminderWindow(value: unknown): value is ReminderWindow {
	return REMINDER_OPTIONS.some((o) => o.id === value);
}

export const STREAK_GOALS = [
	{ days: 7, label: 'Good' },
	{ days: 14, label: 'Great' },
	{ days: 30, label: 'Incredible' },
	{ days: 50, label: 'Unstoppable' }
] as const;

export function isStreakGoal(value: unknown): value is number {
	return STREAK_GOALS.some((g) => g.days === value);
}
