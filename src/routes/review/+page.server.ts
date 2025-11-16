import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
  const { session, user } = await parent();

  if (!session || !user) {
    throw redirect(302, '/login');
  }

  return {
    session,
    user
  };
};

