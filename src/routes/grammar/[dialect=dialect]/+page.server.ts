import type { PageServerLoad } from './$types';
import { GRAMMAR_DIALECTS, GRAMMAR_LEVELS, GRAMMAR_TOPICS, hasGrammar } from '$lib/data/grammar/topics';
import { formatDialectName } from '$lib/utils/seo';

export const load: PageServerLoad = async ({ params }) => {
	const dialectName = formatDialectName(params.dialect);
	const available = hasGrammar(params.dialect);

	return {
		dialect: params.dialect,
		available,
		levels: GRAMMAR_LEVELS.map((l) => ({
			...l,
			topics: GRAMMAR_TOPICS.filter((t) => t.level === l.level)
		})),
		otherDialects: GRAMMAR_DIALECTS.filter((d) => d !== params.dialect),
		seo: {
			title: `${dialectName} Grammar - A Plain-English Reference | Parallel Arabic`,
			description: `${dialectName} grammar explained simply: pronouns, possessive endings, plurals, numbers and counting, the present, past and future, verb forms and more, with examples and transliteration.`,
			noindex: !available
		}
	};
};
