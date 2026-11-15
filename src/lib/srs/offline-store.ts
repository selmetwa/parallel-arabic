/**
 * On-device copy of the vocab-review deck and the queue of ratings waiting to
 * sync. IndexedDB, with an in-memory fallback when it's unavailable (private
 * browsing, blocked storage) so the page still works for the session.
 */
import type { Rating, ReviewWord } from './fsrs';

const DB_NAME = 'pa-review';
const DECK = 'deck';
const OUTBOX = 'outbox';

export interface SessionState {
	/** toDateString() of the day the session belongs to. */
	day: string;
	stats: { reviewed: number; again: number; newLearned: number };
	/** Words missed earlier today, waiting for their practice repeat. */
	practice: ReviewWord[];
}

export interface Deck {
	userId: string;
	savedAt: number;
	/** Today's cards plus those due in the next day, with any offline ratings already applied. */
	words: ReviewWord[];
	/** Session size (the learner's daily review limit). */
	limit: number;
	forecast: number[];
	totalSavedWordsCount: number;
	session: SessionState | null;
	/** The end-of-session XP couldn't be sent offline; send it after the next sync. */
	pendingCycleBonus: boolean;
}

export interface QueuedReview {
	id: string;
	userId: string;
	savedWordId: string;
	rating: Rating;
	reviewedAt: number;
}

const memory = { deck: new Map<string, Deck>(), outbox: new Map<string, QueuedReview>() };

let dbPromise: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
	if (dbPromise) return dbPromise;
	dbPromise = new Promise((resolve) => {
		try {
			if (typeof indexedDB === 'undefined') return resolve(null);
			const req = indexedDB.open(DB_NAME, 1);
			req.onupgradeneeded = () => {
				req.result.createObjectStore(DECK, { keyPath: 'userId' });
				req.result.createObjectStore(OUTBOX, { keyPath: 'id' });
			};
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => resolve(null);
			req.onblocked = () => resolve(null);
		} catch {
			resolve(null);
		}
	});
	return dbPromise;
}

/** Runs one request against a store; falls back to `fallback()` if IndexedDB fails. */
async function run<T>(
	store: string,
	mode: IDBTransactionMode,
	op: (s: IDBObjectStore) => IDBRequest,
	fallback: () => T
): Promise<T> {
	const db = await open();
	if (!db) return fallback();
	try {
		return await new Promise<T>((resolve, reject) => {
			const req = op(db.transaction(store, mode).objectStore(store));
			req.onsuccess = () => resolve(req.result as T);
			req.onerror = () => reject(req.error);
		});
	} catch {
		return fallback();
	}
}

export function saveDeck(deck: Deck) {
	memory.deck.set(deck.userId, deck);
	// Svelte state proxies can't be cloned into IndexedDB; store plain data.
	const plain = JSON.parse(JSON.stringify(deck)) as Deck;
	return run(DECK, 'readwrite', (s) => s.put(plain), () => undefined);
}

export function loadDeck(userId: string): Promise<Deck | null> {
	return run(DECK, 'readonly', (s) => s.get(userId), () => memory.deck.get(userId) ?? null).then((d) => d ?? null);
}

export function queueReview(review: QueuedReview) {
	memory.outbox.set(review.id, review);
	return run(OUTBOX, 'readwrite', (s) => s.put(review), () => undefined);
}

/** This learner's queued ratings, oldest first. */
export async function pendingReviews(userId: string): Promise<QueuedReview[]> {
	const all = await run<QueuedReview[]>(OUTBOX, 'readonly', (s) => s.getAll(), () => [...memory.outbox.values()]);
	return (all ?? []).filter((r) => r.userId === userId).sort((a, b) => a.reviewedAt - b.reviewedAt);
}

export async function removeReviews(ids: string[]) {
	for (const id of ids) {
		memory.outbox.delete(id);
		await run(OUTBOX, 'readwrite', (s) => s.delete(id), () => undefined);
	}
}

/** Name of the database, so the service worker can delete it on logout. */
export const OFFLINE_DB_NAME = DB_NAME;
