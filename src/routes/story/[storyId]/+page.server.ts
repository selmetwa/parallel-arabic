import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, '/login');

  const storyId = params.storyId;
  console.log({ storyId });
  // const stories = await db.selectFrom('story').selectAll().execute();
  // console.log({ stories });

	// return {
	// 	userId: session.user.userId,
	// 	email: session.user.email,
  //   stories
	// };
};