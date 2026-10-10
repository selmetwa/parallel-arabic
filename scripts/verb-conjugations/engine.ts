/**
 * Expands a verb's stems into the 48 forms the conjugation files hold
 * (3 tenses × affirmative/negative × 8 persons), in the same JSON shape as
 * src/lib/data/verb-conjugations/egyptian-arabic/*.json.
 *
 * The stems in levantine.ts, darija.ts and fusha.ts are the content: they were
 * written by hand, with every irregular form spelled out. This file only
 * applies each dialect's regular prefixes and suffixes, so a reviewer can
 * check one line per verb instead of 48 forms.
 *
 * Person keys stay the Egyptian ones (ana … homma) in every dialect, so the
 * game and pages can line the dialects up; the English is per person.
 */

export const PERSONS = ['ana', 'enta', 'enti', 'howa', 'heya', 'ehna', 'entu', 'homma'] as const;
export type Person = (typeof PERSONS)[number];

export interface Form {
	person: Person;
	arabic: string;
	transliteration: string;
	english: string;
}

type Table = Record<'affirmative' | 'negative', Form[]>;
export interface Conjugations {
	past: Table;
	present: Table;
	future: Table;
}

/** Arabic + transliteration, side by side. */
export type AT = [arabic: string, transliteration: string];

export interface EnglishForms {
	/** "to live" */
	base: string;
	/** "lived" */
	past: string;
	/** "live" / third person "lives" */
	present: string;
	presentThird: string;
}

export interface VerbMeta {
	slug: string;
	english: EnglishForms;
	/** Space-separated root letters. */
	root: string;
	verbClass: string;
	notes: string;
}

const PRONOUN: Record<Person, string> = {
	ana: 'I',
	enta: 'you (m)',
	enti: 'you (f)',
	howa: 'he',
	heya: 'she',
	ehna: 'we',
	entu: 'you (pl)',
	homma: 'they'
};

const isThird = (p: Person) => p === 'howa' || p === 'heya';

const BE_PRESENT: Record<Person, string> = {
	ana: 'am',
	enta: 'are',
	enti: 'are',
	howa: 'is',
	heya: 'is',
	ehna: 'are',
	entu: 'are',
	homma: 'are'
};

/** "to be" doesn't follow the pattern: I was / you were, I am / he is. */
function englishBe(tense: keyof Conjugations, negative: boolean, p: Person) {
	const who = PRONOUN[p];
	if (tense === 'future') return `${who} ${negative ? "won't" : 'will'} be`;
	if (tense === 'past') {
		const was = p === 'ana' || isThird(p) ? 'was' : 'were';
		return `${who} ${was}${negative ? "n't" : ''}`;
	}
	return `${who} ${BE_PRESENT[p]}${negative ? ' not' : ''}`;
}

export function englishFor(e: EnglishForms, tense: keyof Conjugations, negative: boolean, p: Person) {
	if (e.base === 'to be') return englishBe(tense, negative, p);
	const who = PRONOUN[p];
	if (tense === 'past') return negative ? `${who} didn't ${e.present}` : `${who} ${e.past}`;
	if (tense === 'future') return negative ? `${who} won't ${e.present}` : `${who} will ${e.present}`;
	if (negative) return `${who} ${isThird(p) ? "doesn't" : "don't"} ${e.present}`;
	return `${who} ${isThird(p) ? e.presentThird : e.present}`;
}

export function table(
	meta: VerbMeta,
	tense: keyof Conjugations,
	aff: Record<Person, AT>,
	neg: Record<Person, AT>
): Table {
	const build = (src: Record<Person, AT>, negative: boolean) =>
		PERSONS.map((person) => ({
			person,
			arabic: src[person][0],
			transliteration: src[person][1],
			english: englishFor(meta.english, tense, negative, person)
		}));
	return { affirmative: build(aff, false), negative: build(neg, true) };
}

export function mapPersons(f: (p: Person) => AT): Record<Person, AT> {
	return Object.fromEntries(PERSONS.map((p) => [p, f(p)])) as Record<Person, AT>;
}

/** Apply per-person overrides (irregular forms) on top of generated ones. */
export function withOverrides(
	forms: Record<Person, AT>,
	overrides: Partial<Record<Person, AT>> = {}
): Record<Person, AT> {
	return { ...forms, ...overrides };
}

export function fileFor(
	meta: VerbMeta,
	citation: AT,
	conjugations: Conjugations
): Record<string, unknown> {
	return {
		slug: meta.slug,
		arabic: citation[0],
		transliteration: citation[1],
		english: meta.english.base,
		wordId: null,
		rootLetters: meta.root,
		verbClass: meta.verbClass,
		notes: meta.notes,
		conjugations
	};
}

/**
 * "We" in the past: stem + نا, except that a stem ending in ن merges with it
 * (كن + نا is written كنا, kunna).
 */
export function pastWe(s2: AT, suffix: AT = ['نا', 'na']): AT {
	const ar = s2[0].endsWith('ن') ? `${s2[0]}${suffix[0].slice(1)}` : `${s2[0]}${suffix[0]}`;
	return [ar, `${s2[1]}${suffix[1]}`];
}
