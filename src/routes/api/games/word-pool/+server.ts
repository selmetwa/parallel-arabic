import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { isGameDialect, resolveTheme } from '$lib/games/themes';
import { buildPool, type WordRow } from '$lib/games/word-pool';

/**
 * The cleaned word list for one dialect and theme. Deterministic (the client
 * shuffles), so it caches well. Kept out of search: the words are licensed and
 * stay in-app — see docs/egyptian-arabic-intent-pages-plan.md.
 */
export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const dialect = url.searchParams.get('dialect');
	if (!isGameDialect(dialect)) {
		return json({ error: 'Unknown dialect' }, { status: 400 });
	}

	const theme = resolveTheme(dialect, url.searchParams.get('theme'));

	const { data, error } = await supabase
		.from('word')
		.select('id, arabic_word, english_word, transliterated_word, audio_url')
		.eq('dialect', dialect)
		.eq('category', theme.categories[dialect]!)
		.order('id');

	if (error) {
		console.error('word-pool query failed:', error);
		return json({ error: 'Could not load words' }, { status: 500 });
	}

	setHeaders({
		'cache-control': 'public, max-age=3600, s-maxage=86400',
		'x-robots-tag': 'noindex'
	});

	return json({ theme: theme.id, words: buildPool((data ?? []) as WordRow[]) });
};
