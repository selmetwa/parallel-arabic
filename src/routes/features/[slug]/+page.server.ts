import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getFeature } from '$lib/constants/features';

export const load: PageServerLoad = async ({ params }) => {
	const feature = getFeature(params.slug);
	if (!feature) error(404, 'Feature not found');
	// faqs → FAQPage markup (layout); featureName → breadcrumb leaf.
	return { feature, faqs: feature.faqs, featureName: feature.name };
};
