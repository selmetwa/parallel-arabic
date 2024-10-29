import { db } from '$lib/server/db';

export const load = async ({ params, locals }) => {
  const session = await locals.auth.validate();
  const userId = session && session.user.userId || null;

  const story = await db.selectFrom('generated_story').selectAll().where('id', '=', params.story).execute();

  return { 
    userId,
    story
  }
};