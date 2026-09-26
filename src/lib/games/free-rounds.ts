/**
 * Free rounds: every game can be tried twice before the sign-up prompt
 * (signed out) or the paywall (signed in).
 *
 * Counted per game and per identity — signed out is one identity, each account
 * another — so someone who signs up after using their anonymous rounds gets
 * their two account rounds instead of hitting the paywall straight after the
 * sign-up prompt.
 *
 * This browser-side count drives the UI. The games that cost money to run
 * (the generated puzzles) are also counted on the server, in
 * src/lib/server/games/access.ts, which has the final say.
 */

export const FREE_ROUNDS = 2;

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function key(game: string, who: string) {
	return `pa-free-rounds:${game}:${who}`;
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
