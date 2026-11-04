import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { demoVideoObject, faqPage, getDemo } from '$lib/constants/demos';

const BASE_URL = 'https://www.parallel-arabic.com';

export const load: PageServerLoad = async ({ params }) => {
	const demo = getDemo(params.slug);
	if (!demo) error(404, 'Demo not found');
	return {
		demo,
		seo: {
			title: demo.seo.title,
			description: demo.seo.description,
			image: `${BASE_URL}${demo.video.poster}`,
			url: `${BASE_URL}/demo/${demo.slug}`,
			type: 'video.other'
		},
		// Returning structuredData replaces the layout's FAQPage markup, so the
		// FAQs go in the same graph as the video.
		structuredData: {
			'@context': 'https://schema.org',
			'@graph': [demoVideoObject(demo, true), faqPage(demo.faqs)]
		},
		// featureName → breadcrumb leaf.
		featureName: `${demo.name} demo`
	};
};
