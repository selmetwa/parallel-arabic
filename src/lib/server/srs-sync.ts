/**
 * Applies vocab-review ratings that may have been made offline. Ratings arrive
 * with their own id and timestamp; they're applied in time order, each one
 * scheduled with FSRS at the moment it was made, and an id that's already in
 * word_review is skipped so a retried sync never counts twice.
 */
import { supabase } from '$lib/supabaseClient';
import { cardToRow, rowToCard, schedule, type Rating, type SrsRow } from '$lib/srs/fsrs';
import { awardXp, type XpResult } from '$lib/helpers/award-xp';
import { trackActivitySimple } from '$lib/helpers/track-activity';

const DAY_MS = 24 * 60 * 60 * 1000;
/** How far back an offline rating may be dated. Older ones are treated as made 30 days ago. */
export const MAX_REVIEW_AGE_MS = 30 * DAY_MS;

export interface IncomingReview {
	id: string;
	saved_word_id: string;
	rating: Rating;
	reviewed_at: number;
}

export type WordRow = SrsRow & { id: string; dialect: string | null };
export type RowPatch = ReturnType<typeof cardToRow>;

export interface ReviewLog {
	id: string;
	saved_word_id: string;
	rating: Rating;
	reviewed_at: number;
	fsrs_stability: number | null;
	fsrs_difficulty: number | null;
	fsrs_state: number | null;
	interval_days: number | null;
	repetitions: number | null;
	next_review_date: number | null;
	dialect: string | null;
}

export interface SyncPlan {
	/** Final state per word, written once each. */
	updates: Map<string, RowPatch>;
	/** One word_review row per newly applied rating. */
	logs: ReviewLog[];
	/** Every incoming id the client can drop from its outbox (applied, duplicate, or for a deleted word). */
	acknowledged: string[];
}

/**
 * Pure planning step. `rows` are the learner's saved words, `existingIds` the
 * review ids already in word_review.
 */
export function planReviews(
	rows: Map<string, WordRow>,
	reviews: IncomingReview[],
	existingIds: Set<string>,
	now: number
): SyncPlan {
	const working = new Map<string, WordRow>();
	const updates = new Map<string, RowPatch>();
	const logs: ReviewLog[] = [];
	const acknowledged: string[] = [];
	const seen = new Set(existingIds);

	const ordered = reviews
		.map((r, i) => ({ r, i }))
		.sort((a, b) => a.r.reviewed_at - b.r.reviewed_at || a.i - b.i)
		.map(({ r }) => r);

	for (const review of ordered) {
		acknowledged.push(review.id);
		if (seen.has(review.id)) continue;
		seen.add(review.id);

		const row = working.get(review.saved_word_id) ?? rows.get(review.saved_word_id);
		if (!row) continue; // the word was deleted since; nothing to schedule

		const at = Math.min(now, Math.max(now - MAX_REVIEW_AGE_MS, review.reviewed_at));
		// A later review (another device, or this one online) already moved this word on: log it, don't rewind.
		const stale = row.last_review_date !== null && at < row.last_review_date;

		let state: WordRow = row;
		if (!stale) {
			const patch = cardToRow(schedule(rowToCard(row), review.rating, new Date(at)).card);
			state = { ...row, ...patch };
			working.set(row.id, state);
			updates.set(row.id, patch);
		}

		logs.push({
			id: review.id,
			saved_word_id: row.id,
			rating: review.rating,
			reviewed_at: at,
			fsrs_stability: state.fsrs_stability,
			fsrs_difficulty: state.fsrs_difficulty,
			fsrs_state: state.fsrs_state,
			interval_days: state.interval_days,
			repetitions: state.repetitions,
			next_review_date: state.next_review_date,
			dialect: row.dialect
		});
	}

	return { updates, logs, acknowledged };
}

const isRating = (r: unknown): r is Rating => r === 1 || r === 2 || r === 3 || r === 4;

/** Validates a client payload; drops anything malformed. */
export function parseReviews(input: unknown): IncomingReview[] {
	if (!Array.isArray(input)) return [];
	return input.flatMap((r) => {
		if (!r || typeof r !== 'object') return [];
		const { id, saved_word_id, rating, reviewed_at } = r as Record<string, unknown>;
		if (typeof id !== 'string' || !id || id.length > 64) return [];
		if (typeof saved_word_id !== 'string' || !saved_word_id) return [];
		if (!isRating(rating) || typeof reviewed_at !== 'number' || !Number.isFinite(reviewed_at)) return [];
		return [{ id, saved_word_id, rating, reviewed_at }];
	});
}

export interface SyncResult {
	acknowledged: string[];
	applied: number;
	/** Final state of each word touched, for the client to reconcile its local copy. */
	words: Record<string, RowPatch>;
	xp: { awarded: number; last: XpResult | null; leveledUp: boolean };
}

/**
 * Loads the rows, plans and writes. With `awardXpForCorrect`, also awards XP for
 * each newly applied correct rating (the sync endpoint); /api/review-word leaves
 * it off because its callers award XP themselves.
 */
export async function syncReviews(
	userId: string,
	reviews: IncomingReview[],
	{ awardXpForCorrect = true, now = Date.now() } = {}
): Promise<SyncResult> {
	const empty: SyncResult = { acknowledged: [], applied: 0, words: {}, xp: { awarded: 0, last: null, leveledUp: false } };
	if (!reviews.length) return empty;

	const wordIds = [...new Set(reviews.map((r) => r.saved_word_id))];
	const [{ data: rowData, error: rowError }, { data: existing, error: existingError }] = await Promise.all([
		supabase
			.from('saved_word')
			.select(
				'id, dialect, fsrs_stability, fsrs_difficulty, fsrs_state, lapses, repetitions, interval_days, next_review_date, last_review_date'
			)
			.eq('user_id', userId)
			.in('id', wordIds),
		supabase
			.from('word_review')
			.select('id')
			.in(
				'id',
				reviews.map((r) => r.id)
			)
	]);
	if (rowError) throw new Error(`Failed to load words: ${rowError.message}`);
	if (existingError) throw new Error(`Failed to check reviews: ${existingError.message}`);

	const rows = new Map((rowData as WordRow[]).map((r) => [r.id, r]));
	const plan = planReviews(rows, reviews, new Set((existing ?? []).map((r) => r.id)), now);

	for (const [id, patch] of plan.updates) {
		const { error } = await supabase.from('saved_word').update(patch).eq('id', id).eq('user_id', userId);
		if (error) throw new Error(`Failed to update word: ${error.message}`);
	}
	if (plan.logs.length) {
		const { error } = await supabase
			.from('word_review')
			.insert(plan.logs.map((l) => ({ ...l, user_id: userId, created_at: now })));
		if (error) throw new Error(`Failed to save reviews: ${error.message}`);
		trackActivitySimple(userId, 'review', plan.logs.length).catch((err) => {
			console.error('Error tracking review activity:', err);
		});
	}

	// One award per correct rating, same as the per-rating endpoint used to give.
	const xp: SyncResult['xp'] = { awarded: 0, last: null, leveledUp: false };
	for (const log of awardXpForCorrect ? plan.logs : []) {
		if (log.rating === 1) continue;
		const result = await awardXp(userId, 'review_correct');
		if (!result.success) break;
		xp.awarded += result.xpAwarded;
		xp.leveledUp ||= result.leveledUp;
		xp.last = result;
	}

	return {
		acknowledged: plan.acknowledged,
		applied: plan.logs.length,
		words: Object.fromEntries(plan.updates),
		xp
	};
}
