/** One way of saying the phrase — addressing a man, a woman, a group, formal vs casual. */
export interface PhraseVariant {
	label: string;
	arabic: string;
	transliteration: string;
	english: string;
	note: string;
}

export interface PhraseExample {
	arabic: string;
	transliteration: string;
	english: string;
}

export interface PhraseEntry {
	slug: string;
	dialect: string;
	/** The English phrase, as a learner would search for it. */
	english: string;
	/** Arabic with tashkeel. */
	arabic: string;
	/** Arabic without diacritics — what people actually type. */
	arabicPlain: string;
	transliteration: string;
	/** Franco-Arabic / chat alphabet, e.g. "3eed milad sa3eed". */
	franco: string;
	/** Word-for-word gloss, which is often the interesting part. */
	literal: string;
	/** When to use it, how formal it is, who says it to whom. */
	usage: string;
	variants: PhraseVariant[];
	/** How people typically reply. */
	responses: PhraseExample[];
	examples: PhraseExample[];
}

export interface PhraseIndexEntry {
	slug: string;
	english: string;
	arabic: string;
	transliteration: string;
}
