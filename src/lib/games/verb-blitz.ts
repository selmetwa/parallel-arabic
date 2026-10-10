import { shuffle } from './shuffle';
import type { GameDialect } from './themes';
import { stripArabicDiacritics } from '$lib/utils/arabic-normalization';

export const QUESTIONS_PER_ROUND = 10;
export const OPTIONS = 4;
/** About one question in three is negative. */
const NEGATIVE_SHARE = 0.3;

export const PERSONS = ['ana', 'enta', 'enti', 'howa', 'heya', 'ehna', 'entu', 'homma'] as const;
export type Person = (typeof PERSONS)[number];
export const TENSES = ['past', 'present', 'future'] as const;
export type Tense = (typeof TENSES)[number];
export type TenseChoice = Tense | 'mixed';

export interface VerbForm {
	person: Person;
	arabic: string;
	transliteration: string;
	english: string;
}

export interface VerbFile {
	slug: string;
	arabic: string;
	transliteration: string;
	english: string;
	conjugations: Record<Tense, Record<'affirmative' | 'negative', VerbForm[]>>;
}

export interface BlitzQuestion {
	verb: { arabic: string; transliteration: string; english: string };
	person: Person;
	tense: Tense;
	negative: boolean;
	options: { arabic: string; transliteration: string }[];
	answer: number;
	/** "she lived" */
	english: string;
}

/** Each dialect's own pronouns, so the prompt reads naturally. */
export const PRONOUNS: Record<GameDialect, Record<Person, [string, string]>> = {
	'egyptian-arabic': {
		ana: ['أنا', 'ana'],
		enta: ['إنت', 'enta'],
		enti: ['إنتي', 'enti'],
		howa: ['هو', 'howa'],
		heya: ['هي', 'heya'],
		ehna: ['إحنا', 'e7na'],
		entu: ['إنتو', 'entu'],
		homma: ['هما', 'homma']
	},
	levantine: {
		ana: ['أنا', 'ana'],
		enta: ['إنت', 'inta'],
		enti: ['إنتي', 'inti'],
		howa: ['هو', 'huwwe'],
		heya: ['هي', 'hiyye'],
		ehna: ['نحنا', 'ni7na'],
		entu: ['إنتو', 'intu'],
		homma: ['هني', 'hinne']
	},
	darija: {
		ana: ['أنا', 'ana'],
		enta: ['نتا', 'nta'],
		enti: ['نتي', 'nti'],
		howa: ['هو', 'huwa'],
		heya: ['هي', 'hiya'],
		ehna: ['حنا', '7na'],
		entu: ['نتوما', 'ntuma'],
		homma: ['هوما', 'huma']
	},
	fusha: {
		ana: ['أنا', 'ana'],
		enta: ['أنتَ', 'anta'],
		enti: ['أنتِ', 'anti'],
		howa: ['هو', 'huwa'],
		heya: ['هي', 'hiya'],
		ehna: ['نحن', 'na7nu'],
		entu: ['أنتم', 'antum'],
		homma: ['هم', 'hum']
	}
};

/**
 * Egyptian, Levantine and Darija are written without tashkeel, so "I opened"
 * and "you opened" can look the same. Two options never look the same.
 */
const looks = (arabic: string) => stripArabicDiacritics(arabic).replace(/\s+/g, ' ').trim();
const keyFor = (dialect: GameDialect, arabic: string) =>
	dialect === 'fusha' ? arabic.trim() : looks(arabic);

export function buildQuestion(
	verb: VerbFile,
	dialect: GameDialect,
	tense: Tense,
	negative: boolean,
	random: () => number = Math.random
): BlitzQuestion | null {
	const polarity = negative ? 'negative' : 'affirmative';
	const forms = verb.conjugations[tense][polarity];
	const right = forms[Math.floor(random() * forms.length)];
	const seen = new Set([keyFor(dialect, right.arabic)]);
	const wrong: VerbForm[] = [];
	const add = (f: VerbForm) => {
		const k = keyFor(dialect, f.arabic);
		if (wrong.length < OPTIONS - 1 && !seen.has(k)) {
			seen.add(k);
			wrong.push(f);
		}
	};
	// Same tense, other people first; then the same person in another tense.
	for (const f of shuffle(forms, random)) add(f);
	for (const t of shuffle(TENSES, random)) {
		if (t !== tense) add(verb.conjugations[t][polarity].find((f) => f.person === right.person)!);
	}
	if (wrong.length < OPTIONS - 1) return null;

	const options = shuffle([right, ...wrong], random);
	return {
		verb: { arabic: verb.arabic, transliteration: verb.transliteration, english: verb.english },
		person: right.person,
		tense,
		negative,
		options: options.map((o) => ({ arabic: o.arabic, transliteration: o.transliteration })),
		answer: options.indexOf(right),
		english: right.english
	};
}

export function buildRound(
	verbs: VerbFile[],
	dialect: GameDialect,
	tense: TenseChoice,
	random: () => number = Math.random
): BlitzQuestion[] {
	const out: BlitzQuestion[] = [];
	for (const verb of shuffle(verbs, random)) {
		if (out.length >= QUESTIONS_PER_ROUND) break;
		const t = tense === 'mixed' ? TENSES[Math.floor(random() * TENSES.length)] : tense;
		const q = buildQuestion(verb, dialect, t, random() < NEGATIVE_SHARE, random);
		if (q) out.push(q);
	}
	return out;
}

export function isTenseChoice(value: unknown): value is TenseChoice {
	return value === 'mixed' || (TENSES as readonly unknown[]).includes(value);
}
