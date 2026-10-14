import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { isRecordedEvent } from '$lib/analytics';

/**
 * Records one onboarding funnel event (see docs/onboarding-v3-plan.md).
 * Fire-and-forget from the client: a failed insert never surfaces to the user.
 */
export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json().catch(() => null);
	const event = body?.event;
	if (typeof event !== 'string' || !isRecordedEvent(event)) {
		return json({ error: 'Invalid event' }, { status: 400 });
	}

	const props = body?.props && typeof body.props === 'object' ? body.props : {};
	if (JSON.stringify(props).length > 2000) {
		return json({ error: 'Props too large' }, { status: 400 });
	}

	const { error } = await supabase.from('onboarding_event').insert({ user_id: user.id, event, props });
	if (error) console.error('Error recording onboarding event:', error);

	return json({ success: true });
};
