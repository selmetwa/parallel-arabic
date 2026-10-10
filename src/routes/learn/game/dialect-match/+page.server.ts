import type { PageServerLoad } from './$types';
import { getGame } from '$lib/constants/games';
import { dialectMatchItems } from '$lib/server/games/dialect-match-items';

const game = getGame('dialect-match')!;

export const load: PageServerLoad = async () => {
	// faqs → FAQPage markup (layout); gameName → breadcrumb leaf.
	return { faqs: game.faqs, gameName: game.name, items: dialectMatchItems() };
};
