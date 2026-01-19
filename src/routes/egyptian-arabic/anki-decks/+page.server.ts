import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Redirect to the new unified anki-decks page
export const load: PageServerLoad = async () => {
  throw redirect(301, '/anki-decks');
};
