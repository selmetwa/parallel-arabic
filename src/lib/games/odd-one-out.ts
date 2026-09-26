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
