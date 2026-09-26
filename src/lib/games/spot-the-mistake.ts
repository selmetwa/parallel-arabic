import type { GameDialect } from './themes';

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

function demo(words: string[], correct: string, transliteration: string): MistakeItem {
	return {
		words,
		wrongIndex: words.indexOf('طويل'),
		correction: 'طويلة',
		correct,
		english: 'This girl is tall.',
		transliteration,
		errorType: 'gender',
		explanation: 'البنت is feminine, so the adjective takes the feminine ending: طويلة, not طويل.'
	};
}

/** The on-page sample for non-subscribers, per dialect. Hand-written; worth a native check. */
export const DEMO_MISTAKES: Record<GameDialect, MistakeItem> = {
	'egyptian-arabic': demo(['البنت', 'دي', 'طويل'], 'البنت دي طويلة', 'il-bint di tawiila'),
	levantine: {
		...demo(['هالبنت', 'طويل', 'كتير'], 'هالبنت طويلة كتير', 'hal-bint tawiile ktiir'),
		english: 'This girl is very tall.'
	},
	darija: demo(['هاد', 'البنت', 'طويل'], 'هاد البنت طويلة', 'had l-bent twila'),
	fusha: demo(['هذه', 'البنت', 'طويل'], 'هذه البنت طويلة', 'hādhihi al-bintu ṭawīla')
};
