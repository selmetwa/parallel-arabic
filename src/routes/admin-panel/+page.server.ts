import { redirect } from '@sveltejs/kit';
import type { PageServerLoad} from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();

  if (!session) {
    throw redirect(302, '/login');
  }

  const userId = session && session.user.userId || null;
  const user = await db.selectFrom('user').selectAll().where('id', '=', userId).executeTakeFirst();
 
  const adminEmails = ["sherifliketheclash@gmail.com", "selmetwa@gmail.com"]

  if (!adminEmails.includes(user?.email ?? '')) {
    throw redirect(302, '/')
  }

  const users = await db.selectFrom('user').selectAll().execute();
	return {
		user,
    users
	};
};


