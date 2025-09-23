import type { PageServerLoad } from "./$types";
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  const userId = session && session.user.userId || null;

  const video = await db.selectFrom('video').selectAll().orderBy('created_at', 'desc').execute();
  console.log({ video });
  
  return {
    session,
    userId
  };
};
