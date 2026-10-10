import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { puzzleFor } from '$lib/server/games/daily-root';

/** Today's puzzle (UTC). Free for everyone: no free-round counting. */
export const GET: RequestHandler = async ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'no-store' });
	return json({ puzzle: puzzleFor() });
};
