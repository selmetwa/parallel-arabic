import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, '/login');

  const stories = await db.selectFrom('stories').selectAll().execute();

  console.log({ stories });

	return {
		userId: session.user.userId,
		email: session.user.email
	};
};