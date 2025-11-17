import type { PageServerLoad } from './$types';
import { loadLesson1 } from '$lib/constants/lessons';

export const load: PageServerLoad = async () => {
	const lesson1 = await loadLesson1();
	return {
		lesson1
	};
};
