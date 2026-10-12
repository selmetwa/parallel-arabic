import type { PageServerLoad } from './$types';
import { verbIndexFor } from '$lib/data/verb-conjugations/manifest';

export const load: PageServerLoad = async ({ params, parent }) => {
  const { isSubscribed } = await parent();

  return {
    dialect: params.dialect,
    verbs: verbIndexFor(params.dialect),
    hasActiveSubscription: isSubscribed
  };
};
