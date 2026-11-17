import type { Dialect } from '$lib/types/index';

/**
 * Side-by-side content for /arabic-dialects: the same sentences and words in
 * every dialect we teach, with MSA as the reference. Audio comes from
 * /api/game-audio in each dialect's voice: generated on the first play, then
 * served from the CDN, so nothing is stored in the repo.
 */
export const COMPARED_DIALECTS = [
	'egyptian-arabic',
	'levantine',
	'khaleeji',
	'iraqi',
	'saudi',
	'darija',
	'fusha'
] as const satisfies readonly Dialect[];
export type ComparedDialect = (typeof COMPARED_DIALECTS)[number];

export interface DialectForm {
	arabic: string;
	transliteration: string;
}

export interface DialectRow {
	id: string;
	english: string;
	forms: Record<ComparedDialect, DialectForm>;
	note?: string;
}

/** The same sentence in each dialect. */
export const DIALECT_SENTENCES: DialectRow[] = [
	{
		id: 'how-are-you',
		english: 'How are you?',
		forms: {
			'egyptian-arabic': { arabic: 'إزيك؟', transliteration: 'izzayak?' },
			levantine: { arabic: 'كيفك؟', transliteration: 'kifak?' },
			khaleeji: { arabic: 'شلونك؟', transliteration: 'shlonak?' },
			iraqi: { arabic: 'شلونك؟', transliteration: 'shlonak?' },
			saudi: { arabic: 'كيف حالك؟', transliteration: 'keef 7aalak?' },
			darija: { arabic: 'كيداير؟', transliteration: 'kidayr?' },
			fusha: { arabic: 'كيف حالك؟', transliteration: 'kayfa 7aaluk?' }
		}
	},
	{
		id: 'what-now',
		english: 'What do you want now?',
		forms: {
			'egyptian-arabic': { arabic: 'عايز إيه دلوقتي؟', transliteration: '3ayez eh dilwa2ti?' },
			levantine: { arabic: 'شو بدك هلّق؟', transliteration: 'shu baddak halla2?' },
			khaleeji: { arabic: 'شو تبي الحين؟', transliteration: 'shu tabi il-7een?' },
			iraqi: { arabic: 'شتريد هسّه؟', transliteration: 'shitreed hassa?' },
			saudi: { arabic: 'إيش تبغى دحين؟', transliteration: 'eesh tabgha da7een?' },
			darija: { arabic: 'آش بغيتي دابا؟', transliteration: 'ash bghiti daba?' },
			fusha: { arabic: 'ماذا تريد الآن؟', transliteration: 'maadhaa tureed al-aan?' }
		}
	},
	{
		id: 'dont-know',
		english: "I don't know.",
		forms: {
			'egyptian-arabic': { arabic: 'مش عارف', transliteration: 'mish 3aref' },
			levantine: { arabic: 'ما بعرف', transliteration: 'ma ba3ref' },
			khaleeji: { arabic: 'ما أدري', transliteration: 'ma adri' },
			iraqi: { arabic: 'ما أدري', transliteration: 'ma adri' },
			saudi: { arabic: 'ما أدري', transliteration: 'ma adri' },
			darija: { arabic: 'ما عرفتش', transliteration: 'ma 3reftsh' },
			fusha: { arabic: 'لا أعرف', transliteration: 'la a3rif' }
		}
	},
	{
		id: 'very-good',
		english: 'This is very good.',
		forms: {
			'egyptian-arabic': { arabic: 'ده كويس أوي', transliteration: 'da kwayyes awi' },
			levantine: { arabic: 'هاد كتير منيح', transliteration: 'hada kteer mnee7' },
			khaleeji: { arabic: 'هذا وايد زين', transliteration: 'hatha waayed zain' },
			iraqi: { arabic: 'هذا كلش زين', transliteration: 'hatha kullish zein' },
			saudi: { arabic: 'هادا مرّة كويس', transliteration: 'hada marra kwayyis' },
			darija: { arabic: 'هادشي مزيان بزاف', transliteration: 'hadshi mezyan bezzaf' },
			fusha: { arabic: 'هذا جيد جداً', transliteration: 'hatha jayyid jiddan' }
		}
	}
];

/** Everyday words that change from one dialect to the next. */
export const DIALECT_WORDS: DialectRow[] = [
	{
		id: 'what',
		english: 'what',
		forms: {
			'egyptian-arabic': { arabic: 'إيه', transliteration: 'eh' },
			levantine: { arabic: 'شو', transliteration: 'shu' },
			khaleeji: { arabic: 'شو', transliteration: 'shu' },
			iraqi: { arabic: 'شنو', transliteration: 'shinu' },
			saudi: { arabic: 'إيش', transliteration: 'eesh' },
			darija: { arabic: 'شنو', transliteration: 'shnu' },
			fusha: { arabic: 'ماذا', transliteration: 'maadhaa' }
		},
		note: 'The fastest way to tell dialects apart.'
	},
	{
		id: 'now',
		english: 'now',
		forms: {
			'egyptian-arabic': { arabic: 'دلوقتي', transliteration: 'dilwa2ti' },
			levantine: { arabic: 'هلّق', transliteration: 'halla2' },
			khaleeji: { arabic: 'الحين', transliteration: 'il-7een' },
			iraqi: { arabic: 'هسّه', transliteration: 'hassa' },
			saudi: { arabic: 'دحين', transliteration: 'da7een' },
			darija: { arabic: 'دابا', transliteration: 'daba' },
			fusha: { arabic: 'الآن', transliteration: 'al-aan' }
		},
		note: 'Seven dialects, seven words.'
	},
	{
		id: 'want',
		english: 'I want',
		forms: {
			'egyptian-arabic': { arabic: 'عايز', transliteration: '3ayez' },
			levantine: { arabic: 'بدّي', transliteration: 'baddi' },
			khaleeji: { arabic: 'أبي', transliteration: 'abi' },
			iraqi: { arabic: 'أريد', transliteration: 'areed' },
			saudi: { arabic: 'أبغى', transliteration: 'abgha' },
			darija: { arabic: 'بغيت', transliteration: 'bghit' },
			fusha: { arabic: 'أريد', transliteration: 'ureed' }
		}
	},
	{
		id: 'good',
		english: 'good',
		forms: {
			'egyptian-arabic': { arabic: 'كويس', transliteration: 'kwayyes' },
			levantine: { arabic: 'منيح', transliteration: 'mnee7' },
			khaleeji: { arabic: 'زين', transliteration: 'zain' },
			iraqi: { arabic: 'زين', transliteration: 'zein' },
			saudi: { arabic: 'كويس', transliteration: 'kwayyis' },
			darija: { arabic: 'مزيان', transliteration: 'mezyan' },
			fusha: { arabic: 'جيّد', transliteration: 'jayyid' }
		}
	},
	{
		id: 'very',
		english: 'very, a lot',
		forms: {
			'egyptian-arabic': { arabic: 'أوي', transliteration: 'awi' },
			levantine: { arabic: 'كتير', transliteration: 'kteer' },
			khaleeji: { arabic: 'وايد', transliteration: 'waayed' },
			iraqi: { arabic: 'كلش', transliteration: 'kullish' },
			saudi: { arabic: 'مرّة', transliteration: 'marra' },
			darija: { arabic: 'بزاف', transliteration: 'bezzaf' },
			fusha: { arabic: 'جداً', transliteration: 'jiddan' }
		}
	},
	{
		id: 'there-is',
		english: 'there is',
		forms: {
			'egyptian-arabic': { arabic: 'فيه', transliteration: 'fi' },
			levantine: { arabic: 'في', transliteration: 'fi' },
			khaleeji: { arabic: 'في', transliteration: 'fi' },
			iraqi: { arabic: 'أكو', transliteration: 'aku' },
			saudi: { arabic: 'فيه', transliteration: 'fi' },
			darija: { arabic: 'كاين', transliteration: 'kayn' },
			fusha: { arabic: 'يوجد', transliteration: 'yujad' }
		},
		note: "Iraqi aku (and maku, there isn't) is unique to Iraq."
	},
	{
		id: 'money',
		english: 'money',
		forms: {
			'egyptian-arabic': { arabic: 'فلوس', transliteration: 'filoos' },
			levantine: { arabic: 'مصاري', transliteration: 'masari' },
			khaleeji: { arabic: 'بيزات', transliteration: 'beezaat' },
			iraqi: { arabic: 'فلوس', transliteration: 'flous' },
			saudi: { arabic: 'فلوس', transliteration: 'fuloos' },
			darija: { arabic: 'فلوس', transliteration: 'flouss' },
			fusha: { arabic: 'مال', transliteration: 'maal' }
		}
	}
];

/** Said the same way across the Arab world; recorded once. */
export const UNIVERSAL_WORDS: ({ id: string; english: string } & DialectForm)[] = [
	{ id: 'yalla', english: "let's go, come on", arabic: 'يلّا', transliteration: 'yalla' },
	{ id: 'inshallah', english: 'God willing', arabic: 'إن شاء الله', transliteration: 'inshallah' },
	{ id: 'alhamdulillah', english: 'thank God, fine', arabic: 'الحمد لله', transliteration: 'il7amdulillah' },
	{ id: 'habibi', english: 'my dear', arabic: 'حبيبي', transliteration: '7abibi' },
	{ id: 'shukran', english: 'thank you', arabic: 'شكراً', transliteration: 'shukran' }
];

/** The voice the universal words are spoken in. */
export const UNIVERSAL_VOICE: ComparedDialect = 'egyptian-arabic';
