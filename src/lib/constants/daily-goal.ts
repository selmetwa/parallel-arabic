/**
 * The daily goal: up to three things a learner commits to doing each day,
 * chosen from across the app rather than just reviews (docs/retention-daily-goal-plan.md).
 */

export type GoalKind = 'review' | 'game' | 'speak' | 'tutor' | 'lesson' | 'story';

export interface GoalItem {
	kind: GoalKind;
	target: number;
}

export type DailyGoal = GoalItem[];

/** How much of each kind was done in a period. */
export type ActivityCounts = Record<GoalKind, number>;

interface GoalKindInfo {
	/** The activity, for the goal picker: "Review words". */
	name: string;
	/** What the learner commits to, e.g. "Review 10 words". */
	label: (target: number) => string;
	/** Amounts to pick from; one amount means there's nothing to pick. */
	amounts: number[];
	/** What the amounts count, for the picker. */
	unit: string;
	href: string;
}

export const GOAL_KINDS: Record<GoalKind, GoalKindInfo> = {
	review: {
		name: 'Review words',
		label: (n) => `Review ${n} words`,
		amounts: [10, 20, 30],
		unit: 'words',
		href: '/review'
	},
	game: {
		name: 'Play games',
		label: (n) => (n === 1 ? 'Play a game' : `Play ${n} games`),
		amounts: [1, 2, 3],
		unit: 'games',
		href: '/learn/game'
	},
	speak: {
		name: 'Speak out loud',
		label: (n) => `Say ${n} sentences out loud`,
		amounts: [5, 10, 20],
		unit: 'sentences',
		href: '/speak'
	},
	tutor: {
		name: 'Talk with your tutor',
		label: () => 'Talk with your tutor',
		amounts: [1],
		unit: 'conversation',
		href: '/tutor'
	},
	lesson: {
		name: 'Finish a lesson',
		label: () => 'Finish a lesson',
		amounts: [1],
		unit: 'lesson',
		href: '/lessons'
	},
	story: {
		name: 'Read a story',
		label: () => 'Read a story',
		amounts: [1],
		unit: 'story',
		href: '/stories'
	}
};

export const GOAL_KIND_ORDER: GoalKind[] = ['review', 'game', 'speak', 'tutor', 'lesson', 'story'];

export const MAX_GOAL_ITEMS = 3;

export const NO_ACTIVITY: ActivityCounts = {
	review: 0,
	game: 0,
	speak: 0,
	tutor: 0,
	lesson: 0,
	story: 0
};

/** A stored or submitted goal, or null if it isn't a valid one. */
export function parseGoal(raw: unknown): DailyGoal | null {
	if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_GOAL_ITEMS) return null;
	const seen = new Set<GoalKind>();
	const goal: DailyGoal = [];
	for (const item of raw) {
		const kind = item?.kind as GoalKind;
		const info = GOAL_KINDS[kind];
		if (!info || seen.has(kind) || !info.amounts.includes(item?.target)) return null;
		seen.add(kind);
		goal.push({ kind, target: item.target });
	}
	return goal;
}

export interface GoalProgressItem extends GoalItem {
	label: string;
	href: string;
	done: number;
	complete: boolean;
}

export function goalProgress(goal: DailyGoal, counts: ActivityCounts) {
	const items: GoalProgressItem[] = goal.map((item) => {
		const done = Math.min(counts[item.kind] ?? 0, item.target);
		return {
			...item,
			label: GOAL_KINDS[item.kind].label(item.target),
			href: GOAL_KINDS[item.kind].href,
			done,
			complete: done >= item.target
		};
	});
	return {
		items,
		completed: items.filter((i) => i.complete).length,
		allDone: items.every((i) => i.complete)
	};
}

/** "review 10 words and play a game", for reminder emails. */
export function describeGoal(goal: DailyGoal): string {
	const parts = goal.map((item) => {
		const label = GOAL_KINDS[item.kind].label(item.target);
		return label.charAt(0).toLowerCase() + label.slice(1);
	});
	if (parts.length <= 1) return parts.join('');
	return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}
