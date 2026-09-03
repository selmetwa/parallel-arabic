import type { PageServerLoad } from './$types';
import { PRONUNCIATION_FAQS } from '$lib/constants/egyptian-pronunciation';

export const prerender = true;

export const load: PageServerLoad = () => ({
	// Surfaced so the layout can emit FAQPage structured data, matching what the
	// dialect landing pages already do.
	faqs: PRONUNCIATION_FAQS
});
