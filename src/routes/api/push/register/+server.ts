import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

/** The iOS app calls this with its APNs device token once notifications are allowed. */
export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) return json({ error: 'Unauthorized' }, { status: 401 });

	const { token } = await request.json();
	if (typeof token !== 'string' || !/^[0-9a-f]{32,200}$/i.test(token)) {
		return json({ error: 'Invalid token' }, { status: 400 });
	}

	const now = Date.now();
	// A token already on file moves to whoever is signed in on the device now.
	const { error } = await supabase
		.from('push_device')
		.upsert({ token, user_id: user.id, created_at: now, updated_at: now }, { onConflict: 'token' });

	if (error) {
		console.error('Error saving push token:', error);
		return json({ error: 'Failed to save token' }, { status: 500 });
	}

	return json({ success: true });
};
