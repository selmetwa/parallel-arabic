import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { isSelectableDialect } from '$lib/constants/dialects';
import { NUR_ENABLED } from '$lib/constants/feature-flags';
import { isVarietyOf } from '$lib/constants/varieties';

// Switches the dialect the learner is studying. Every page defaults to it.
export const POST: RequestHandler = async ({ request, locals }) => {
	const { safeGetSession } = locals;
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		return json({ error: 'You must be logged in to change your dialect' }, { status: 401 });
	}

	const { dialect, variety } = await request.json();
	if (!isSelectableDialect(dialect)) {
		return json({ error: 'Invalid dialect' }, { status: 400 });
	}

	const update: { target_dialect: string; target_variety?: string | null } = { target_dialect: dialect };
	// A variety from another dialect (or none) clears it back to the default.
	if (NUR_ENABLED) update.target_variety = isVarietyOf(variety, dialect) ? variety : null;

	const { error } = await supabase.from('user').update(update).eq('id', user.id);
	if (error) {
		console.error('Error updating target_dialect:', error);
		return json({ error: 'Failed to update dialect' }, { status: 500 });
	}

	return json({ success: true, dialect });
};
