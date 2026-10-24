import { isSelectableDialect } from './dialects';

/**
 * Data for the /{a}-vs-{b} comparison pages.
 *
 * Rather than write six near-duplicate essays, each dialect declares its value
 * for a fixed set of contrast dimensions and the page renders the two side by
 * side. Only the mutual-intelligibility note is genuinely pair-specific.
 */
export interface ContrastDimension {
	key: string;
	label: string;
}

export const CONTRAST_DIMENSIONS: ContrastDimension[] = [
	{ key: 'qaf', label: 'The letter ق' },
	{ key: 'jim', label: 'The letter ج' },
	{ key: 'present', label: 'Present tense' },
	{ key: 'future', label: 'Future tense' },
	{ key: 'negation', label: 'Negation' },
	{ key: 'what', label: '"What?"' },
	{ key: 'now', label: '"Now"' },
	{ key: 'want', label: '"I want"' },
	{ key: 'good', label: '"Good"' }
];

export const DIALECT_CONTRASTS: Record<string, Record<string, string>> = {
	'egyptian-arabic': {
		qaf: 'Glottal stop — قلم is said alam',
		jim: 'Hard g — جميل is gamiil',
		present: 'b- prefix: باكتب (baktib), "I write"',
		future: 'ha- prefix: هاكتب (haktib), "I will write"',
		negation: 'ما...ش around the verb: makatabtish',
		what: 'إيه (eeh)',
		now: 'دلوقتي (dilwa2ti)',
		want: 'عايز (3ayez) / عايزة (3ayza)',
		good: 'كويس (kwayyes)'
	},
	levantine: {
		qaf: 'Glottal stop in the cities — قلب is said albe',
		jim: 'Soft j, as in French "jour" — جميل is jamiil',
		present: 'b- prefix: بكتب (baktob), "I write"',
		future: 'رح (rah) or ha-: رح اكتب',
		negation: 'ما before the verb: ما بعرف',
		what: 'شو (shu)',
		now: 'هلّق (halla2)',
		want: 'بدي (baddi)',
		good: 'منيح (mnee7)'
	},
	darija: {
		qaf: 'Usually kept as q, sometimes g — قلب is qalb',
		jim: 'Soft j — جميل is jmil',
		present: 'ka- or ta- prefix: كانكتب (kanktib), "I write"',
		future: 'غادي (ghadi) or غا: غادي نكتب',
		negation: 'ما...ش around the verb: makanktibsh',
		what: 'شنو (shnu) / آش (ash)',
		now: 'دابا (daba)',
		want: 'بغيت (bghit)',
		good: 'مزيان (mezyan)'
	},
	fusha: {
		qaf: 'Pronounced as a full q — قلب is qalb',
		jim: 'Soft j — جميل is jamiil',
		present: 'Bare imperfect: أكتب (aktub), "I write"',
		future: 'سـ or سوف: سأكتب (sa-aktub)',
		negation: 'لا / لم / ما before the verb: لا أكتب',
		what: 'ماذا (maadhaa)',
		now: 'الآن (al-aan)',
		want: 'أريد (ureed)',
		good: 'جيّد (jayyid)'
	},
	iraqi: {
		qaf: 'Hard g — قلب is galub, قهوة is gahwa',
		jim: 'Soft j — جديد is jideed; ك often becomes ch: كلب is chalib',
		present: 'Bare form, or da- for right now: اكتب (aktib), دا اكتب (da-aktib)',
		future: 'راح (raa7): راح اكتب',
		negation: 'ما before the verb: ما أدري; مو before adjectives',
		what: 'شنو (shinu) / شكو (shaku)',
		now: 'هسّة (hassa)',
		want: 'أريد (areed)',
		good: 'زين (zein)'
	},
	khaleeji: {
		qaf: 'Hard g — قهوة is gahwa',
		jim: 'Often y — جديد is yideed, دجاج is diyaay',
		present: 'Bare form: اكتب (aktib), "I write"',
		future: 'بـ (ba-/bi-) or راح: بكتب, راح اكتب',
		negation: 'ما before the verb: ما أدري; مو before adjectives',
		what: 'شو (shu) / شنو (shinu)',
		now: 'الحين (il-7een)',
		want: 'أبي (abi)',
		good: 'زين (zain)'
	},
	saudi: {
		qaf: 'Hard g — قلب is galb, قهوة is gahwa',
		jim: 'Soft j — جديد is jadeed; ث and ذ become ت and د',
		present: 'b- prefix: باكتب (baktub), "I write"',
		future: 'ح- prefix: حاكتب (7aktub), "I will write"',
		negation: 'ما before the verb: ما أدري; مو before adjectives',
		what: 'إيش (eesh)',
		now: 'دحين (da7een)',
		want: 'أبغى (abgha)',
		good: 'كويس (kwayyis)'
	}
};

export interface ComparisonPair {
	a: string;
	b: string;
	/** How well speakers of each understand the other. */
	intelligibility: string;
	/** Which one a learner should pick, and why. */
	whichToLearn: string;
}

const ALL_COMPARISONS: ComparisonPair[] = [
	{
		a: 'egyptian-arabic',
		b: 'levantine',
		intelligibility:
			'These two are the closest pair of the four. Egyptians and Levantines converse without much difficulty — the grammar is nearly parallel and most everyday vocabulary overlaps. The give-aways are the question words (إيه versus شو), the pronunciation of ج, and a handful of high-frequency verbs.',
		whichToLearn:
			'Pick Egyptian Arabic for the widest reach: Egyptian film and music mean it is understood almost everywhere. Pick Levantine if you have ties to Syria, Lebanon, Jordan or Palestine, or if you simply find it easier to listen to — many learners do. Learning either one makes the other largely free.'
	},
	{
		a: 'egyptian-arabic',
		b: 'darija',
		intelligibility:
			'This is the widest gap between any two dialects here. Moroccans generally understand Egyptian Arabic well, from decades of Egyptian media; Egyptians usually struggle with Darija. The vowel reduction, the Amazigh and French vocabulary, and the ka-/ghadi verb markers make Darija hard to follow from the east.',
		whichToLearn:
			'Egyptian Arabic if you want to be understood across the Arab world. Darija only if Morocco is specifically where you are going — it will not carry you far outside the Maghreb, but nothing else will serve you inside it.'
	},
	{
		a: 'egyptian-arabic',
		b: 'fusha',
		intelligibility:
			'Not really a question of intelligibility: Fusha is the shared written standard and every educated Arabic speaker reads it, but nobody grows up speaking it. Egyptian Arabic is what people actually say. The two coexist — an Egyptian will read a newspaper in Fusha and then discuss it in Masri.',
		whichToLearn:
			'Egyptian Arabic if you want conversation. Fusha if you want to read books, follow the news, study the Quran, or work in a formal setting. Many learners do Fusha for the sound system and the script, then move to a dialect for speaking.'
	},
	{
		a: 'levantine',
		b: 'darija',
		intelligibility:
			'Low in the Levantine-to-Darija direction. Moroccans typically follow Levantine reasonably well thanks to Syrian and Lebanese television; Levantines rarely follow Darija without practice. Almost every high-frequency word differs — بدي against بغيت, هلّق against دابا, منيح against مزيان.',
		whichToLearn:
			'Follow your destination. Neither one will help you much with the other, so the practical question is whether you are heading to the Levant or to Morocco.'
	},
	{
		a: 'levantine',
		b: 'fusha',
		intelligibility:
			'Levantine speakers read and understand Fusha from schooling, but speak Shami at home. Levantine keeps more Fusha vocabulary intact than Darija does, so a Fusha learner will recognise a good deal of Levantine on the page — until the question words and the b- prefix appear.',
		whichToLearn:
			'Fusha for reading, writing and formal registers. Levantine for talking to people in Syria, Lebanon, Jordan or Palestine. The overlap is large enough that the second one you learn comes quickly.'
	},
	{
		a: 'darija',
		b: 'fusha',
		intelligibility:
			'Moroccans are schooled in Fusha and use it for writing, news and official business, but Darija is the spoken language and the distance between them is the widest of any Arabic-speaking country. A strong Fusha speaker arriving in Casablanca will be understood and will understand very little in return.',
		whichToLearn:
			'Fusha travels further and unlocks written Arabic everywhere. Darija is the only thing that works in a Moroccan street. If Morocco is the goal, learn Darija and treat Fusha as the reading language alongside it.'
	},
	{
		a: 'iraqi',
		b: 'khaleeji',
		intelligibility:
			'Very close. Iraqis and Gulf speakers understand each other easily: both say g for ق, ch for ك in many words, and share everyday words like zein (good), shloon (how) and ma adri (I don\'t know). The give-aways are Iraqi aku/maku and hassa against Gulf il-7een, and the Gulf y for ج.',
		whichToLearn:
			'Follow your people and your plans. Iraqi if your family, friends or work are tied to Iraq; Khaleeji if you live or work in the UAE, Kuwait, Qatar or Bahrain. Either one makes the other easy.'
	},
	{
		a: 'khaleeji',
		b: 'saudi',
		intelligibility:
			'Good, with some adjustment. Gulf speakers and Hijazis understand each other well, but Hijazi sounds closer to Egyptian: b- for the present, 7a- for the future, eesh for "what" and da7een for "now". Gulf Arabic has abi, waayid and il-7een instead.',
		whichToLearn:
			'Hijazi if you are heading to Jeddah, Mecca or Medina. Khaleeji for the UAE and the smaller Gulf states. For Riyadh and eastern Saudi Arabia, Khaleeji is actually the closer of the two.'
	},
	{
		a: 'saudi',
		b: 'egyptian-arabic',
		intelligibility:
			'High. Hijazi and Egyptian share the b- present and the ha-/7a- future, and Jeddah has always been full of Egyptians, so many words overlap. The main differences are ق (a g in Hijazi, a glottal stop in Cairo), the question words (eesh against eh) and words like da7een and abgha.',
		whichToLearn:
			'Egyptian Arabic for the widest reach across the Arab world. Hijazi if Saudi Arabia, and especially the west of the country, is where you will live, work or travel. Knowing one makes the other quick to pick up.'
	},
	{
		a: 'iraqi',
		b: 'levantine',
		intelligibility:
			'Moderate. Levantine media is widely watched in Iraq, so Iraqis follow Levantine well; Levantines need some exposure to Iraqi. Iraqi keeps a hard g for ق, says ch for many ك, and has its own words like hassa, shaku maku and hwaaya.',
		whichToLearn:
			'Iraqi if Iraq is your connection. Levantine if you are heading to Syria, Lebanon, Jordan or Palestine. Their sound systems differ enough that it is better to commit to one first.'
	}
];

/** Pages go live only when both dialects can be chosen in the app. */
export const DIALECT_COMPARISONS: ComparisonPair[] = ALL_COMPARISONS.filter(
	(pair) => isSelectableDialect(pair.a) && isSelectableDialect(pair.b)
);

export function comparisonSlug(pair: ComparisonPair): string {
	return `${pair.a}-vs-${pair.b}`;
}

export const COMPARISON_SLUGS = DIALECT_COMPARISONS.map(comparisonSlug);

export function findComparison(slug: string): ComparisonPair | undefined {
	return DIALECT_COMPARISONS.find((pair) => comparisonSlug(pair) === slug);
}
