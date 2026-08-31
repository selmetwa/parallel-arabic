import type { WordEntry, WordIndexEntry } from '$lib/types/words';

/**
 * The word files that exist, resolved at build time.
 *
 * Built by scripts/build-word-pages.ts, which only emits a word when the story
 * corpus can illustrate it with at least two sentences whose English
 * translation actually contains the word's meaning. Everything downstream reads
 * this rather than assuming a fixed word list.
 */
const files = import.meta.glob('./*/*.json', { eager: true }) as Record<
	string,
	{ default: WordEntry }
>;

const byDialect = new Map<string, Map<string, WordEntry>>();

for (const [path, mod] of Object.entries(files)) {
	const match = path.match(/^\.\/([^/]+)\/([^/]+)\.json$/);
	if (!match || match[2] === 'index') continue;

	const [, dialect, slug] = match;
	if (!byDialect.has(dialect)) byDialect.set(dialect, new Map());
	byDialect.get(dialect)!.set(slug, mod.default);
}

export const WORD_DIALECTS = [...byDialect.keys()];

export function wordSlugsFor(dialect: string): string[] {
	return [...(byDialect.get(dialect)?.keys() ?? [])];
}

export function getWord(dialect: string, slug: string): WordEntry | undefined {
	return byDialect.get(dialect)?.get(slug);
}

export function wordIndexFor(dialect: string): WordIndexEntry[] {
	return [...(byDialect.get(dialect)?.values() ?? [])]
		.sort((a, b) => a.frequencyRank - b.frequencyRank)
		.map((word) => ({ slug: word.slug, arabic: word.arabic, english: word.english }));
}

/** Other words in the same category, for internal linking. */
export function relatedWords(dialect: string, slug: string, take = 8): WordIndexEntry[] {
	const entries = byDialect.get(dialect);
	const word = entries?.get(slug);
	if (!entries || !word?.category) return [];

	return [...entries.values()]
		.filter((other) => other.slug !== slug && other.category === word.category)
		.sort((a, b) => a.frequencyRank - b.frequencyRank)
		.slice(0, take)
		.map((other) => ({ slug: other.slug, arabic: other.arabic, english: other.english }));
}
