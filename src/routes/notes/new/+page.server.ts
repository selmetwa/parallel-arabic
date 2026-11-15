import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDefaultDialect } from '$lib/helpers/get-default-dialect';

export const load: PageServerLoad = async ({ parent }) => {
	const { session, user, isSubscribed } = await parent();
	if (!session || !user) throw redirect(302, '/login');
	if (!isSubscribed) throw redirect(302, '/notes');
	return { defaultDialect: getDefaultDialect(user) };
};
