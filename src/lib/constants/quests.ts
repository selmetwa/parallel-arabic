/**
 * Side quests: three small objectives the app picks each day, with a reward
 * for finishing all three (docs/today-path-and-quests-plan.md, Part 2). The
 * main quest is today's path (src/lib/helpers/today-path.ts).
 *
 * The pick is seeded by user and local date, so nothing needs storing until
 * the reward is claimed.
 */
import type { ActivityCounts, GoalKind } from './daily-goal';

export const QUESTS_PER_DAY = 3;
/** Days with all quests done in one week that earn a streak freeze. */
export const QUEST_DAYS_FOR_FREEZE = 5;

export type QuestId =
	| 'review'
	| 'save'
	| 'speak'
	| 'write'
	| 'games'
	| 'lesson'
	| 'tutor'
	| 'story';

/** The daily-goal counts plus what only quests use. */
export interface QuestCounts extends ActivityCounts {
	saved: number;
	tutorMessages: number;
}

interface QuestDef {
	id: QuestId;
	label: string;
	target: number;
	/** Where it's done, or null for quests done along the way (with a hint instead). */
	href: string | null;
	hint?: string;
	count: (c: QuestCounts) => number;
	/** The goal kind this repeats, so quests can avoid what's already on the path. */
	overlaps?: GoalKind;
}

export const QUESTS: QuestDef[] = [
	{ id: 'review', label: 'Review 15 words', target: 15, href: '/review', count: (c) => c.review, overlaps: 'review' },
	{ id: 'save', label: 'Save 3 new words', target: 3, href: null, hint: 'Tap any word in a story or lesson to save it', count: (c) => c.saved },
	{ id: 'speak', label: 'Say 5 sentences out loud', target: 5, href: '/speak', count: (c) => c.speak, overlaps: 'speak' },
	{ id: 'write', label: 'Write 3 sentences', target: 3, href: '/sentences', count: (c) => c.write, overlaps: 'write' },
	{ id: 'games', label: 'Play 2 games', target: 2, href: '/learn/game', count: (c) => c.game, overlaps: 'game' },
	{ id: 'lesson', label: 'Finish a lesson', target: 1, href: '/lessons', count: (c) => c.lesson, overlaps: 'lesson' },
	{ id: 'tutor', label: 'Send 6 messages to your tutor', target: 6, href: '/tutor', count: (c) => c.tutorMessages, overlaps: 'tutor' },
	{ id: 'story', label: 'Read a story', target: 1, href: '/stories', count: (c) => c.story, overlaps: 'story' },
];

export interface QuestEligibility {
	/** Words reviewed today plus words still due: a review quest needs 15. */
	reviewable: number;
	/** The lesson the path would open, or null when there's none. */
	lessonHref: string | null;
	/** Kinds already in the main quest. */
	goalKinds: GoalKind[];
}

function canDo(q: QuestDef, e: QuestEligibility): boolean {
	if (q.id === 'review') return e.reviewable >= q.target;
	if (q.id === 'lesson') return !!e.lessonHref;
	return true;
}

/** FNV-1a: a stable number from a string. */
function hash(s: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

/** mulberry32: a small seeded random number generator. */
function seeded(seed: number) {
	let a = seed;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Today's three quests for this learner: the same all day, different tomorrow.
 * Only quests they can do, preferring ones not already in the main quest.
 */
export function pickQuests(userId: string, dayKey: string, e: QuestEligibility): QuestDef[] {
	const random = seeded(hash(`${userId}:${dayKey}`));
	const shuffled = QUESTS.map((q) => ({ q, r: random() }))
		.sort((a, b) => a.r - b.r)
		.map(({ q }) => q)
		.filter((q) => canDo(q, e));

	const fresh = shuffled.filter((q) => !q.overlaps || !e.goalKinds.includes(q.overlaps));
	const repeats = shuffled.filter((q) => !fresh.includes(q));
	const picked = [...fresh, ...repeats].slice(0, QUESTS_PER_DAY);
	// Keep a fixed order on screen, whatever the shuffle.
	return QUESTS.filter((q) => picked.includes(q)).map((q) =>
		q.id === 'lesson' && e.lessonHref ? { ...q, href: e.lessonHref } : q
	);
}

export interface QuestProgress {
	id: QuestId;
	label: string;
	href: string | null;
	hint: string | null;
	target: number;
	done: number;
	complete: boolean;
}

export function questProgress(quests: QuestDef[], counts: QuestCounts): QuestProgress[] {
	return quests.map((q) => {
		const done = Math.min(q.count(counts), q.target);
		return { id: q.id, label: q.label, href: q.href, hint: q.hint ?? null, target: q.target, done, complete: done >= q.target };
	});
}

/** "2026-11-23", the Monday of the week holding `dayKey`. */
export function weekStartKey(dayKey: string): string {
	const [y, m, d] = dayKey.split('-').map(Number);
	const date = new Date(Date.UTC(y, m - 1, d));
	const back = (date.getUTCDay() + 6) % 7;
	date.setUTCDate(date.getUTCDate() - back);
	return date.toISOString().slice(0, 10);
}

export interface QuestsState {
	items: QuestProgress[];
	completed: number;
	allDone: boolean;
	/** Today's reward is already paid. */
	claimed: boolean;
	/** Days this week (Monday on) with the reward claimed, today included. */
	weekClaims: number;
	daysForFreeze: number;
}
