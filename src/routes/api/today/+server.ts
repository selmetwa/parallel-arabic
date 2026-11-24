import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkUserSubscription } from '$lib/helpers/subscription';
import { loadTodayPath } from '$lib/server/today-path';

/** Today's path, for the "Next" link on review, lesson and game end screens. */
export const GET: RequestHandler = async ({ locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) return json({ error: 'Unauthorized' }, { status: 401 });

	return json(await loadTodayPath(user, checkUserSubscription(user)));
};
