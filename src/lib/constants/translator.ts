/**
 * The free English-to-dialect translator at /{dialect}/translator.
 *
 * It exists for searches like "egyptian arabic translator" and "darija
 * translator" (see docs/seo-keyword-push-plan.md). Each call costs a Gemini
 * request, so /api/translate caps it the same way /api/speech-to-text does:
 * a cookie allowance for signed-out visitors, and an IP window as the real
 * cost ceiling.
 */

export const TRANSLATOR_MAX_CHARS = 200;
/** Free translations before a signed-out visitor is asked to sign up. */
export const ANON_TRANSLATE_LIMIT = 5;
export const ANON_TRANSLATE_COOKIE = 'anon_translations';
/** Per IP, signed in or not. */
export const IP_TRANSLATE_LIMIT = 40;
export const IP_TRANSLATE_WINDOW_SECONDS = 3600;

/** Phrasebook entries shown as worked examples on every translator page, in order. */
export const TRANSLATOR_EXAMPLE_SLUGS = [
	'how-are-you',
	'thank-you',
	'whats-your-name',
	'how-much-is-this',
	'i-dont-understand',
	'i-love-you',
	'see-you-later',
	'good-morning'
];

export type TranslatorFaq = { question: string; answer: string };

export type TranslatorCopy = {
	/** What the page calls the dialect, e.g. "Egyptian Arabic". */
	name: string;
	title: string;
	description: string;
	intro: string;
	faqs: TranslatorFaq[];
};

const SHARED_FAQS = (name: string): TranslatorFaq[] => [
	{
		question: `Is this ${name} translator free?`,
		answer: `Yes. You can translate ${ANON_TRANSLATE_LIMIT} phrases a day without an account, and as many as you like with a free account.`
	},
	{
		question: 'Why not just use Google Translate?',
		answer: `Google Translate mostly gives you Modern Standard Arabic, the formal written language. This translator answers in spoken ${name}, the way people actually say it, with a transliteration so you can read it without knowing the alphabet.`
	},
	{
		question: 'How do I read the transliteration?',
		answer:
			'It uses the numbers Arabic speakers use when texting: 3 is the ع sound, 7 is the breathy ح, and 2 is a glottal stop, like the catch in "uh-oh". Everything else is read as in English.'
	}
];

const COPY: Record<string, Omit<TranslatorCopy, 'faqs'> & { faqs?: TranslatorFaq[] }> = {
	'egyptian-arabic': {
		name: 'Egyptian Arabic',
		title: 'Egyptian Arabic Translator: English to Egyptian Arabic, Free',
		description:
			'Translate English into spoken Egyptian Arabic (Masri), not formal Arabic. Free, with Arabic script, transliteration and audio for every phrase.',
		intro:
			'Type a phrase in English and get it back the way Egyptians say it: in spoken Masri, with the Arabic script, a transliteration you can read straight away, and audio. Most translation tools give you formal Modern Standard Arabic, which no one speaks in Cairo.',
		faqs: [
			{
				question: 'What is the difference between Egyptian Arabic and Arabic?',
				answer:
					'Egyptian Arabic is the spoken Arabic of Egypt. It pronounces ج as a hard g, drops the ق sound, puts b- on present-tense verbs and has many everyday words of its own, like 3ayez (I want) and dilwa2ti (now). Modern Standard Arabic is the formal written language.'
			}
		]
	},
	darija: {
		name: 'Moroccan Darija',
		title: 'Darija Translator: English to Moroccan Arabic, Free',
		description:
			'Translate English into Moroccan Darija, the Arabic spoken in Morocco. Free, with Arabic script, transliteration and audio for every phrase.',
		intro:
			'Type a phrase in English and get it back in Moroccan Darija, the Arabic people actually speak in Morocco, with the Arabic script, a transliteration and audio. Darija is very different from the formal Arabic most translators produce, so a standard Arabic translation will often sound strange to a Moroccan.',
		faqs: [
			{
				question: 'Is Darija the same as Arabic?',
				answer:
					'Darija is a variety of Arabic, but it differs a lot from Modern Standard Arabic and from Eastern dialects like Egyptian. It drops most short vowels and uses many Amazigh, French and Spanish words, like daba (now), bezzaf (a lot) and tomobil (car).'
			}
		]
	},
	levantine: {
		name: 'Levantine Arabic',
		title: 'Levantine Arabic Translator: English to Lebanese & Syrian Arabic',
		description:
			'Translate English into spoken Levantine Arabic, the dialect of Lebanon, Syria, Jordan and Palestine. Free, with Arabic script, transliteration and audio.',
		intro:
			'Type a phrase in English and get it back in spoken Levantine Arabic, the dialect of Lebanon, Syria, Jordan and Palestine, with the Arabic script, a transliteration and audio. It answers the way people talk in Beirut or Damascus, not in formal written Arabic.',
		faqs: [
			{
				question: 'Is Lebanese the same as Levantine Arabic?',
				answer:
					'Lebanese is one of the Levantine dialects, along with Syrian, Jordanian and Palestinian. They differ in accent and a few words, but their speakers understand each other easily. This translator uses the shared everyday forms.'
			}
		]
	}
};

/** Names for the dialects that only get the generic copy. */
const OTHER_NAMES: Record<string, string> = {
	fusha: 'Modern Standard Arabic',
	iraqi: 'Iraqi Arabic',
	khaleeji: 'Gulf Arabic',
	saudi: 'Saudi Arabic'
};

export function translatorCopy(dialect: string): TranslatorCopy {
	const specific = COPY[dialect];
	if (specific) return { ...specific, faqs: [...(specific.faqs ?? []), ...SHARED_FAQS(specific.name)] };

	const name = OTHER_NAMES[dialect] ?? 'Arabic';
	return {
		name,
		title: `${name} Translator: English to ${name}, Free`,
		description: `Translate English into ${name}. Free, with Arabic script, transliteration and audio for every phrase.`,
		intro: `Type a phrase in English and get it back in ${name}, with the Arabic script, a transliteration you can read straight away, and audio.`,
		faqs: SHARED_FAQS(name)
	};
}

export type TranslateInput = { text: string; dialect: string };

/** Validates a request body. Returns the cleaned input, or an error message. */
export function parseTranslateInput(
	body: unknown,
	isDialect: (d: string) => boolean
): { ok: true; input: TranslateInput } | { ok: false; error: string } {
	if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request' };
	const { text, dialect } = body as Record<string, unknown>;

	if (typeof dialect !== 'string' || !isDialect(dialect)) return { ok: false, error: 'Invalid dialect' };
	if (typeof text !== 'string') return { ok: false, error: 'Text is required' };

	const trimmed = text.replace(/\s+/g, ' ').trim();
	if (!trimmed) return { ok: false, error: 'Text is required' };
	if (trimmed.length > TRANSLATOR_MAX_CHARS) {
		return { ok: false, error: `Keep it under ${TRANSLATOR_MAX_CHARS} characters` };
	}
	return { ok: true, input: { text: trimmed, dialect } };
}

/** The cache key for a translation, so the same phrase isn't paid for twice. */
export function translationCacheKey({ text, dialect }: TranslateInput): string {
	return `translate:${dialect}:${text.toLowerCase()}`;
}
