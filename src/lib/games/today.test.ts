import { describe, expect, it } from 'vitest';
import { TODAY_GAMES, challengeDate, gameOfTheDay } from './today';
import { LAUNCH_DAY, puzzleNumber } from './daily-root';

describe('the daily challenge', () => {
	it('rotates through the games, one a day', () => {
		const week = Array.from({ length: 6 }, (_, i) => gameOfTheDay(i + 1));
		expect(week.slice(0, 3)).toEqual([...TODAY_GAMES]);
		expect(week.slice(3)).toEqual([...TODAY_GAMES]);
	});

	it('keys each day on its UTC midnight, matching the Daily Root number', () => {
		expect(challengeDate(1)).toBe(LAUNCH_DAY);
		const n = puzzleNumber();
		expect(puzzleNumber(challengeDate(n) + 1000)).toBe(n);
	});
});
