import { describe, expect, it } from 'vitest';
import { NO_ACTIVITY } from '$lib/constants/daily-goal';
import { buildTodayPath, type TodayContext } from './today-path';

const ctx: TodayContext = {
	dueNow: 12,
	lesson: { href: '/lessons/structured/levantine?lessonId=base-a1-u02', title: 'At the café' },
	gameName: 'Verb Blitz',
	challengeDone: false
};

describe('buildTodayPath', () => {
	it('orders the goal review, lesson, game whatever order it was picked in', () => {
		const path = buildTodayPath(
			[
				{ kind: 'game', target: 1 },
				{ kind: 'tutor', target: 1 },
				{ kind: 'review', target: 10 }
			],
			NO_ACTIVITY,
			ctx
		);
		expect(path.steps.map((s) => s.kind)).toEqual(['review', 'game', 'tutor']);
		expect(path.next?.kind).toBe('review');
		expect(path.usingDefault).toBe(false);
	});

	it('uses review, lesson and game when no goal is set', () => {
		const path = buildTodayPath(null, NO_ACTIVITY, ctx);
		expect(path.steps.map((s) => s.kind)).toEqual(['review', 'lesson', 'game']);
		expect(path.usingDefault).toBe(true);
	});

	it('links to the exact lesson and today’s challenge', () => {
		const path = buildTodayPath(null, NO_ACTIVITY, ctx);
		expect(path.steps[1]).toMatchObject({ label: 'Lesson: At the café', href: ctx.lesson!.href });
		expect(path.steps[2]).toMatchObject({
			label: 'Today’s challenge: Daily Root + Verb Blitz',
			href: '/learn/game/today'
		});
	});

	it('sends a multi-game goal to the games hub once the challenge is claimed', () => {
		const path = buildTodayPath([{ kind: 'game', target: 2 }], { ...NO_ACTIVITY, game: 1 }, {
			...ctx,
			challengeDone: true
		});
		expect(path.steps[0]).toMatchObject({ label: 'Play 2 games', href: '/learn/game', done: 1 });
	});

	it('caps the review target at what is left to review', () => {
		const path = buildTodayPath(null, { ...NO_ACTIVITY, review: 3 }, { ...ctx, dueNow: 2 });
		expect(path.steps[0]).toMatchObject({ kind: 'review', target: 5, done: 3, complete: false });
	});

	it('drops the review step when nothing is due and nothing was reviewed', () => {
		const path = buildTodayPath(null, NO_ACTIVITY, { ...ctx, dueNow: 0 });
		expect(path.steps.map((s) => s.kind)).toEqual(['lesson', 'game']);
	});

	it('counts the review step done once the desk is cleared', () => {
		const path = buildTodayPath(null, { ...NO_ACTIVITY, review: 4 }, { ...ctx, dueNow: 0 });
		expect(path.steps[0]).toMatchObject({ kind: 'review', target: 4, complete: true });
	});

	it('swaps the lesson for a story when there is no lesson to open', () => {
		const path = buildTodayPath(null, NO_ACTIVITY, { ...ctx, lesson: null });
		expect(path.steps.map((s) => s.kind)).toEqual(['review', 'story', 'game']);
	});

	it('drops the lesson when the goal already has a story', () => {
		const path = buildTodayPath(
			[
				{ kind: 'lesson', target: 1 },
				{ kind: 'story', target: 1 }
			],
			NO_ACTIVITY,
			{ ...ctx, lesson: null }
		);
		expect(path.steps.map((s) => s.kind)).toEqual(['story']);
	});

	it('is all done when every step is complete', () => {
		const path = buildTodayPath(
			null,
			{ ...NO_ACTIVITY, review: 10, lesson: 1, game: 1 },
			ctx
		);
		expect(path.allDone).toBe(true);
		expect(path.next).toBeNull();
		expect(path.completed).toBe(3);
	});
});
