import { redirect } from '@sveltejs/kit';

// The whole /alphabet section (index, learn, practice, ...) now lives at /alphabet-new.
export const load = () => {
	redirect(307, '/alphabet-new');
};
