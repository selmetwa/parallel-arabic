import type { PageServerLoad, EntryGenerator } from './$types';
import { error } from '@sveltejs/kit';
import { PHRASE_DIALECTS, PHRASE_SEEDS } from '$lib/constants/phrase-seeds';
import { phraseIndexFor, phraseSlugsFor } from '$lib/data/phrases/manifest';

// The phrase data is static JSON in the repo, so these build at deploy time.
export const prerender = true;

export const entries: EntryGenerator = () =>
	PHRASE_DIALECTS.filter((dialect) => phraseSlugsFor(dialect).length).map((dialect) => ({
		dialect
	}));

const SEED_ORDER = PHRASE_SEEDS.map((seed) => seed.slug);

export const load: PageServerLoad = async ({ params }) => {
	const phrases = phraseIndexFor(params.dialect, SEED_ORDER);
	if (!phrases.length) throw error(404, `No phrasebook for "${params.dialect}" yet.`);

	return { dialect: params.dialect, phrases };
};
