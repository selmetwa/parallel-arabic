import { db } from '$lib/server/db';

export const load  = async ({ locals }) => {
  const session = await locals.auth.validate();

  const userId = session && session.user.userId || null;
  const user = await db.selectFrom('user').selectAll().where('id', '=', userId).executeTakeFirst();

  return {
    session,
    user
  };
}