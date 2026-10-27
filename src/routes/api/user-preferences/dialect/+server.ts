import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isSelectableDialect } from '$lib/constants/dialects';

// Switches the dialect the learner is studying. Every page defaults to it.
export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, safeGetSession } = locals;
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		return json({ error: 'You must be logged in to change your dialect' }, { status: 401 });
	}

	const { dialect } = await request.json();
	if (!isSelectableDialect(dialect)) {
		return json({ error: 'Invalid dialect' }, { status: 400 });
	}

	const { error } = await supabase.from('user').update({ target_dialect: dialect }).eq('id', user.id);
	if (error) {
		console.error('Error updating target_dialect:', error);
		return json({ error: 'Failed to update dialect' }, { status: 500 });
	}

	return json({ success: true, dialect });
};
