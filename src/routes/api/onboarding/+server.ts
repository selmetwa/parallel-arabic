import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { CEFR_LEVELS, isCefrLevel } from '$lib/constants/cefr-levels';
import { checkUserSubscription } from '$lib/helpers/subscription';
import type { PaywallVariant } from '$lib/server/paywall-experiment';
import { isDialect } from '$lib/constants/dialects';
import type { DailyGoal } from '$lib/constants/daily-goal';
import {
	isDailyMinutes,
	isReminderWindow,
	isStreakGoal,
	buildGoal,
	parseChallenges
} from '$lib/constants/onboarding-questions';

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
		show_english,
		platform,
		learning_challenges,
		daily_minutes,
		reminder_window,
		streak_goal
	} = await request.json();

	// Validate inputs
	if (!isDialect(target_dialect)) {
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
	const updateData: Record<string, string | boolean | number | DailyGoal> = {
		target_dialect,
		learning_reason,
		proficiency_level,
		onboarding_completed: true,
		onboarding_completed_at: Date.now()
	};

	if (goal_level) {
		updateData.goal_level = goal_level;
	}

	// The time they said they have becomes their daily goal (the column already exists).
	if (isDailyMinutes(daily_minutes)) {
		updateData.daily_goal = buildGoal(daily_minutes, parseChallenges(learning_challenges) ?? [], target_dialect);
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

	// Paywall: every new signup gets the hard paywall, 'hard' on the web and
	// 'hard_ios' in the app (see paywall-experiment.ts). Only the client can
	// tell which platform it is on.
	const dbUser = locals.user;
	let variant: PaywallVariant | null = dbUser?.paywall_variant ?? null;
	const isNewUnpaidUser =
		!!dbUser &&
		!dbUser.paywall_variant &&
		!dbUser.onboarding_completed &&
		!checkUserSubscription(dbUser);
	const newVariant: PaywallVariant | null = !isNewUnpaidUser
		? null
		: platform === 'native'
			? 'hard_ios'
			: platform === 'web'
				? 'hard'
				: null;
	if (newVariant) {
		variant = newVariant;
		updateData.paywall_variant = variant;
		updateData.paywall_variant_assigned_at = Date.now();
	}

	try {
		const { error: updateError } = await supabase.from('user').update(updateData).eq('id', user.id);

		if (updateError) {
			console.error('Error updating onboarding data:', updateError);
			return json({ error: 'Failed to save onboarding data' }, { status: 500 });
		}

		// The habit questions are optional and saved apart, so a missing column
		// (docs/sql/2026-10-25-onboarding-questions.sql not run yet) can't block onboarding.
		const habits: Record<string, unknown> = {};
		const challenges = parseChallenges(learning_challenges);
		if (challenges) habits.learning_challenges = challenges;
		if (isDailyMinutes(daily_minutes)) habits.daily_minutes = daily_minutes;
		if (isReminderWindow(reminder_window)) habits.reminder_window = reminder_window;
		if (isStreakGoal(streak_goal)) habits.streak_goal = streak_goal;
		if (Object.keys(habits).length) {
			const { error: habitsError } = await supabase.from('user').update(habits).eq('id', user.id);
			if (habitsError) console.error('Error saving onboarding habits:', habitsError);
		}

		return json({ success: true, variant });
	} catch (e) {
		console.error('Exception updating onboarding data:', e);
		return json({ error: 'Something went wrong' }, { status: 500 });
	}
};
