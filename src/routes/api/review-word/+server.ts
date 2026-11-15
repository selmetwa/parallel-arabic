import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { cardToRow, rowToCard, schedule, type Rating } from '$lib/srs/fsrs';
import { getUserHasActiveSubscription } from '$lib/helpers/get-user-has-active-subscription';
import { getUserReviewCount } from '$lib/helpers/get-user-review-count';
import { trackActivitySimple } from '$lib/helpers/track-activity';
import { v4 as uuidv4 } from 'uuid';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { sessionId, user } = (await locals?.auth?.validate()) || {};

	if (!sessionId || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = user.id;
	const { saved_word_id, rating } = await request.json();

	// Check paywall: allow free users up to 5 reviews, then require subscription
	const [hasActiveSubscription, reviewCount] = await Promise.all([
		getUserHasActiveSubscription(userId),
		getUserReviewCount(userId)
	]);

	if (!hasActiveSubscription && reviewCount >= 5) {
		return json(
			{
				error: 'Subscription required',
				message:
					"You've reached the free limit of 5 word reviews. Please subscribe to continue using spaced repetition.",
				requiresSubscription: true,
				reviewCount
			},
			{ status: 403 }
		);
	}

	if (!saved_word_id || ![1, 2, 3, 4].includes(rating)) {
		return json(
			{ error: 'Invalid request. saved_word_id and rating (1-4) required.' },
			{ status: 400 }
		);
	}

	try {
		// Get current saved word data
		const { data: savedWord, error: fetchError } = await supabase
			.from('saved_word')
			.select('*')
			.eq('id', saved_word_id)
			.eq('user_id', userId)
			.single();

		if (fetchError || !savedWord) {
			return json({ error: 'Word not found' }, { status: 404 });
		}

		const now = new Date();
		const { card } = schedule(rowToCard(savedWord), rating as Rating, now);
		const row = cardToRow(card);

		const { error: updateError } = await supabase
			.from('saved_word')
			.update(row)
			.eq('id', saved_word_id);

		if (updateError) {
			console.error('Error updating saved word:', updateError);
			return json({ error: 'Failed to update word' }, { status: 500 });
		}

		// Create review history record
		const { error: reviewError } = await supabase.from('word_review').insert({
			id: uuidv4(),
			saved_word_id: saved_word_id,
			user_id: userId,
			rating,
			fsrs_stability: row.fsrs_stability,
			fsrs_difficulty: row.fsrs_difficulty,
			fsrs_state: row.fsrs_state,
			interval_days: row.interval_days,
			repetitions: row.repetitions,
			reviewed_at: now.getTime(),
			next_review_date: row.next_review_date,
			created_at: now.getTime(),
			dialect: savedWord.dialect
		});

		if (reviewError) {
			console.error('Error creating review record:', reviewError);
			// Don't fail the request if review history fails
		}

		// Track activity (non-blocking)
		trackActivitySimple(userId, 'review', 1).catch((err) => {
			console.error('Error tracking review activity:', err);
		});

		return json({
			success: true,
			nextReviewDate: row.next_review_date,
			intervalDays: row.interval_days,
			repetitions: row.repetitions
		});
	} catch (error) {
		console.error('Error in review-word endpoint:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
