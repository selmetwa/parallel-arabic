export interface WordExample {
	arabic: string;
	english: string;
	transliteration: string;
	storyId: string;
	storyTitle: string;
}

export interface WordEntry {
	slug: string;
	dialect: string;
	arabic: string;
	english: string;
	franco: string;
	transliteration: string;
	category: string | null;
	audioUrl: string | null;
	/** Rank within the words that earned a page, most illustrated first. */
	frequencyRank: number;
	occurrences: number | null;
	/** Slug of the conjugation page, when this word is a verb that has one. */
	conjugationSlug: string | null;
	examples: WordExample[];
}

export interface WordIndexEntry {
	slug: string;
	arabic: string;
	english: string;
}

/**
 * The shape the practice round needs. Word pages, phrase pages and the
 * vocabulary topic pages all map their own data onto this.
 */
export interface PracticeWord {
	arabic: string;
	english: string;
	transliteration: string;
	audioUrl?: string | null;
}
