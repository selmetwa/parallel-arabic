import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { parseGoal } from '$lib/constants/daily-goal';

/** Saves the learner's daily goal, or clears it when `goal` is null. */
export const POST: RequestHandler = async ({ request, locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json().catch(() => null);
	const goal = body?.goal === null ? null : parseGoal(body?.goal);
	if (body?.goal !== null && !goal) return json({ error: 'Invalid goal' }, { status: 400 });

	const { error } = await supabase.from('user').update({ daily_goal: goal }).eq('id', user.id);
	if (error) {
		console.error('Error saving daily goal:', error);
		return json({ error: 'Failed to save goal' }, { status: 500 });
	}

	return json({ success: true });
};
