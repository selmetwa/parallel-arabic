/**
 * Today's path: the learner's daily goal as an ordered list of specific steps
 * with one "Continue" button (docs/today-path-and-quests-plan.md).
 *
 * Pure, so it can be tested; src/lib/server/today-path.ts gathers the inputs.
 */
import {
	GOAL_KINDS,
	type ActivityCounts,
	type DailyGoal,
	type GoalKind
} from '$lib/constants/daily-goal';

/** For learners who haven't picked a goal. */
export const DEFAULT_GOAL: DailyGoal = [
	{ kind: 'review', target: 10 },
	{ kind: 'lesson', target: 1 },
	{ kind: 'game', target: 1 }
];

/** Quick review first, then the lesson, then the rest. */
const STEP_ORDER: GoalKind[] = ['review', 'lesson', 'game', 'speak', 'write', 'tutor', 'story'];

export interface TodayStep {
	kind: GoalKind;
	label: string;
	href: string;
	done: number;
	target: number;
	complete: boolean;
}

export interface TodayPath {
	steps: TodayStep[];
	/** The first step not yet complete. */
	next: TodayStep | null;
	completed: number;
	allDone: boolean;
	/** True when the learner hasn't picked a goal and gets DEFAULT_GOAL. */
	usingDefault: boolean;
}

export interface TodayContext {
	/** Words due now, capped at the learner's daily review limit. */
	dueNow: number;
	/** The lesson to open next, or null when there's none to open. */
	lesson: { href: string; title: string } | null;
	/** The game in today's challenge, e.g. "Verb Blitz". */
	gameName: string | null;
	/** Today's challenge is already claimed. */
	challengeDone: boolean;
}

function stepFor(kind: GoalKind, target: number, ctx: TodayContext) {
	if (kind === 'lesson' && ctx.lesson) {
		return { label: `Lesson: ${ctx.lesson.title}`, href: ctx.lesson.href };
	}
	if (kind === 'game' && !ctx.challengeDone) {
		const label =
			target === 1 && ctx.gameName
				? `Today’s challenge: Daily Root + ${ctx.gameName}`
				: GOAL_KINDS.game.label(target);
		return { label, href: '/learn/game/today' };
	}
	return { label: GOAL_KINDS[kind].label(target), href: GOAL_KINDS[kind].href };
}

export function buildTodayPath(
	goal: DailyGoal | null,
	counts: ActivityCounts,
	ctx: TodayContext
): TodayPath {
	const items = goal ?? DEFAULT_GOAL;
	const steps: TodayStep[] = [];

	for (const kind of STEP_ORDER) {
		const item = items.find((i) => i.kind === kind);
		if (!item) continue;

		let stepKind = kind;
		let target = item.target;

		// Never ask for more reviews than there are words to review today.
		if (kind === 'review') {
			target = Math.min(item.target, counts.review + ctx.dueNow);
			if (target <= 0) continue;
		}

		// No lesson to open (path finished, or locked): read a story instead.
		if (kind === 'lesson' && !ctx.lesson) {
			if (items.some((i) => i.kind === 'story')) continue;
			stepKind = 'story';
			target = 1;
		}

		const done = Math.min(counts[stepKind] ?? 0, target);
		steps.push({
			kind: stepKind,
			...stepFor(stepKind, target, ctx),
			done,
			target,
			complete: done >= target
		});
	}

	const completed = steps.filter((s) => s.complete).length;
	return {
		steps,
		next: steps.find((s) => !s.complete) ?? null,
		completed,
		allDone: steps.length > 0 && completed === steps.length,
		usingDefault: !goal
	};
}
