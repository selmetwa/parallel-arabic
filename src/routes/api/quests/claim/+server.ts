import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkUserSubscription } from '$lib/helpers/subscription';
import { claimQuests } from '$lib/server/quests';

/** Pays today's quest reward once all three are done. The server checks; the client only asks. */
export const POST: RequestHandler = async ({ locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) return json({ ok: false }, { status: 401 });

	const result = await claimQuests(user, checkUserSubscription(user));
	return json(result, { status: result.ok ? 200 : 409 });
};
