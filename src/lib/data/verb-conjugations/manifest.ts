import type { VerbConjugationData } from '$lib/types/index';
import { isSelectableDialect } from '$lib/constants/dialects';
import type { DerivedForm } from './glossary';
import forms from './forms.json';

export interface VerbIndexEntry {
	slug: string;
	arabic: string;
	transliteration: string;
	english: string;
	wordId: string | null;
	rootLetters: string;
	verbClass: 'sound' | 'hollow' | 'defective' | 'irregular' | 'doubled';
	/** The derived-form pattern (I–X). Kept apart from the generated tables so a rebuild keeps it. */
	form?: DerivedForm;
}

const formsByDialect = forms as Record<string, Record<string, DerivedForm>>;

export function verbFormFor(dialect: string, slug: string): DerivedForm | undefined {
	return formsByDialect[dialect]?.[slug];
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
	if (dialect)
		byDialect.set(
			dialect,
			mod.default.verbs.map((v) => ({ ...v, form: verbFormFor(dialect, v.slug) }))
		);
}

/** The full tables, loaded one verb at a time. */
const files = import.meta.glob<{ default: VerbConjugationData }>('./*/*.json');

// Dialects still being built out stay off the sitemap and prerendered pages until launch.
export const VERB_DIALECTS = [...byDialect.keys()].filter(isSelectableDialect);

export function verbIndexFor(dialect: string): VerbIndexEntry[] {
	return byDialect.get(dialect) ?? [];
}

export async function loadVerb(
	dialect: string,
	slug: string
): Promise<(VerbConjugationData & { form?: DerivedForm }) | undefined> {
	if (slug === 'index') return undefined;
	const loader = files[`./${dialect}/${slug}.json`];
	if (!loader) return undefined;
	return { ...(await loader()).default, form: verbFormFor(dialect, slug) };
}
