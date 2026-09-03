import type { PageServerLoad, EntryGenerator } from './$types';
import { error } from '@sveltejs/kit';
import { getTopic, relatedTopics, topicSlugsFor } from '$lib/data/vocab/manifest';
import { wordSlugsFor } from '$lib/data/words/manifest';

export const prerender = true;

const DIALECT = 'egyptian-arabic';

export const entries: EntryGenerator = () => topicSlugsFor(DIALECT).map((topic) => ({ topic }));

export const load: PageServerLoad = async ({ params }) => {
	const topic = getTopic(DIALECT, params.topic);
	if (!topic) throw error(404, `No "${params.topic}" vocabulary yet.`);

	// Only link to a word page that actually exists — the word pages are gated
	// on having two example sentences, so most topic words don't have one.
	const wordPages = new Set(wordSlugsFor(DIALECT));

	// The page shows example sentences for the first few words only, but the
	// topic file carries up to three for every word. On the thousand-word list
	// that is ~3,000 sentences serialised into the prerendered payload and never
	// rendered, so drop them past the showcase.
	const SHOWCASE = 5;
	let shown = 0;
	const words = topic.words.map((word) => {
		if (word.examples.length && shown < SHOWCASE) {
			shown++;
			return { ...word, examples: word.examples.slice(0, 1) };
		}
		return { ...word, examples: [] };
	});

	return {
		dialect: DIALECT,
		topic: { ...topic, words },
		wordPageSlugs: topic.words.filter((w) => wordPages.has(w.slug)).map((w) => w.slug),
		related: relatedTopics(DIALECT, params.topic)
	};
};
