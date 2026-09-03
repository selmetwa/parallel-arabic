import type { PageServerLoad } from './$types';
import { BEGINNERS_FAQS } from '$lib/constants/egyptian-beginners';

export const prerender = true;

export const load: PageServerLoad = () => ({
	// Surfaced so the layout can emit FAQPage structured data.
	faqs: BEGINNERS_FAQS
});
