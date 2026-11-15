import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { listTutorLessons } from '$lib/server/tutor-notes/store';

export const load: PageServerLoad = async ({ parent }) => {
	const { session, user, isSubscribed } = await parent();
	if (!session || !user) throw redirect(302, '/login');

	return {
		isSubscribed: Boolean(isSubscribed),
		lessons: isSubscribed ? await listTutorLessons(user.id) : []
	};
};
