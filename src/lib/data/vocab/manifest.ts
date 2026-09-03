import type { VocabTopic, VocabTopicSummary } from '$lib/types/vocab';

/**
 * Vocabulary topic files, resolved at build time.
 *
 * Written by scripts/build-vocab-topics.ts, which only emits a topic once it
 * has enough words that each carry a real example sentence. Globbed rather than
 * read from an index so an interrupted run leaves a correct partial set instead
 * of an index pointing at files that aren't there.
 */
const files = import.meta.glob('./*/*.json', { eager: true }) as Record<
	string,
	{ default: VocabTopic }
>;

const byDialect = new Map<string, Map<string, VocabTopic>>();

for (const [path, mod] of Object.entries(files)) {
	const match = path.match(/^\.\/([^/]+)\/([^/]+)\.json$/);
	if (!match) continue;

	const [, dialect, slug] = match;
	if (!byDialect.has(dialect)) byDialect.set(dialect, new Map());
	byDialect.get(dialect)!.set(slug, mod.default);
}

export const VOCAB_DIALECTS = [...byDialect.keys()];

export function topicSlugsFor(dialect: string): string[] {
	return [...(byDialect.get(dialect)?.keys() ?? [])];
}

export function getTopic(dialect: string, slug: string): VocabTopic | undefined {
	return byDialect.get(dialect)?.get(slug);
}

/**
 * Every topic for a dialect, biggest first, with "most common" pinned to the
 * front — it's the entry point, not just another topic.
 */
export function topicIndexFor(dialect: string): VocabTopicSummary[] {
	return [...(byDialect.get(dialect)?.values() ?? [])]
		.map((topic) => ({
			slug: topic.slug,
			label: topic.label,
			count: topic.words.length,
			preview: topic.words.slice(0, 4).map((w) => ({ arabic: w.arabic, english: w.english }))
		}))
		.sort((a, b) => {
			if (a.slug === 'most-common') return -1;
			if (b.slug === 'most-common') return 1;
			return b.count - a.count;
		});
}

/** Sibling topics, for the "keep going" links at the foot of a topic page. */
export function relatedTopics(dialect: string, slug: string, take = 6): VocabTopicSummary[] {
	return topicIndexFor(dialect)
		.filter((topic) => topic.slug !== slug)
		.slice(0, take);
}
