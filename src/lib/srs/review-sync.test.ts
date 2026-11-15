import { describe, expect, it } from 'vitest';
import { applyRating, dueFromDeck, forecastFromWords } from './review-sync';
import { State, type ReviewWord } from './fsrs';
import { planReviews, type WordRow } from '$lib/server/srs-sync';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-11-15T12:00:00Z').getTime();

function word(id: string, over: Partial<ReviewWord> = {}): ReviewWord {
	return {
		id,
		arabic: id,
		english: id,
		transliteration: id,
		dialect: 'egyptian-arabic',
		stability: null,
		difficulty: null,
		state: State.New,
		lapses: 0,
		reps: 0,
		intervalDays: 0,
		nextReviewDate: null,
		lastReviewDate: null,
		...over
	};
}

const review = (id: string, due: number) =>
	word(id, { state: State.Review, stability: 5, difficulty: 5, reps: 2, intervalDays: 5, nextReviewDate: due, lastReviewDate: due - 5 * DAY });

describe('applyRating', () => {
	it('schedules on the device exactly as the server will on sync', () => {
		const w = review('w', now - DAY);
		const local = applyRating(w, 3, now);
		const row: WordRow = {
			id: 'w',
			dialect: 'egyptian-arabic',
			fsrs_stability: w.stability,
			fsrs_difficulty: w.difficulty,
			fsrs_state: w.state,
			lapses: w.lapses,
			repetitions: w.reps,
			interval_days: w.intervalDays,
			next_review_date: w.nextReviewDate,
			last_review_date: w.lastReviewDate
		};
		const server = planReviews(new Map([['w', row]]), [{ id: 'r', saved_word_id: 'w', rating: 3, reviewed_at: now }], new Set(), now)
			.updates.get('w')!;
		expect(local.nextReviewDate).toBe(server.next_review_date);
		expect(local.stability).toBe(server.fsrs_stability);
		expect(local.reps).toBe(server.repetitions);
	});

	it('moves a word rated offline out of today’s due list', () => {
		const rated = applyRating(review('w', now - DAY), 3, now);
		expect(dueFromDeck([rated], 20, now)).toHaveLength(0);
	});
});

describe('dueFromDeck', () => {
	it('puts overdue reviews first, most overdue first, then new words, up to the limit', () => {
		const words = [word('new1'), review('soon', now + DAY), review('late', now - 3 * DAY), review('due', now - DAY), word('new2')];
		expect(dueFromDeck(words, 3, now).map((w) => w.id)).toEqual(['late', 'due', 'new1']);
	});
});

describe('forecastFromWords', () => {
	it('counts upcoming reviews per day and ignores due and new words', () => {
		const words = [review('a', now + 2 * 60 * 60 * 1000), review('b', now + 1.5 * DAY), review('c', now - DAY), word('n')];
		expect(forecastFromWords(words, now)).toEqual([1, 1, 0, 0, 0, 0, 0]);
	});
});
