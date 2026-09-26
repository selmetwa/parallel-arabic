export interface OddPuzzle {
	words: { arabic: string; english: string; transliteration: string }[];
	oddIndex: number;
	pattern: OddPattern;
	explanation: string;
	difficulty: 'easy' | 'medium' | 'hard';
}

export const ODD_PATTERNS = ['meaning', 'gender', 'word-type', 'root', 'number'] as const;
export type OddPattern = (typeof ODD_PATTERNS)[number];

export const PATTERN_LABELS: Record<OddPattern, string> = {
	meaning: 'Meaning',
	gender: 'Gender',
	'word-type': 'Word type',
	root: 'Shared root',
	number: 'Singular or plural'
};

/** The on-page sample for non-subscribers. The same words work in every dialect. */
export const DEMO_PUZZLE: OddPuzzle = {
	words: [
		{ arabic: 'كتاب', english: 'book', transliteration: 'kitaab' },
		{ arabic: 'شباك', english: 'window', transliteration: 'shibbaak' },
		{ arabic: 'مكتب', english: 'office, desk', transliteration: 'maktab' },
		{ arabic: 'كاتب', english: 'writer', transliteration: 'kaatib' }
	],
	oddIndex: 1,
	pattern: 'root',
	explanation:
		'كتاب, مكتب and كاتب all come from the root ك-ت-ب, to do with writing. شباك does not.',
	difficulty: 'hard'
};
