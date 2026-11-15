import { FSRS, State, type Card, type Rating } from '@squeakyrobot/fsrs';

export type { Rating };
export { State };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Stability (days) at which a word counts as mastered rather than learning. */
export const MASTERED_STABILITY = 21;

// Fuzz is off so the interval shown on each rating button is exactly what gets saved.
const fsrs = new FSRS({ enable_fuzz: false, request_retention: 0.9 });

/** The saved_word columns FSRS reads and writes. */
export interface SrsRow {
	fsrs_stability: number | null;
	fsrs_difficulty: number | null;
	fsrs_state: number | null;
	lapses: number | null;
	repetitions: number | null;
	interval_days: number | null;
	next_review_date: number | null;
	last_review_date: number | null;
}

/** A saved word as the review UI sees it. */
export interface ReviewWord {
	id: string;
	arabic: string;
	english: string;
	transliteration: string;
	audioUrl?: string;
	dialect: string;
	stability: number | null;
	difficulty: number | null;
	state: number;
	lapses: number;
	reps: number;
	intervalDays: number;
	nextReviewDate: number | null;
	lastReviewDate: number | null;
}

export function rowToCard(row: SrsRow): Card {
	return {
		due: new Date(row.next_review_date ?? Date.now()),
		stability: row.fsrs_stability ?? 0,
		difficulty: row.fsrs_difficulty ?? 0,
		elapsed_days: 0,
		scheduled_days: row.interval_days ?? 0,
		reps: row.repetitions ?? 0,
		lapses: row.lapses ?? 0,
		state: (row.fsrs_state ?? State.New) as Card['state'],
		last_review: row.last_review_date ? new Date(row.last_review_date) : null
	};
}

export function wordToCard(word: ReviewWord): Card {
	return rowToCard({
		fsrs_stability: word.stability,
		fsrs_difficulty: word.difficulty,
		fsrs_state: word.state,
		lapses: word.lapses,
		repetitions: word.reps,
		interval_days: word.intervalDays,
		next_review_date: word.nextReviewDate,
		last_review_date: word.lastReviewDate
	});
}

/** 0 = new, then 1-5 by stability: <1d, <7d, <21d, <90d, 90d+. */
export function masteryLevel(state: number, stability: number | null): number {
	if (state === State.New || !stability) return 0;
	if (stability < 1) return 1;
	if (stability < 7) return 2;
	if (stability < MASTERED_STABILITY) return 3;
	if (stability < 90) return 4;
	return 5;
}

export function cardToRow(card: Card) {
	return {
		fsrs_stability: card.stability,
		fsrs_difficulty: card.difficulty,
		fsrs_state: card.state,
		lapses: card.lapses,
		repetitions: card.reps,
		interval_days: card.scheduled_days,
		next_review_date: card.due.getTime(),
		last_review_date: card.last_review ? card.last_review.getTime() : null,
		is_learning: card.stability < MASTERED_STABILITY,
		mastery_level: masteryLevel(card.state, card.stability)
	};
}

export function schedule(card: Card, rating: Rating, now = new Date()) {
	return fsrs.scheduleWithGrade(card, rating, now);
}

/** Days until the next review for each rating, for the rating buttons. */
export function previewIntervals(card: Card, now = new Date()): Record<Rating, number> {
	const outcomes = fsrs.repeat(card, now);
	return {
		1: outcomes[1].card.scheduled_days,
		2: outcomes[2].card.scheduled_days,
		3: outcomes[3].card.scheduled_days,
		4: outcomes[4].card.scheduled_days
	};
}

/** Probability (0-1) the learner still remembers the word right now. */
export function retrievability(card: Card, now = new Date()): number {
	return fsrs.getRetrievability(card, now);
}

/** Recall probability `days` after the last review, for drawing the forgetting curve. */
export function recallAfter(card: Card, days: number): number {
	if (!card.last_review) return 0;
	return fsrs.getRetrievability(card, new Date(card.last_review.getTime() + days * DAY_MS));
}

export function formatInterval(days: number): string {
	if (days < 14) return `${Math.max(1, Math.round(days))}d`;
	if (days < 60) return `${Math.round(days / 7)}w`;
	if (days < 365) return `${Math.round(days / 30)}mo`;
	return `${(days / 365).toFixed(1).replace(/\.0$/, '')}y`;
}

/** "today", "tomorrow", "in 3d", "in 2w" — for due labels. */
export function formatDue(dueMs: number | null, now = Date.now()): string {
	if (dueMs === null || dueMs <= now) return 'today';
	const days = Math.ceil((dueMs - now) / DAY_MS);
	if (days <= 1) return 'tomorrow';
	return `in ${formatInterval(days)}`;
}
