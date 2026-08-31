import { redirect } from '@sveltejs/kit';

// The alphabet experience moved to /alphabet, which is the URL with the
// search history. Permanent redirect so the old path consolidates into it.
export const load = () => {
	redirect(301, '/alphabet');
};
