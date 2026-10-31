import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { puzzleFor } from '$lib/server/games/daily-root';
import { isGameDialect } from '$lib/games/themes';

/** Today's puzzle (UTC), in the asked-for dialect. Free for everyone: no free-round counting. */
export const GET: RequestHandler = async ({ url, setHeaders }) => {
	setHeaders({ 'cache-control': 'no-store' });
	const dialect = url.searchParams.get('dialect');
	return json({ puzzle: puzzleFor(undefined, isGameDialect(dialect) ? dialect : 'fusha') });
};
