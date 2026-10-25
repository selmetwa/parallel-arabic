import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { isAnonEvent, isRecordedEvent } from '$lib/analytics';
import { consumeRateLimit } from '$lib/server/redis';

/** Signed-out events one IP can record per hour, so the table can't be flooded. */
const ANON_EVENTS_PER_HOUR = 120;

/**
 * Records one onboarding funnel event (see docs/onboarding-v3-plan.md).
 * Fire-and-forget from the client: a failed insert never surfaces to the user.
 * Signed-out visitors can record game events only; those go to `anon_event`.
 */
export const POST: RequestHandler = async ({
	request,
	getClientAddress,
	locals: { safeGetSession }
}) => {
	const { session, user } = await safeGetSession();
	const signedIn = !!session && !!user;

	const body = await request.json().catch(() => null);
	const event = body?.event;
	if (typeof event !== 'string' || !isRecordedEvent(event)) {
		return json({ error: 'Invalid event' }, { status: 400 });
	}
	if (!signedIn && !isAnonEvent(event)) return json({ error: 'Unauthorized' }, { status: 401 });

	const props = body?.props && typeof body.props === 'object' ? body.props : {};
	if (JSON.stringify(props).length > 2000) {
		return json({ error: 'Props too large' }, { status: 400 });
	}

	if (signedIn) {
		const { error } = await supabase
			.from('onboarding_event')
			.insert({ user_id: user.id, event, props });
		if (error) console.error('Error recording onboarding event:', error);
		return json({ success: true });
	}

	const anonId = body?.anonId;
	if (typeof anonId !== 'string' || !anonId || anonId.length > 64) {
		return json({ error: 'Invalid anonId' }, { status: 400 });
	}
	const { allowed } = await consumeRateLimit(
		`events:anon:${getClientAddress()}`,
		ANON_EVENTS_PER_HOUR,
		60 * 60
	);
	if (!allowed) return json({ error: 'Too many events' }, { status: 429 });

	const { error } = await supabase.from('anon_event').insert({ anon_id: anonId, event, props });
	if (error) console.error('Error recording anon event:', error);

	return json({ success: true });
};
