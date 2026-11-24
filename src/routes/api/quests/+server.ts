import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkUserSubscription } from '$lib/helpers/subscription';
import { loadToday } from '$lib/server/today-path';
import { loadQuests } from '$lib/server/quests';

/** Today's main quest (the path) and side quests, for the quest tracker. */
export const GET: RequestHandler = async ({ locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) return json({ error: 'Unauthorized' }, { status: 401 });

	const today = await loadToday(user, checkUserSubscription(user));
	return json({ path: today.path, quests: await loadQuests(user, today) });
};
