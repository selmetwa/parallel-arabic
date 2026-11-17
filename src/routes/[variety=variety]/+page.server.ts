import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getVarietyBySlug } from '$lib/constants/varieties';
import { VARIETY_LANDING } from '$lib/constants/variety-landing';
import { getDialectInfo } from '$lib/constants/dialects';
import { formatDialectName, generateStructuredData } from '$lib/utils/seo';

export const load: PageServerLoad = async ({ params }) => {
	const variety = getVarietyBySlug(params.variety);
	if (!variety) error(404, 'Not found');

	const content = VARIETY_LANDING[variety.key];
	const parent = getDialectInfo(variety.dialect)?.name ?? variety.dialect;
	const faqs = [
		{
			question: `Is ${variety.name} the same as ${parent}?`,
			answer: `${variety.shortName} is one of the main varieties of ${parent}, and shares most of its grammar and words. On Parallel Arabic you take the ${parent} course and choose ${variety.shortName}: the audio, your tutor and the stories written for you then use ${variety.shortName} words and a ${variety.shortName} voice.`
		},
		content.faq
	];

	return {
		variety: variety.key,
		faqs,
		seo: { ...content.seo, type: 'website' },
		// Home › Levantine Arabic › Lebanese Arabic (BreadcrumbList JSON-LD).
		breadcrumbTrail: [
			{ name: 'Home', path: '/' },
			// Same name the dialect page's own breadcrumb uses.
			{ name: formatDialectName(variety.dialect), path: `/${variety.dialect}` },
			{ name: variety.name, path: `/${variety.slug}` }
		],
		structuredData: generateStructuredData('variety', { faqs })
	};
};
