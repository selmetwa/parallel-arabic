import { describe, expect, it } from 'vitest';
import { MAX_REVIEW_AGE_MS, parseReviews, planReviews, type IncomingReview, type WordRow } from './srs-sync';
import { cardToRow, rowToCard, schedule } from '$lib/srs/fsrs';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-11-15T12:00:00Z').getTime();

const newWord: WordRow = {
	id: 'w1',
	dialect: 'egyptian-arabic',
	fsrs_stability: null,
	fsrs_difficulty: null,
	fsrs_state: 0,
	lapses: 0,
	repetitions: 0,
	interval_days: 0,
	next_review_date: null,
	last_review_date: null
};

const known: WordRow = {
	id: 'w2',
	dialect: 'levantine',
	fsrs_stability: 8,
	fsrs_difficulty: 4,
	fsrs_state: 2,
	lapses: 0,
	repetitions: 3,
	interval_days: 8,
	next_review_date: now - 2 * DAY,
	last_review_date: now - 10 * DAY
};

const rows = new Map([
	[newWord.id, newWord],
	[known.id, known]
]);

const review = (id: string, saved_word_id: string, rating: 1 | 2 | 3 | 4, reviewed_at: number): IncomingReview => ({
	id,
	saved_word_id,
	rating,
	reviewed_at
});

describe('planReviews', () => {
	it('schedules a rating at the moment it was made, not when it syncs', () => {
		const at = now - 3 * 60 * 60 * 1000; // rated offline 3 hours ago
		const plan = planReviews(rows, [review('r1', 'w1', 3, at)], new Set(), now);
		const expected = cardToRow(schedule(rowToCard(newWord), 3, new Date(at)).card);
		expect(plan.updates.get('w1')).toEqual(expected);
		expect(plan.logs).toHaveLength(1);
		expect(plan.logs[0]).toMatchObject({ id: 'r1', reviewed_at: at, dialect: 'egyptian-arabic' });
	});

	it('applies several ratings of one word in time order, whatever order they arrive in', () => {
		const first = now - 2 * 60 * 60 * 1000;
		const second = now - 60 * 60 * 1000;
		const plan = planReviews(rows, [review('b', 'w1', 1, second), review('a', 'w1', 3, first)], new Set(), now);
		const afterFirst = cardToRow(schedule(rowToCard(newWord), 3, new Date(first)).card);
		const afterSecond = cardToRow(
			schedule(rowToCard({ ...newWord, ...afterFirst }), 1, new Date(second)).card
		);
		expect(plan.logs.map((l) => l.id)).toEqual(['a', 'b']);
		expect(plan.updates.get('w1')).toEqual(afterSecond);
	});

	it('skips ids already saved, so a retried sync never counts twice', () => {
		const plan = planReviews(rows, [review('r1', 'w1', 3, now - 1000)], new Set(['r1']), now);
		expect(plan.logs).toHaveLength(0);
		expect(plan.updates.size).toBe(0);
		expect(plan.acknowledged).toEqual(['r1']);
	});

	it('skips a repeated id within one batch', () => {
		const plan = planReviews(rows, [review('r1', 'w1', 3, now - 2000), review('r1', 'w1', 3, now - 1000)], new Set(), now);
		expect(plan.logs).toHaveLength(1);
	});

	it('clamps timestamps from the future and from more than 30 days ago', () => {
		const plan = planReviews(
			rows,
			[review('f', 'w1', 3, now + 5 * DAY), review('o', 'w2', 3, now - 90 * DAY)],
			new Set(),
			now
		);
		const byId = Object.fromEntries(plan.logs.map((l) => [l.id, l.reviewed_at]));
		expect(byId.f).toBe(now);
		// w2 was last reviewed 10 days ago, so a rating clamped to 30 days ago is older than that.
		expect(byId.o).toBe(now - MAX_REVIEW_AGE_MS);
	});

	it("logs a rating older than the word's last review without rewinding its schedule", () => {
		const plan = planReviews(rows, [review('old', 'w2', 1, now - 12 * DAY)], new Set(), now);
		expect(plan.updates.has('w2')).toBe(false);
		expect(plan.logs).toHaveLength(1);
		expect(plan.logs[0]).toMatchObject({ next_review_date: known.next_review_date, fsrs_stability: 8 });
	});

	it('acknowledges ratings for words that were deleted, without logging them', () => {
		const plan = planReviews(rows, [review('gone', 'deleted-word', 3, now - 1000)], new Set(), now);
		expect(plan.acknowledged).toEqual(['gone']);
		expect(plan.logs).toHaveLength(0);
	});
});

describe('parseReviews', () => {
	it('keeps well-formed reviews and drops the rest', () => {
		expect(
			parseReviews([
				{ id: 'a', saved_word_id: 'w1', rating: 3, reviewed_at: now },
				{ id: 'b', saved_word_id: 'w1', rating: 5, reviewed_at: now },
				{ id: '', saved_word_id: 'w1', rating: 3, reviewed_at: now },
				{ id: 'c', saved_word_id: 'w1', rating: 3, reviewed_at: 'yesterday' },
				null
			])
		).toEqual([{ id: 'a', saved_word_id: 'w1', rating: 3, reviewed_at: now }]);
		expect(parseReviews('nope')).toEqual([]);
	});
});
