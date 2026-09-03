import type { WordExample } from '$lib/types/words';

export interface VocabWord {
	slug: string;
	/** With tashkeel, for display. */
	arabic: string;
	/** Without tashkeel — how people actually type it, and what search matches. */
	arabicPlain: string;
	english: string;
	franco: string;
	transliteration: string;
	pos: string;
	/** Occurrences in the source frequency corpus. */
	occurrences: number;
	frequencyRank: number;
	examples: WordExample[];
}

export interface VocabTopic {
	slug: string;
	dialect: string;
	/** Short name, for cards and links. */
	label: string;
	/** The page H1, which is not always the label in a sentence. */
	heading: string;
	words: VocabWord[];
}

export interface VocabTopicSummary {
	slug: string;
	label: string;
	count: number;
	/** A few words to show on the hub, so a topic card isn't just a number. */
	preview: { arabic: string; english: string }[];
}
