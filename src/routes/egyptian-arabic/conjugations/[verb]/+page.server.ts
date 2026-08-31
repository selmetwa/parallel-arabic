import type { PageServerLoad, EntryGenerator } from './$types';
import { error } from '@sveltejs/kit';
import type { VerbConjugationData } from '$lib/types/index';
import verbIndex from '$lib/data/verb-conjugations/egyptian-arabic/index.json';

// The conjugation data is static JSON committed to the repo, so these pages are
// built once at deploy time rather than server-rendered on every request.
export const prerender = true;

export const entries: EntryGenerator = () =>
  verbIndex.verbs.map((verb: { slug: string }) => ({ verb: verb.slug }));

export const load: PageServerLoad = async ({ params }) => {
  let verbData: VerbConjugationData;

  try {
    const mod = await import(
      `../../../../lib/data/verb-conjugations/egyptian-arabic/${params.verb}.json`
    );
    verbData = mod.default as VerbConjugationData;
  } catch {
    throw error(404, `Verb "${params.verb}" not found. Make sure to run npm run generate:conjugations first.`);
  }

  return {
    verb: verbData
  };
};
