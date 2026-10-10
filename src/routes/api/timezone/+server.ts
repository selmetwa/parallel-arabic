import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { safeTimeZone } from '$lib/helpers/streak';

/** Store the learner's time zone, so streak days and reminders follow their clock. */
export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = (locals as { user?: { id?: string } | null }).user?.id;
	if (!userId) return json({ ok: false }, { status: 401 });

	const { timezone } = await request.json().catch(() => ({}));
	if (typeof timezone !== 'string' || safeTimeZone(timezone) !== timezone) {
		return json({ ok: false, error: 'Unknown time zone' }, { status: 400 });
	}

	const { error } = await supabase.from('user').update({ timezone }).eq('id', userId);
	if (error) {
		console.error('Could not save time zone:', error);
		return json({ ok: false }, { status: 500 });
	}
	return json({ ok: true });
};
