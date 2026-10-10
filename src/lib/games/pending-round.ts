import type { GameWord } from './word-pool';

/**
 * A signed-out player's unsaved progress: the XP they would have earned and
 * the words they missed. Kept on this device for a day, then saved to their
 * account once they sign up (see GameShell).
 */
export interface PendingRound {
	xp: number;
	words: GameWord[];
	dialect: string;
	savedAt: number;
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const KEY = 'pa-pending-round';
const MAX_XP = 30;
const MAX_WORDS = 20;
const TTL_MS = 24 * 60 * 60 * 1000;

function read(store: Store | null, now: number): PendingRound | null {
	try {
		const saved = JSON.parse(store?.getItem(KEY) ?? 'null') as PendingRound | null;
		if (!saved || now - saved.savedAt > TTL_MS) return null;
		return saved;
	} catch {
		return null;
	}
}

/** Add a round to what's waiting. Words for a different dialect replace the old ones. */
export function rememberRound(
	store: Store | null,
	round: { xp: number; words: GameWord[]; dialect: string },
	now = Date.now()
): void {
	const prev = read(store, now);
	const sameDialect = prev?.dialect === round.dialect;
	const words = [...(sameDialect ? prev.words : []), ...round.words].filter(
		(w, i, all) => all.findIndex((o) => o.id === w.id) === i
	);
	const next: PendingRound = {
		xp: Math.min(MAX_XP, (prev?.xp ?? 0) + round.xp),
		words: words.slice(0, MAX_WORDS),
		dialect: round.dialect,
		savedAt: now
	};
	if (next.xp === 0 && next.words.length === 0) return;
	try {
		store?.setItem(KEY, JSON.stringify(next));
	} catch {
		// Private mode or full storage — nothing to keep.
	}
}

/** Return what's waiting (if anything) and clear it, so it is saved only once. */
export function takePendingRound(store: Store | null, now = Date.now()): PendingRound | null {
	const saved = read(store, now);
	try {
		store?.removeItem(KEY);
	} catch {
		// Ignore.
	}
	return saved;
}
