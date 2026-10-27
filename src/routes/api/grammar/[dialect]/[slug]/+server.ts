import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGrammarTopic } from '$lib/data/grammar/topics';
import { grammarBody } from '$lib/data/grammar/manifest';
import { grammarExcerpt, renderGrammar } from '$lib/data/grammar/render';

// One grammar article as HTML, for the in-lesson grammar sheet.
export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const topic = getGrammarTopic(params.slug);
	const body = topic ? grammarBody(params.dialect, params.slug) : undefined;
	if (!topic || !body) throw error(404, 'Grammar article not found');

	setHeaders({ 'cache-control': 'public, max-age=3600' });
	return json({
		slug: topic.slug,
		title: topic.title,
		summary: grammarExcerpt(body, 400),
		html: renderGrammar(body)
	});
};
