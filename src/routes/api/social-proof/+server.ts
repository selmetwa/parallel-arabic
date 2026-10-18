import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSocialProof } from '$lib/server/social-proof';

/** Learner and words-saved counts for the trial offer and /pricing. Public and cacheable. */
export const GET: RequestHandler = async ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'public, max-age=600, s-maxage=3600' });
	return json(await getSocialProof());
};
