import type { PageServerLoad } from "./$types";
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  const userId = session && session.user.userId || null;

  const sentencesViewed = await db.selectFrom('user').select('sentences_viewed').where('id', '=', userId ?? '').executeTakeFirst();

  return {
    sentencesViewed: sentencesViewed?.sentences_viewed ?? 0,
  };
};