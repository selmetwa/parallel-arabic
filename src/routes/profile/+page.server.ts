import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '../../lib/server/db';

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

export const actions: Actions = {
	logout: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401);
		await auth.invalidateSession(session.sessionId); // invalidate session
		locals.auth.setSession(null); // remove cookie
		throw redirect(302, '/login'); // redirect to login page
	}
};