import type { VerbConjugationData } from '$lib/types/index';

export interface VerbIndexEntry {
	slug: string;
	arabic: string;
	transliteration: string;
	english: string;
	wordId: string | null;
	rootLetters: string;
	verbClass: 'sound' | 'hollow' | 'defective' | 'irregular' | 'doubled';
}

/**
 * The conjugation indexes that exist, one per dialect, resolved at build time.
 * Every dialect covers the same verbs under the same slugs, which is what lets
 * a verb page link to itself in the other three.
 */
const indexes = import.meta.glob('./*/index.json', { eager: true }) as Record<
	string,
	{ default: { verbs: VerbIndexEntry[] } }
>;

const byDialect = new Map<string, VerbIndexEntry[]>();
for (const [path, mod] of Object.entries(indexes)) {
	const dialect = path.match(/^\.\/([^/]+)\/index\.json$/)?.[1];
	if (dialect) byDialect.set(dialect, mod.default.verbs);
}

/** The full tables, loaded one verb at a time. */
const files = import.meta.glob<{ default: VerbConjugationData }>('./*/*.json');

export const VERB_DIALECTS = [...byDialect.keys()];

export function verbIndexFor(dialect: string): VerbIndexEntry[] {
	return byDialect.get(dialect) ?? [];
}

export async function loadVerb(
	dialect: string,
	slug: string
): Promise<VerbConjugationData | undefined> {
	if (slug === 'index') return undefined;
	const loader = files[`./${dialect}/${slug}.json`];
	return loader ? (await loader()).default : undefined;
}
