import type { Dialect } from '$lib/types/index';
import { NUR_ENABLED } from './feature-flags';

/**
 * Country varieties inside a dialect: Lebanese inside Levantine, Kuwaiti inside
 * Khaleeji. A variety shares its dialect's curriculum; it changes the voice, the
 * tutor, and the Arabic generated for the learner (stories, sentences, words).
 */
export type Variety =
	| 'syrian'
	| 'lebanese'
	| 'jordanian'
	| 'palestinian'
	| 'emirati'
	| 'kuwaiti'
	| 'qatari'
	| 'bahraini'
	| 'omani';

export interface VarietyInfo {
	key: Variety;
	dialect: Dialect;
	/** "Lebanese Arabic" */
	name: string;
	/** "Lebanese" */
	shortName: string;
	flag: string;
	/** Map country (ISO A3) that picks this variety. */
	iso: string;
	/** Where the tutor is from, and what the prompts mean by this variety. */
	city: string;
	/** Landing page path segment: /lebanese-arabic */
	slug: string;
	/** Nur voice id */
	voice: string;
	/** Added to the dialect's generation rules. */
	notes: string;
}

export const VARIETIES: VarietyInfo[] = [
	{
		key: 'syrian',
		dialect: 'levantine',
		name: 'Syrian Arabic',
		shortName: 'Syrian',
		flag: '🇸🇾',
		iso: 'SYR',
		city: 'Damascus',
		slug: 'syrian-arabic',
		voice: 'ev_759bdc08', // Nur Syrian
		notes: `Write the way people in Damascus speak (Shami).
- now = هلّق, what = شو, I want = بدّي, here = هون, there = هنيك, when = إيمتى, good = منيح, a lot = كتير, like this = هيك.
- qaf is a glottal stop (قلت → 2elt); ث → ت/س and ذ → د/ز as said, but keep the standard spelling.
- Example: شو بدك تعمل هلّق؟ تعا لهون شوي.`
	},
	{
		key: 'lebanese',
		dialect: 'levantine',
		name: 'Lebanese Arabic',
		shortName: 'Lebanese',
		flag: '🇱🇧',
		iso: 'LBN',
		city: 'Beirut',
		slug: 'lebanese-arabic',
		voice: 'ev_3497d80d', // Nur Lebanese
		notes: `Write the way people in Beirut speak.
- this = هيدا / هيدي (not هاد), now = هلّق, what = شو, I want = بدّي, yes = إيه, good = منيح, a lot = كتير.
- French greetings and thanks are natural in everyday speech (بونجور، ميرسي، بون سوار) but keep the rest Arabic.
- qaf is a glottal stop; final -a is often said -e (منيحة → mnee7a/mnee7e), but keep the standard spelling.
- Example: هيدا الأكل كتير طيب، ميرسي كتير!`
	},
	{
		key: 'jordanian',
		dialect: 'levantine',
		name: 'Jordanian Arabic',
		shortName: 'Jordanian',
		flag: '🇯🇴',
		iso: 'JOR',
		city: 'Amman',
		slug: 'jordanian-arabic',
		voice: 'ev_432049f3', // Nur Jordanian
		notes: `Write the way people in Amman speak.
- now = هسّا (not هلّق), what = شو, thing = إشي, I want = بدّي, not = مِش, man / guy = زلمة, good = منيح, a lot = كتير.
- Many speakers say qaf as g (بقول → bagool); keep the standard spelling ق and show g in the transliteration.
- Example: هسّا بدّي أروح عالبيت، في إشي؟`
	},
	{
		key: 'palestinian',
		dialect: 'levantine',
		name: 'Palestinian Arabic',
		shortName: 'Palestinian',
		flag: '🇵🇸',
		iso: 'PSE',
		city: 'Jerusalem',
		slug: 'palestinian-arabic',
		voice: 'ev_015f2322', // Nur Palestinian Male (there is no female Nur Palestinian)
		notes: `Write the way people in Jerusalem and Ramallah speak.
- now = هلّأ / هلقيت, what = شو / إيش, this = هاد / هاي, thing = إشي, I want = بدّي, not = مِش, also = كمان, good = منيح.
- qaf is a glottal stop in the cities; keep the standard spelling.
- Example: إيش بدك تشرب هلقيت؟ في قهوة وشاي.`
	},
	{
		key: 'emirati',
		dialect: 'khaleeji',
		name: 'Emirati Arabic',
		shortName: 'Emirati',
		flag: '🇦🇪',
		iso: 'ARE',
		city: 'Abu Dhabi',
		slug: 'emirati-arabic',
		voice: 'ev_16d12145', // Nur Emirati Male
		notes: `Write the way Emiratis speak.
- how are you = شحالك, what = شو, I want = أبا / أبي, now = الحين, a lot = وايد, not = مب, here = هني, good = زين.
- Future with بـ (بروح); ongoing actions with قاعد.
- Example: شحالك؟ شو تبا تسوي الحين؟`
	},
	{
		key: 'kuwaiti',
		dialect: 'khaleeji',
		name: 'Kuwaiti Arabic',
		shortName: 'Kuwaiti',
		flag: '🇰🇼',
		iso: 'KWT',
		city: 'Kuwait City',
		slug: 'kuwaiti-arabic',
		voice: 'ev_ea6a4c7e', // Nur Kuwaiti Male
		notes: `Write the way Kuwaitis speak.
- how are you = شلونك, what = شنو, I want = أبي, now = الحين, a lot = وايد, not = مو, like this = كذي (said chithi), here = هني.
- ك is often said ch and ق often g; keep the standard spelling and show the sound in the transliteration.
- Example: شلونك؟ شنو تبي تاكل الحين؟`
	},
	{
		key: 'qatari',
		dialect: 'khaleeji',
		name: 'Qatari Arabic',
		shortName: 'Qatari',
		flag: '🇶🇦',
		iso: 'QAT',
		city: 'Doha',
		slug: 'qatari-arabic',
		voice: 'ev_c83752e2', // Nur Qatari Male
		notes: `Write the way Qataris speak.
- how are you = شلونك / شحالك, what = شنو, I want = أبي, now = الحين, a lot = وايد, not = مب, okay = زين.
- ق is usually said g and ج often y; keep the standard spelling and show the sound in the transliteration.
- Example: شلونك؟ وين بتروح الحين؟`
	},
	{
		key: 'bahraini',
		dialect: 'khaleeji',
		name: 'Bahraini Arabic',
		shortName: 'Bahraini',
		flag: '🇧🇭',
		iso: 'BHR',
		city: 'Manama',
		slug: 'bahraini-arabic',
		voice: 'ev_282a48c6', // Nur Bahraini Male
		notes: `Write the way Bahrainis speak.
- how are you = شلونك, what = شنو / شنهو, what's wrong = شفيك, I want = أبي, now = الحين, a lot = وايد, not = مو, okay = زين.
- Example: شفيك؟ شنهو صاير؟`
	},
	{
		key: 'omani',
		dialect: 'khaleeji',
		name: 'Omani Arabic',
		shortName: 'Omani',
		flag: '🇴🇲',
		iso: 'OMN',
		city: 'Muscat',
		slug: 'omani-arabic',
		voice: 'ev_49a5f791', // Nur Omani Male
		notes: `Write the way Omanis in Muscat speak.
- how are you = شحالك / كيف حالك, what = إيش, I want = أبا / أبغي, now = الحين, a lot = واجد, okay = زين.
- Omani is a little closer to Fusha than other Gulf speech; keep it colloquial but not Emirati or Kuwaiti.
- Example: شحالك؟ إيش تبا الحين؟`
	}
];

/** Used when a learner hasn't picked one. */
export const DEFAULT_VARIETY: Partial<Record<Dialect, Variety>> = {
	levantine: 'syrian',
	khaleeji: 'emirati'
};

/**
 * Nur voice for each dialect with no varieties. Each keeps the gender of the
 * ElevenLabs voice it replaces.
 */
const DIALECT_VOICE: Record<Dialect, string> = {
	'egyptian-arabic': 'ev_060e18ed', // Nur Egyptian Male
	fusha: 'ev_a68b5c50', // Nur
	levantine: 'ev_759bdc08', // Nur Syrian
	darija: 'ev_ec4aea9e', // Nur Moroccan
	iraqi: 'ev_9726555a', // Nur Iraqi Male
	khaleeji: 'ev_16d12145', // Nur Emirati Male
	saudi: 'ev_6a81b1ea' // Nur Hijazi Male
};

/** EESI pronunciation codes, only the ones its docs list. Iraqi and Hijazi rely on the voice. */
const DIALECT_LANGUAGE: Partial<Record<Dialect, string>> = {
	'egyptian-arabic': 'arz',
	levantine: 'apc',
	darija: 'ary',
	khaleeji: 'afb',
	fusha: 'ar'
};

/**
 * The everyday words in a variety's notes ("now = هلّق, what = شو, ..."), for
 * the landing page's word table. Parenthetical asides like "(not هاد)" are dropped.
 */
export function varietyKeyWords(variety: VarietyInfo): { english: string; arabic: string }[] {
	return variety.notes
		.split('\n')
		.filter((line) => line.startsWith('- ') && line.includes(' = '))
		.flatMap((line) => line.slice(2).split(/,\s*/))
		.map((pair) => pair.split(' = '))
		.filter((parts) => parts.length === 2)
		.map(([english, arabic]) => ({
			english: english.trim(),
			arabic: arabic.replace(/\(.*?\)/g, '').replace(/[.;]$/, '').trim()
		}))
		.filter((w) => w.english && /[\u0600-\u06FF]/.test(w.arabic) && !/[a-z]/i.test(w.arabic));
}

export function getVarietyInfo(variety: string | null | undefined): VarietyInfo | undefined {
	return VARIETIES.find((v) => v.key === variety);
}

export function getVarietyBySlug(slug: string): VarietyInfo | undefined {
	return VARIETIES.find((v) => v.slug === slug);
}

export function varietiesFor(dialect: string): VarietyInfo[] {
	return NUR_ENABLED ? VARIETIES.filter((v) => v.dialect === dialect) : [];
}

export function isVarietyOf(variety: unknown, dialect: string): variety is Variety {
	return VARIETIES.some((v) => v.key === variety && v.dialect === dialect);
}

/**
 * The variety to speak and write in for this dialect: the learner's own when
 * it's their target dialect, otherwise the dialect's default. Null when the
 * flag is off or the dialect has no varieties.
 */
export function resolveVariety(
	dialect: string,
	user?: { target_dialect?: string | null; target_variety?: string | null } | null
): VarietyInfo | undefined {
	if (!NUR_ENABLED) return undefined;
	if (user?.target_dialect === dialect && isVarietyOf(user.target_variety, dialect)) {
		return getVarietyInfo(user.target_variety);
	}
	return getVarietyInfo(DEFAULT_VARIETY[dialect as Dialect]);
}

export function nurVoiceFor(dialect: string, variety?: VarietyInfo): { voice: string; language?: string } {
	return {
		voice: variety?.voice ?? DIALECT_VOICE[dialect as Dialect] ?? DIALECT_VOICE['egyptian-arabic'],
		language: DIALECT_LANGUAGE[dialect as Dialect]
	};
}
