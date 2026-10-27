import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getGrammarTopic, grammarSearchTitle } from '$lib/data/grammar/topics';
import { grammarBody, grammarDialectsFor } from '$lib/data/grammar/manifest';
import { grammarExcerpt, renderGrammar } from '$lib/data/grammar/render';
import { formatDialectName } from '$lib/utils/seo';

export const load: PageServerLoad = async ({ params }) => {
	const topic = getGrammarTopic(params.slug);
	const body = topic ? grammarBody(params.dialect, params.slug) : undefined;
	if (!topic || !body) throw error(404, 'Grammar article not found');

	// The same article in the other dialects, for side-by-side comparison.
	const compare = grammarDialectsFor(params.slug)
		.filter((d) => d !== params.dialect)
		.map((d) => ({ dialect: d, html: renderGrammar(grammarBody(d, params.slug)!) }));

	const related = topic.related.map((slug) => getGrammarTopic(slug)).filter((t) => t !== undefined);

	const dialectName = formatDialectName(params.dialect);
	const heading = grammarSearchTitle(topic, dialectName);
	const description = grammarExcerpt(body);
	const url = `https://www.parallel-arabic.com/grammar/${params.dialect}/${topic.slug}`;
	return {
		dialect: params.dialect,
		topic,
		heading,
		html: renderGrammar(body),
		compare,
		related,
		seo: {
			title: `${heading} | Parallel Arabic`,
			description,
			type: 'article'
		},
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: heading,
			description,
			url,
			mainEntityOfPage: url,
			inLanguage: 'en',
			about: { '@type': 'Language', name: dialectName },
			educationalLevel: topic.level,
			learningResourceType: 'Grammar reference',
			isAccessibleForFree: true,
			publisher: { '@type': 'Organization', name: 'Parallel Arabic', url: 'https://www.parallel-arabic.com' }
		}
	};
};
