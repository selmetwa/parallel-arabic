export interface GapItem {
	/** The full sentence, word by word, edge punctuation removed. */
	words: string[];
	/** The word that is blanked out. */
	gapIndex: number;
	/** Four choices for the gap, shuffled; `answer` is the right one. */
	options: string[];
	answer: number;
	english: string;
	transliteration: string;
	/** One line on why the answer fits and the others don't. */
	explanation: string;
}
