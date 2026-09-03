/**
 * Shared corpus matching for the word and vocabulary generators.
 *
 * Both scripts illustrate a headword with real sentences from the generated
 * story corpus rather than inventing examples, and both have to survive the
 * same problem: story text is stored without diacritics, so an Arabic headword
 * can only be matched by its consonant skeleton, and skeletons are ambiguous.
 * The care taken here — prefix stripping, gloss checking — is what keeps a page
 * about السُّكّر ("diabetes") from being illustrated with sentences about السكر
 * ("sugar").
 */
import { readFileSync, existsSync } from 'fs';

export interface CorpusSentence {
	arabic: string;
	english: string;
	transliteration: string;
	storyId: string;
	storyTitle: string;
}

const TASHKEEL = /[ً-ْٰـ]/g;

/** Normalise for matching: drop diacritics and unify the letters that vary. */
export function normalise(text: string): string {
	return text
		.replace(TASHKEEL, '')
		.replace(/[أإآٱ]/g, 'ا')
		.replace(/ى/g, 'ي')
		.replace(/ة/g, 'ه')
		.replace(/ؤ/g, 'و')
		.replace(/ئ/g, 'ي')
		.trim();
}

/**
 * Strip the definite article from the front of a token.
 *
 * Only the article forms — stripping the single-letter clitics و ف ب ل ك too
 * matches far too much: بحبه ("I love him") would reduce to حبه and be offered
 * as an example of حبّة ("pill").
 */
export function stripPrefixes(token: string): string[] {
	const forms = new Set([token]);
	for (const prefix of ['ال', 'وال', 'بال', 'فال', 'لل', 'كال']) {
		if (token.startsWith(prefix) && token.length > prefix.length + 1) {
			forms.add(token.slice(prefix.length));
		}
	}
	return [...forms];
}

/** Loose stem so "dresses" matches "dress" and "changed" matches "change". */
export function stem(word: string): string {
	return word
		.toLowerCase()
		.replace(/(ies)$/, 'y')
		.replace(/(ing|ed|es|s)$/, '')
		.replace(/[^a-z]/g, '');
}

const GLOSS_STOPWORDS = new Set([
	'to',
	'a',
	'an',
	'the',
	'of',
	'and',
	'or',
	'be',
	'is',
	'are',
	'was',
	'were',
	'it',
	'in',
	'on',
	'at',
	'for',
	'with',
	'from',
	'that',
	'this',
	'his',
	'her',
	'someone',
	'something',
	'one',
	'not',
	'no',
	'yes',
	'do',
	'doe',
	'made',
	'make'
]);

/** Content tokens from an English gloss, e.g. "to leave; quit" -> [leav, quit]. */
export function glossTokens(gloss: string): string[] {
	return [
		...new Set(
			gloss
				.split(/[^A-Za-z]+/)
				.map(stem)
				.filter((t) => t.length > 2 && !GLOSS_STOPWORDS.has(t))
		)
	];
}

/**
 * Does this sentence's English translation actually contain the word's meaning?
 *
 * Requiring the gloss to show up in the translation is a cheap, surprisingly
 * strong check that a skeleton match illustrates the sense we mean.
 */
export function exampleMatchesSense(english: string, tokens: string[]): boolean {
	if (!tokens.length) return false;
	const words = new Set(english.split(/[^A-Za-z]+/).map(stem));
	return tokens.some((t) => words.has(t));
}

export function tokenise(sentence: string): string[] {
	return normalise(sentence)
		.split(/[^؀-ۿ]+/)
		.filter((t) => t.length > 1);
}

/** Index every sentence by every token form it contains. */
export function buildCorpusIndex(corpus: CorpusSentence[]): Map<string, CorpusSentence[]> {
	const byWord = new Map<string, CorpusSentence[]>();
	for (const sentence of corpus) {
		const seen = new Set<string>();
		for (const token of tokenise(sentence.arabic)) {
			for (const form of stripPrefixes(token)) {
				if (seen.has(form)) continue;
				seen.add(form);
				if (!byWord.has(form)) byWord.set(form, []);
				byWord.get(form)!.push(sentence);
			}
		}
	}
	return byWord;
}

/**
 * Sentences that both contain the headword and whose translation shows its
 * meaning, at most one per story so a page is never five lines of the same text.
 */
export function findExamples(
	byWord: Map<string, CorpusSentence[]>,
	skeleton: string,
	gloss: string,
	take = 6
): CorpusSentence[] {
	const tokens = glossTokens(gloss);
	return (byWord.get(skeleton) ?? [])
		.filter((s, i, all) => all.findIndex((o) => o.storyId === s.storyId) === i)
		.filter((s) => exampleMatchesSense(s.english, tokens))
		.slice(0, take);
}

/** URL-safe slug from a franco spelling, falling back to the Arabic. */
export function toSlug(franco: string, arabic: string, taken: Set<string>): string {
	let base = franco
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	if (!base) {
		base = encodeURIComponent(normalise(arabic)).replace(/%/g, '').toLowerCase().slice(0, 24);
	}

	let slug = base;
	let n = 2;
	while (taken.has(slug)) slug = `${base}-${n++}`;
	taken.add(slug);
	return slug;
}

/**
 * Read the story-sentence cache written by `npm run build:words`.
 *
 * Deliberately does not re-download: the cache is checked in and shared, and a
 * generator that silently pulls a different corpus makes its output
 * irreproducible.
 */
export function readCorpusCache(path: string): CorpusSentence[] {
	if (!existsSync(path)) {
		throw new Error(
			`No corpus cache at ${path}. Run \`npm run build:words -- --refresh-corpus\` first.`
		);
	}
	return JSON.parse(readFileSync(path, 'utf-8')) as CorpusSentence[];
}
