import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logActivity } from '$lib/server/activity';

/** A game round started, counted toward the daily goal. Spoken sentences are logged by /api/speech-to-text. */
export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json().catch(() => null);
	if (body?.kind !== 'game') return json({ error: 'Invalid kind' }, { status: 400 });

	await logActivity(user.id, 'game');
	return json({ success: true });
};
