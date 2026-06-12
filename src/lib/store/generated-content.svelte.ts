// Generated practice content, kept in module-level state so it survives
// client-side navigation. Only written in the browser; resets on full reload.
import type { sentenceObjectItem } from '$lib/types/index';
import type { ConjugationExerciseSchema } from '$lib/utils/gemini-schemas';

export interface SentencePracticeSession {
	sentences: sentenceObjectItem[];
	index: number;
	dialect: string;
}

export const sentencePractice = $state<SentencePracticeSession>({
	sentences: [],
	index: 0,
	dialect: ''
});

export const speakPractice = $state<SentencePracticeSession>({
	sentences: [],
	index: 0,
	dialect: ''
});

export const conjugationPractice = $state({
	verb: '',
	dialect: '',
	exercise: null as ConjugationExerciseSchema | null
});

// Snapshot of an in-progress vocabulary game, keyed by the play page's URL
// search params so a different game setup starts fresh.
export interface GameSnapshot {
	paramsKey: string;
	questions: unknown[];
	currentIndex: number;
	score: number;
	wordsToReview: unknown[];
	sentencesToReview: unknown[];
	questionOrder: string[];
	gameProgressId: string | null;
	turnsPlayed: number;
}

export const gameSession = $state({
	snapshot: null as GameSnapshot | null
});
