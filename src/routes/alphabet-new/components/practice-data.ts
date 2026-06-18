import { letters } from '$lib/constants/alphabet';
import { egyptianLetters } from '$lib/constants/egyptian-alphabet';

const lettersByKey = new Map(letters.map((l) => [l.key, l]));

export type PracticeLetter = {
	key: string;
	letterName: string;
	isolated: string;
	englishSound: string;
	egyptianSound: string;
};

// Every letter, with its isolated glyph (for audio + display) merged in by key.
export const practiceLetters: PracticeLetter[] = egyptianLetters.map((e) => {
	const base = lettersByKey.get(e.key)!;
	return {
		key: e.key,
		letterName: e.letterName,
		isolated: base.isolated,
		englishSound: e.englishSound,
		egyptianSound: e.egyptianSound
	};
});

export type PracticeWord = {
	arabic: string;
	franco: string;
	meaning: string;
};

// Simple, single-word examples taken from the Lesson 1 letter cards.
export const practiceWords: PracticeWord[] = [
	{ arabic: 'باب', franco: 'bab', meaning: 'door' },
	{ arabic: 'كتاب', franco: 'ketab', meaning: 'book' },
	{ arabic: 'شاي', franco: 'shay', meaning: 'tea' },
	{ arabic: 'سمك', franco: 'samak', meaning: 'fish' },
	{ arabic: 'لبن', franco: 'laban', meaning: 'milk' },
	{ arabic: 'ورد', franco: 'ward', meaning: 'flower' },
	{ arabic: 'درس', franco: 'dars', meaning: 'lesson' },
	{ arabic: 'ناس', franco: 'nas', meaning: 'people' }
];
