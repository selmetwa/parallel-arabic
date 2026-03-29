import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { session, user } = await parent();
	return { session, user };
};
