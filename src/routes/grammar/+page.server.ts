import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDefaultDialect } from '$lib/helpers/get-default-dialect';

// Straight to the learner's dialect: they shouldn't have to pick it again.
export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	redirect(307, `/grammar/${getDefaultDialect(user)}`);
};
