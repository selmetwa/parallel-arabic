import type { PageServerLoad } from './$types';
import verbIndexData from '$lib/data/verb-conjugations/egyptian-arabic/index.json';

export const load: PageServerLoad = async ({ parent }) => {
  const { isSubscribed } = await parent();

  return {
    verbs: verbIndexData.verbs,
    hasActiveSubscription: isSubscribed
  };
};
