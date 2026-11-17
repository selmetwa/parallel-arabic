import type { PageServerLoad } from './$types';
import { generateStructuredData } from '$lib/utils/seo';

const ARABIC_DIALECTS_FAQS = [
	{
		question: 'What are the main Arabic dialects?',
		answer:
			'The big groups are Egyptian, Levantine (Syria, Lebanon, Jordan, Palestine), Gulf or Khaleeji (UAE, Kuwait, Qatar, Bahrain, Oman), Iraqi, the Saudi dialects such as Hijazi, and the Maghrebi dialects of North Africa, led by Moroccan Darija. Modern Standard Arabic sits above them all as the shared written language.'
	},
	{
		question: 'Can speakers of different Arabic dialects understand each other?',
		answer:
			'Mostly, with effort that depends on distance. Egyptian, Levantine, Gulf, Iraqi and Hijazi speakers understand each other well, helped by shared TV and music. Moroccan Darija is the outlier: Moroccans usually understand eastern dialects, but most easterners struggle with Darija.'
	},
	{
		question: 'Which Arabic dialect is the most widely understood?',
		answer:
			'Egyptian. A century of Egyptian film, television and music means it is understood almost everywhere in the Arab world, which makes it a common first dialect for learners with no particular country in mind.'
	},
	{
		question: 'Should I learn Modern Standard Arabic or a dialect?',
		answer:
			'A dialect if you want to talk to people, since nobody speaks Modern Standard Arabic at home. Modern Standard Arabic if you mainly want to read, follow the news or study religious and classical texts. Many learners pick a dialect for speaking and add MSA for reading.'
	},
	{
		question: 'Which Arabic dialect should I learn?',
		answer:
			'The one spoken by the people you want to talk to. With no particular country in mind, Egyptian reaches the furthest, and Levantine is a close second. Gulf, Iraqi and Hijazi make the most sense if you live in or have ties to those countries, and Darija is the only dialect that really works in Morocco.'
	}
];

export const load: PageServerLoad = async () => ({
	faqs: ARABIC_DIALECTS_FAQS,
	seo: {
		title: 'Arabic Dialects Compared: Egyptian, Levantine, Gulf & More',
		description:
			'Hear the same sentences in Egyptian, Levantine, Gulf, Iraqi, Saudi and Moroccan Arabic and MSA, the words that differ, and which dialect to learn.',
		type: 'website'
	},
	breadcrumbTrail: [
		{ name: 'Home', path: '/' },
		{ name: 'Arabic dialects compared', path: '/arabic-dialects' }
	],
	structuredData: generateStructuredData('arabic-dialects', { faqs: ARABIC_DIALECTS_FAQS })
});
