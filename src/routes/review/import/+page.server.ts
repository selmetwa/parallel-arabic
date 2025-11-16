import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { sections } from '$lib/constants/sections';
import { darijaSections } from '$lib/constants/darija-sections';
import { fushaSections } from '$lib/constants/fusha-sections';

export const load: PageServerLoad = async ({ parent }) => {
  const { session, user } = await parent();

  if (!session || !user) {
    throw redirect(302, '/login');
  }

  return {
    session,
    user,
    sections: {
      'egyptian-arabic': sections,
      'darija': darijaSections,
      'fusha': fushaSections
    }
  };
};

