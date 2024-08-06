import type { PageServerLoad } from './$types';

const API_URL = 'https://egyptian-arabic-vocab-selmetwa.koyeb.app';

export const load: PageServerLoad = async ({ params }) => {
	const section = params.section;
	const response = await fetch(`${API_URL}/vocab/${section}`);
	const json = await response.json();

	return {
		words: json
	};
};
