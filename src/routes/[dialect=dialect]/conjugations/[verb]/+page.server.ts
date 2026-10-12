import type { PageServerLoad, EntryGenerator } from './$types';
import { error } from '@sveltejs/kit';
import { VERB_DIALECTS, loadVerb, verbIndexFor } from '$lib/data/verb-conjugations/manifest';

// The conjugation data is static JSON committed to the repo, so these pages are
// built once at deploy time rather than server-rendered on every request.
export const prerender = true;

export const entries: EntryGenerator = () =>
  VERB_DIALECTS.flatMap((dialect) =>
    verbIndexFor(dialect).map((verb) => ({ dialect, verb: verb.slug }))
  );

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
