/**
 * The "free to try" allowance for the word games: a few rounds of each game per
 * day without paying.
 *
 * Counted per game and per identity — signed out is one identity, each account
 * another — so someone who signs up after using their anonymous rounds gets a
 * fresh allowance instead of hitting the paywall straight after the sign-up
 * prompt. This is a soft, browser-only limit; the word lists it guards cost
 * nothing to serve.
 */

export const FREE_ROUNDS_PER_DAY = 3;

/** The learner's own calendar day, not UTC — "per day" means their day. */
export function localDay(now: Date = new Date()): string {
	const m = String(now.getMonth() + 1).padStart(2, '0');
	const d = String(now.getDate()).padStart(2, '0');
	return `${now.getFullYear()}-${m}-${d}`;
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function key(game: string, who: string) {
	return `pa-free-rounds:${game}:${who}`;
}

export function readRoundsUsed(
	store: Store | null,
	game: string,
	who: string,
	day: string
): number {
	try {
		const raw = store?.getItem(key(game, who));
		if (!raw) return 0;
		const saved = JSON.parse(raw) as { day?: string; count?: number };
		return saved.day === day && typeof saved.count === 'number' ? saved.count : 0;
	} catch {
		return 0;
	}
}

/** Record one more round and return the new count. Storage failures are ignored. */
export function recordRound(store: Store | null, game: string, who: string, day: string): number {
	const count = readRoundsUsed(store, game, who, day) + 1;
	try {
		store?.setItem(key(game, who), JSON.stringify({ day, count }));
	} catch {
		// Private mode or full storage — the in-memory count still limits this visit.
	}
	return count;
}
