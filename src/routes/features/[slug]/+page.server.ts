import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFeature } from '$lib/constants/features';
import { demosForFeature, demoVideoObject, faqPage } from '$lib/constants/demos';

export const load: PageServerLoad = async ({ params }) => {
	const feature = getFeature(params.slug);
	if (!feature) error(404, 'Feature not found');
	const demos = demosForFeature(feature.slug);
	return {
		feature,
		demos,
		// faqs → FAQPage markup (layout); featureName → breadcrumb leaf.
		faqs: feature.faqs,
		featureName: feature.name,
		// A page with demo videos supplies its own graph, which replaces the
		// layout's markup, so the FAQs go in alongside the videos.
		...(demos.length && {
			structuredData: {
				'@context': 'https://schema.org',
				'@graph': [faqPage(feature.faqs), ...demos.map((demo) => demoVideoObject(demo))]
			}
		})
	};
};
