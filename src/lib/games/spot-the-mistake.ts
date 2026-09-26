export interface MistakeItem {
	/** The incorrect sentence, word by word, edge punctuation removed. */
	words: string[];
	wrongIndex: number;
	correction: string;
	correct: string;
	english: string;
	transliteration: string;
	errorType: MistakeType;
	explanation: string;
}

export const MISTAKE_TYPES = [
	'gender',
	'conjugation',
	'article',
	'number',
	'pronoun-suffix',
	'preposition',
	'negation',
	'grammar'
] as const;
export type MistakeType = (typeof MISTAKE_TYPES)[number];

export const MISTAKE_LABELS: Record<MistakeType, string> = {
	gender: 'Gender agreement',
	conjugation: 'Verb form',
	article: 'The article ال',
	number: 'Singular or plural',
	'pronoun-suffix': 'Pronoun ending',
	preposition: 'Preposition',
	negation: 'Negation',
	grammar: 'Grammar'
};
