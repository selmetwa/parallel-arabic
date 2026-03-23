import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import type { VerbConjugationData } from '$lib/types/index';

export const load: PageServerLoad = async ({ params, parent }) => {
  const { isSubscribed } = await parent();

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
    verb: verbData,
    hasActiveSubscription: isSubscribed
  };
};
