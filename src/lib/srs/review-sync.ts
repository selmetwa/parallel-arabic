/**
 * Vocab-review ratings are scheduled on the device first, queued, and sent to
 * /api/review-words/sync in order. Works the same online and offline.
 */
import { cardToRow, schedule, State, wordToCard, type Rating, type ReviewWord } from './fsrs';
import { pendingReviews, removeReviews, type QueuedReview } from './offline-store';

const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH = 50;

type Patch = ReturnType<typeof cardToRow>;

/** The word with a server or local FSRS result applied. */
export function withPatch(word: ReviewWord, patch: Patch): ReviewWord {
	return {
		...word,
		stability: patch.fsrs_stability,
		difficulty: patch.fsrs_difficulty,
		state: patch.fsrs_state,
		lapses: patch.lapses,
		reps: patch.repetitions,
		intervalDays: patch.interval_days,
		nextReviewDate: patch.next_review_date,
		lastReviewDate: patch.last_review_date
	};
}

/** Schedules a rating locally, exactly as the server will when it syncs. */
export function applyRating(word: ReviewWord, rating: Rating, at: number): ReviewWord {
	return withPatch(word, cardToRow(schedule(wordToCard(word), rating, new Date(at)).card));
}

/**
 * Today's session from the downloaded deck: due reviews, most overdue first,
 * then new words, up to the daily limit (same order as /api/review-words).
 */
export function dueFromDeck(words: ReviewWord[], limit: number, now: number): ReviewWord[] {
	const due = words
		.filter((w) => w.state !== State.New && w.nextReviewDate !== null && w.nextReviewDate <= now)
		.sort((a, b) => (a.nextReviewDate ?? 0) - (b.nextReviewDate ?? 0));
	const fresh = words.filter((w) => w.state === State.New);
	return [...due, ...fresh].slice(0, limit);
}

/** Reviews coming up on each of the next 7 days (index 0 = tomorrow), from the deck. */
export function forecastFromWords(words: ReviewWord[], now: number): number[] {
	const forecast = Array.from({ length: 7 }, () => 0);
	for (const w of words) {
		if (w.state === State.New || w.nextReviewDate === null || w.nextReviewDate <= now) continue;
		const day = Math.ceil((w.nextReviewDate - now) / DAY_MS) - 1;
		if (day >= 0 && day < 7) forecast[day]++;
	}
	return forecast;
}

export interface SyncResponse {
	acknowledged: string[];
	applied: number;
	words: Record<string, Patch>;
	requiresSubscription: boolean;
	reviewCount: number;
	xp: {
		awarded: number;
		leveledUp: boolean;
		last: { newTotalXp: number; newLevel: number } | null;
	};
}

export type SyncOutcome =
	| { status: 'synced'; response: SyncResponse; remaining: number }
	| { status: 'offline' | 'failed'; remaining: number }
	| { status: 'idle'; remaining: 0 };

let inFlight: Promise<SyncOutcome> | null = null;

/** Sends this learner's queued ratings, oldest first. Single-flight: concurrent calls share one run. */
export function syncReviews(userId: string): Promise<SyncOutcome> {
	if (!inFlight) inFlight = run(userId).finally(() => (inFlight = null));
	return inFlight;
}

async function run(userId: string): Promise<SyncOutcome> {
	const merged: SyncResponse = {
		acknowledged: [],
		applied: 0,
		words: {},
		requiresSubscription: false,
		reviewCount: 0,
		xp: { awarded: 0, leveledUp: false, last: null }
	};
	let queue: QueuedReview[] = await pendingReviews(userId);
	if (!queue.length) return { status: 'idle', remaining: 0 };
	if (typeof navigator !== 'undefined' && navigator.onLine === false) return { status: 'offline', remaining: queue.length };

	while (queue.length) {
		const batch = queue.slice(0, BATCH);
		let res: Response;
		try {
			res = await fetch('/api/review-words/sync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reviews: batch.map((r) => ({
						id: r.id,
						saved_word_id: r.savedWordId,
						rating: r.rating,
						reviewed_at: r.reviewedAt
					}))
				})
			});
		} catch {
			return { status: 'offline', remaining: queue.length };
		}
		if (!res.ok) return { status: 'failed', remaining: queue.length };

		const body = (await res.json()) as SyncResponse;
		await removeReviews(body.acknowledged);
		merged.acknowledged.push(...body.acknowledged);
		merged.applied += body.applied;
		Object.assign(merged.words, body.words);
		merged.reviewCount = body.reviewCount;
		merged.xp.awarded += body.xp.awarded;
		merged.xp.leveledUp ||= body.xp.leveledUp;
		merged.xp.last = body.xp.last ?? merged.xp.last;

		if (body.requiresSubscription) {
			// Past the free limit: these can never be applied, so drop them.
			merged.requiresSubscription = true;
			await removeReviews(queue.map((r) => r.id));
			return { status: 'synced', response: merged, remaining: 0 };
		}
		queue = await pendingReviews(userId);
		// Nothing acknowledged means no progress; stop rather than loop.
		if (!body.acknowledged.length) break;
	}
	return { status: 'synced', response: merged, remaining: queue.length };
}
