import type { PageServerLoad } from './$types';
import { GAMES_HUB_FAQS } from '$lib/constants/games';

export const load: PageServerLoad = async () => {
	// Surfaced so the layout can emit FAQPage structured data.
	return { faqs: GAMES_HUB_FAQS };
};
