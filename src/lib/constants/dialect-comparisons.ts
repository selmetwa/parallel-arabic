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

export const DIALECT_COMPARISONS: ComparisonPair[] = [
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
	}
];

export function comparisonSlug(pair: ComparisonPair): string {
	return `${pair.a}-vs-${pair.b}`;
}

export const COMPARISON_SLUGS = DIALECT_COMPARISONS.map(comparisonSlug);

export function findComparison(slug: string): ComparisonPair | undefined {
	return DIALECT_COMPARISONS.find((pair) => comparisonSlug(pair) === slug);
}
