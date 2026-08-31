/**
 * Phrases to build pages for, chosen from Search Console queries that already
 * rank on page one but get zero clicks — "hello in levantine arabic",
 * "how are you in levantine arabic", "happy birthday in egyptian arabic",
 * "coffee in egyptian arabic" and the rest of that cluster — plus the
 * phrasebook staples any learner searches for.
 *
 * `english` is the phrase as an English speaker would search for it; `slug`
 * is the URL. Keep slugs stable: they are the ranking URL once indexed.
 */
export interface PhraseSeed {
	slug: string;
	english: string;
	/** Extra steer for the generator when the English is ambiguous. */
	context?: string;
}

export const PHRASE_SEEDS: PhraseSeed[] = [
	{ slug: 'hello', english: 'hello', context: 'the everyday greeting used when meeting someone' },
	{ slug: 'how-are-you', english: 'how are you?' },
	{ slug: 'thank-you', english: 'thank you' },
	{ slug: 'happy-birthday', english: 'happy birthday' },
	{ slug: 'good-morning', english: 'good morning' },
	{ slug: 'good-evening', english: 'good evening' },
	{ slug: 'goodbye', english: 'goodbye' },
	{ slug: 'please', english: 'please' },
	{ slug: 'excuse-me', english: 'excuse me' },
	{ slug: 'im-sorry', english: "I'm sorry" },
	{ slug: 'yes-and-no', english: 'yes and no' },
	{ slug: 'my-name-is', english: 'my name is...' },
	{ slug: 'whats-your-name', english: "what's your name?" },
	{ slug: 'where-are-you-from', english: 'where are you from?' },
	{ slug: 'i-dont-understand', english: "I don't understand" },
	{ slug: 'do-you-speak-english', english: 'do you speak English?' },
	{ slug: 'how-much-is-this', english: 'how much is this?' },
	{ slug: 'i-love-you', english: 'I love you' },
	{ slug: 'congratulations', english: 'congratulations' },
	{ slug: 'welcome', english: 'welcome', context: 'said to someone arriving, ahlan wa sahlan' },
	{ slug: 'coffee', english: 'coffee', context: 'the word for coffee and how to order one' },
	{
		slug: 'family',
		english: 'family',
		context: 'the word for family and talking about your family'
	},
	{ slug: 'whats-the-weather-like', english: "what's the weather like?" },
	{ slug: 'im-busy', english: "I'm busy" },
	{ slug: 'see-you-later', english: 'see you later' }
];

export const PHRASE_DIALECTS = ['egyptian-arabic', 'levantine', 'darija', 'fusha'] as const;
export type PhraseDialect = (typeof PHRASE_DIALECTS)[number];
