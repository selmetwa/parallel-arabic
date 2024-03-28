import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const API_URL = 'https://egyptian-arabic-vocab-selmetwa.koyeb.app';

export const load: PageServerLoad = async ({ locals, params }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, '/login');

	const section = params.section;
	const response = await fetch(`${API_URL}/vocab/${section}`);
	const json = await response.json();

	return {
		words: json
	};
};
