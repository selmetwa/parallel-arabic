import type { PageServerLoad } from './$types';
import { getGame } from '$lib/constants/games';

const game = getGame('word-match')!;

export const load: PageServerLoad = async () => {
	// faqs → FAQPage markup (layout); gameName → breadcrumb leaf.
	return { faqs: game.faqs, gameName: game.name };
};
