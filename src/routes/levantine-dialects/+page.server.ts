import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { NUR_ENABLED } from '$lib/constants/feature-flags';
import { generateStructuredData } from '$lib/utils/seo';

const LEVANTINE_DIALECTS_FAQS = [
	{
		question: 'Can Syrians, Lebanese, Jordanians and Palestinians understand each other?',
		answer:
			'Yes, easily. They are four accents of one dialect, Levantine (Shami) Arabic, and share their grammar and almost all of their everyday words. The differences are a short list of words like now and this, and the melody.'
	},
	{
		question: 'Which Levantine dialect should I learn?',
		answer:
			'The one spoken by the people you want to talk to. If you have no particular country in mind, learn general Levantine: it is understood across all four countries, and you can lean into one accent later by learning a handful of words.'
	},
	{
		question: 'Is Lebanese Arabic different from Syrian Arabic?',
		answer:
			'Only a little. Lebanese says hayda for this where Syrians say hada, uses eh for yes, and mixes in French greetings like bonjour and merci. Grammar and most vocabulary are the same.'
	},
	{
		question: 'How do I learn a specific Levantine accent on Parallel Arabic?',
		answer:
			'Take the Levantine course and pick your accent: Syrian, Lebanese, Jordanian or Palestinian. Your audio, your tutor and the stories written for you then use that accent, while the lessons teach the shared Levantine core.'
	}
];

export const load: PageServerLoad = async () => {
	if (!NUR_ENABLED) error(404, 'Not found');
	return {
		faqs: LEVANTINE_DIALECTS_FAQS,
		seo: {
			title: 'Syrian vs Lebanese vs Jordanian vs Palestinian Arabic',
			description:
				'How Syrian, Lebanese, Jordanian and Palestinian Arabic differ: the same sentences in four native accents, the words that give each away, and which to learn.',
			type: 'website'
		},
		breadcrumbTrail: [
			{ name: 'Home', path: '/' },
			{ name: 'Levantine Arabic', path: '/levantine' },
			{ name: 'Levantine dialects compared', path: '/levantine-dialects' }
		],
		structuredData: generateStructuredData('levantine-dialects', { faqs: LEVANTINE_DIALECTS_FAQS })
	};
};
