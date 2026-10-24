import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { VERB_DIALECTS, loadVerb, verbIndexFor } from '$lib/data/verb-conjugations/manifest';

// Not prerendered: the Vercel adapter adds two routes per prerendered page and
// Vercel caps a deployment at 2048 routes. These ~500 pages would push us over;
// the data is bundled static JSON, so server-rendering them is cheap.

export const load: PageServerLoad = async ({ params }) => {
  const verb = await loadVerb(params.dialect, params.verb);
  if (!verb) {
    throw error(404, `Verb "${params.verb}" not found. Make sure to run npm run generate:conjugations first.`);
  }

  // The same verb in the other dialects — every dialect shares the slugs.
  const otherDialects = VERB_DIALECTS.filter((d) => d !== params.dialect).flatMap((dialect) => {
    const entry = verbIndexFor(dialect).find((v) => v.slug === params.verb);
    if (!entry) return [];
    return [{ dialect, arabic: entry.arabic, transliteration: entry.transliteration }];
  });

  return { verb, dialect: params.dialect, otherDialects };
};
