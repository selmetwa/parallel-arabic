import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildRound, isTenseChoice } from '$lib/games/verb-blitz';
import { isGameDialect } from '$lib/games/themes';
import { verbsFor } from '$lib/server/games/verb-blitz';

/**
 * A round of Verb Blitz, built from the conjugation tables. Only the ten
 * questions are sent, not the tables. The tables are our own content and
 * cost nothing to serve, so free rounds are counted in the browser only.
 */
export const GET: RequestHandler = async ({ url }) => {
	const dialectParam = url.searchParams.get('dialect');
	const tenseParam = url.searchParams.get('tense');
	const dialect = isGameDialect(dialectParam) ? dialectParam : 'egyptian-arabic';
	const tense = isTenseChoice(tenseParam) ? tenseParam : 'mixed';
	const items = buildRound(await verbsFor(dialect), dialect, tense);
	return json({ items });
};
