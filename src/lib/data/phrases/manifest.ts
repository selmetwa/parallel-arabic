import type { PhraseEntry, PhraseIndexEntry } from '$lib/types/phrases';

/**
 * The phrase files that actually exist, resolved at build time.
 *
 * The generator writes one JSON file per dialect/phrase, and not every
 * combination is generated, so the sitemap, the route entry generators and the
 * phrasebook index all need to know what is really on disk. Reading the
 * individual files rather than the per-dialect index.json keeps this correct
 * even mid-generation, when the index has not been rebuilt yet.
 */
const files = import.meta.glob('./*/*.json', { eager: true }) as Record<
	string,
	{ default: PhraseEntry }
>;

const byDialect = new Map<string, Map<string, PhraseEntry>>();

for (const [path, mod] of Object.entries(files)) {
	const match = path.match(/^\.\/([^/]+)\/([^/]+)\.json$/);
	if (!match || match[2] === 'index') continue;

	const [, dialect, slug] = match;
	if (!byDialect.has(dialect)) byDialect.set(dialect, new Map());
	byDialect.get(dialect)!.set(slug, mod.default);
}

export function existsPhrase(dialect: string, slug: string): boolean {
	return byDialect.get(dialect)?.has(slug) ?? false;
}

export function phraseSlugsFor(dialect: string): string[] {
	return [...(byDialect.get(dialect)?.keys() ?? [])];
}

export function getPhrase(dialect: string, slug: string): PhraseEntry | undefined {
	return byDialect.get(dialect)?.get(slug);
}

/** Summary rows for the per-dialect phrasebook index, in seed order. */
export function phraseIndexFor(dialect: string, order: string[]): PhraseIndexEntry[] {
	const entries = byDialect.get(dialect);
	if (!entries) return [];

	return order
		.filter((slug) => entries.has(slug))
		.map((slug) => {
			const phrase = entries.get(slug)!;
			return {
				slug,
				english: phrase.english,
				arabic: phrase.arabicPlain || phrase.arabic,
				transliteration: phrase.transliteration
			};
		});
}
