import type { PageServerLoad } from './$types';
import { KEYBOARD_FAQS } from '$lib/constants/keyboard-faqs';

export const load: PageServerLoad = () => ({
  // Surfaced so the layout can emit FAQPage structured data.
  faqs: KEYBOARD_FAQS
});
