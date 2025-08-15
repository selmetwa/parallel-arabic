import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { getUserHasActiveSubscription } from '$lib/helpers/get-user-has-active-subscription.js'

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();

  if (!session) {
    throw redirect(302, '/login');
  }

  const userId = session && session.user.userId || null;
  const user = await db.selectFrom('user').selectAll().where('id', '=', userId).executeTakeFirst();

  // Fetch user's generated stories across all dialects
  const userGeneratedStories = await db
    .selectFrom('generated_story')
    .selectAll()
    .where('user_id', '=', userId || '')
    .orderBy('created_at', 'desc')
    .execute();

	return {
		user,
    hasActiveSubscription: await getUserHasActiveSubscription(userId ?? ""),
    userGeneratedStories
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