import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { CEFR_LEVELS, isCefrLevel } from '$lib/constants/cefr-levels';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { sessionId, user } = (await locals?.auth?.validate()) || {};

	if (!sessionId || !user) {
		return json({ error: 'You must have an account to onboard' }, { status: 401 });
	}

	const {
		target_dialect,
		learning_reason,
		proficiency_level,
		goal_level,
		show_arabic,
		show_transliteration,
		show_english
	} = await request.json();

	// Validate inputs
	const validDialects = ['egyptian-arabic', 'fusha', 'levantine', 'darija'];

	if (!target_dialect || !validDialects.includes(target_dialect)) {
		return json({ error: 'Invalid dialect' }, { status: 400 });
	}

	if (!isCefrLevel(proficiency_level)) {
		return json({ error: 'Invalid proficiency level' }, { status: 400 });
	}

	// The goal is optional — the onboarding screen can be skipped.
	if (goal_level !== undefined && goal_level !== null) {
		if (!isCefrLevel(goal_level)) {
			return json({ error: 'Invalid goal level' }, { status: 400 });
		}
		if (CEFR_LEVELS.indexOf(goal_level) < CEFR_LEVELS.indexOf(proficiency_level)) {
			return json({ error: 'Goal level cannot be below your current level' }, { status: 400 });
		}
	}

	if (!learning_reason || typeof learning_reason !== 'string') {
		return json({ error: 'Learning reason is required' }, { status: 400 });
	}

	// Build update data with optional display preferences
	const updateData: Record<string, string | boolean | number> = {
		target_dialect,
		learning_reason,
		proficiency_level,
		onboarding_completed: true,
		onboarding_completed_at: Date.now()
	};

	if (goal_level) {
		updateData.goal_level = goal_level;
	}

	// Add display preferences if provided
	if (typeof show_arabic === 'boolean') {
		updateData.show_arabic = show_arabic;
	}
	if (typeof show_transliteration === 'boolean') {
		updateData.show_transliteration = show_transliteration;
	}
	if (typeof show_english === 'boolean') {
		updateData.show_english = show_english;
	}

	try {
		const { error: updateError } = await supabase.from('user').update(updateData).eq('id', user.id);

		if (updateError) {
			console.error('Error updating onboarding data:', updateError);
			return json({ error: 'Failed to save onboarding data' }, { status: 500 });
		}

		return json({ success: true });
	} catch (e) {
		console.error('Exception updating onboarding data:', e);
		return json({ error: 'Something went wrong' }, { status: 500 });
	}
};
