import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Scenarios moved to a page of its own; keep old links (and their ?scene=) working.
export const load: PageServerLoad = ({ url }) => {
	redirect(301, `/scenarios${url.search}`);
};
