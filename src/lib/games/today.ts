import { LAUNCH_DAY } from './daily-root';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The daily challenge: today's Daily Root plus a round of one other game,
 * rotating by day. All three build their rounds from content the app ships,
 * so the challenge costs nothing to serve.
 */
export const TODAY_GAMES = ['dialect-match', 'letter-hunt', 'verb-blitz'] as const;
export type TodayGame = (typeof TODAY_GAMES)[number];

export const TODAY_BONUS_EVENTS = 2;

export function gameOfTheDay(puzzleNumber: number): TodayGame {
	return TODAY_GAMES[(puzzleNumber - 1) % TODAY_GAMES.length];
}

/** The day's UTC midnight: what the completion row is keyed on. */
export function challengeDate(puzzleNumber: number): number {
	return LAUNCH_DAY + (puzzleNumber - 1) * DAY_MS;
}
