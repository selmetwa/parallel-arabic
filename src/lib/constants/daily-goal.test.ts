import { describe, expect, it } from 'vitest';
import { describeGoal, goalProgress, NO_ACTIVITY, parseGoal } from './daily-goal';

describe('parseGoal', () => {
	it('accepts up to three different activities at offered amounts', () => {
		expect(
			parseGoal([
				{ kind: 'game', target: 1 },
				{ kind: 'speak', target: 5 }
			])
		).toEqual([
			{ kind: 'game', target: 1 },
			{ kind: 'speak', target: 5 }
		]);
	});

	it('rejects anything else', () => {
		expect(parseGoal(null)).toBeNull();
		expect(parseGoal([])).toBeNull();
		expect(parseGoal([{ kind: 'review', target: 7 }])).toBeNull();
		expect(parseGoal([{ kind: 'nap', target: 1 }])).toBeNull();
		expect(
			parseGoal([
				{ kind: 'game', target: 1 },
				{ kind: 'game', target: 2 }
			])
		).toBeNull();
		expect(
			parseGoal([
				{ kind: 'game', target: 1 },
				{ kind: 'tutor', target: 1 },
				{ kind: 'lesson', target: 1 },
				{ kind: 'story', target: 1 }
			])
		).toBeNull();
	});
});

describe('goalProgress', () => {
	it('counts each item up to its target', () => {
		const p = goalProgress(
			[
				{ kind: 'review', target: 10 },
				{ kind: 'game', target: 1 }
			],
			{ ...NO_ACTIVITY, review: 4, game: 3 }
		);
		expect(p.items.map((i) => [i.done, i.complete])).toEqual([
			[4, false],
			[1, true]
		]);
		expect(p.completed).toBe(1);
		expect(p.allDone).toBe(false);
	});
});

describe('describeGoal', () => {
	it('reads as a sentence', () => {
		expect(describeGoal([{ kind: 'tutor', target: 1 }])).toBe('talk with your tutor');
		expect(
			describeGoal([
				{ kind: 'review', target: 10 },
				{ kind: 'game', target: 1 },
				{ kind: 'speak', target: 5 }
			])
		).toBe('review 10 words, play a game and say 5 sentences out loud');
	});
});
