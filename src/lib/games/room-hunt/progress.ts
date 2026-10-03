/**
 * Which Room Hunt words a player has learned, per room and dialect.
 *
 * Kept in localStorage, like the free-round counts: losing it only means a
 * room's lessons start over. Every read and write tolerates storage being
 * missing or throwing (private windows, blocked site data).
 */
const KEY = 'pa-room-hunt-learned';

type Learned = Record<string, string[]>;

function read(storage: Storage | null): Learned {
	try {
		const parsed = JSON.parse(storage?.getItem(KEY) ?? '{}');
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

const slot = (room: string, dialect: string) => `${room}:${dialect}`;

export function readLearned(storage: Storage | null, room: string, dialect: string): Set<string> {
	const ids = read(storage)[slot(room, dialect)];
	return new Set(Array.isArray(ids) ? ids : []);
}

/** Every room's learned words for one dialect, keyed by room id. */
export function readAllLearned(storage: Storage | null, dialect: string): Record<string, Set<string>> {
	const out: Record<string, Set<string>> = {};
	for (const [key, ids] of Object.entries(read(storage))) {
		const [room, d] = key.split(':');
		if (d === dialect && Array.isArray(ids)) out[room] = new Set(ids);
	}
	return out;
}

export function addLearned(
	storage: Storage | null,
	room: string,
	dialect: string,
	ids: string[]
): Set<string> {
	const all = read(storage);
	const next = new Set([...(all[slot(room, dialect)] ?? []), ...ids]);
	all[slot(room, dialect)] = [...next];
	try {
		storage?.setItem(KEY, JSON.stringify(all));
	} catch {
		// Progress just won't survive a reload.
	}
	return next;
}
