/**
 * Free rounds: one allowance shared by every game, then the sign-up prompt
 * (signed out) or the paywall (signed in). A per-game allowance meant almost
 * nobody saw either, with close to twenty games to try.
 *
 * Counted per identity — signed out is one identity, each account another — so
 * someone who signs up after using their anonymous rounds gets their account
 * rounds instead of hitting the paywall straight after the sign-up prompt.
 *
 * This browser-side count drives the UI. The games that cost money to run
 * (the generated puzzles) are also counted on the server, in
 * src/lib/server/games/access.ts, which has the final say.
 */

// The games hub, its FAQ and the hub's sign-up card spell these numbers out.
/** Rounds across every game before the sign-up prompt. */
export const FREE_ROUNDS_SIGNED_OUT = 3;
/** Rounds across every game, after signing up, before the paywall. */
export const FREE_ROUNDS_SIGNED_IN = 5;

/** Scenarios are conversations rather than games, and keep their own two rounds. */
const OWN_ALLOWANCE: Record<string, number> = { scenarios: 2 };

/** The allowance a game draws from: its own, or the one all games share. */
export function roundPool(game: string): string {
	return game in OWN_ALLOWANCE ? game : 'games';
}

export function freeRounds(game: string, signedIn: boolean): number {
	return OWN_ALLOWANCE[game] ?? (signedIn ? FREE_ROUNDS_SIGNED_IN : FREE_ROUNDS_SIGNED_OUT);
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function key(game: string, who: string) {
	return `pa-free-rounds:${roundPool(game)}:${who}`;
}

export function readRoundsUsed(store: Store | null, game: string, who: string): number {
	try {
		return Number(store?.getItem(key(game, who))) || 0;
	} catch {
		return 0;
	}
}

/** Record one more round and return the new count. Storage failures are ignored. */
export function recordRound(store: Store | null, game: string, who: string): number {
	const count = readRoundsUsed(store, game, who) + 1;
	try {
		store?.setItem(key(game, who), String(count));
	} catch {
		// Private mode or full storage — the in-memory count still limits this visit.
	}
	return count;
}

/** The sign-up prompt's message once a signed-out player's free rounds are used. */
export function signupPrompt(game: string): string {
	return `You've played your ${freeRounds(game, false)} free rounds. Make a free account for ${freeRounds(game, true)} more, save the words you miss to a review deck, and try the lessons and stories that go with the games.`;
}
