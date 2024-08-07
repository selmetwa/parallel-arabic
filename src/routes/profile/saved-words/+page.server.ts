import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();

  if (!session) {
    throw redirect(302, '/login');
  }

  const userId = session && session.user.userId || null;
  const savedWords = await db.selectFrom('saved_word').selectAll().where('user_id', '=', userId).execute();

	return {
		userId: userId,
		email:(session && session.user.email) || null,
    savedWords
	};
};
