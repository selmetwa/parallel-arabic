/** Dictionary shapes and labels shared by the server and the pages. */

export interface DictionaryWord {
	id: string;
	arabic: string;
	english: string;
	transliteration: string;
	category: string | null;
	audioUrl: string | null;
}

export interface DictionaryExample {
	arabic: string;
	transliteration: string;
	english: string;
}

export interface DictionaryDetails {
	pos: string | null;
	gender: string | null;
	pluralArabic: string | null;
	pluralTransliteration: string | null;
	root: string | null;
	presentArabic: string | null;
	presentTransliteration: string | null;
	examples: DictionaryExample[];
	/** Links into the rest of the app, when the word has them. */
	conjugationSlug: string | null;
	wordPageSlug: string | null;
}

/** "food_and_drink_2" → "Food and drink". */
export function categoryLabel(category: string): string {
	const text = category.replace(/_\d+$/, '').replace(/__/g, ' & ').replace(/_/g, ' ').trim();
	return text.charAt(0).toUpperCase() + text.slice(1);
}
