import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Rating } from '$lib/srs/fsrs';
import { syncReviews } from '$lib/server/srs-sync';
import { getUserHasActiveSubscription } from '$lib/helpers/get-user-has-active-subscription';
import { getUserReviewCount } from '$lib/helpers/get-user-review-count';
import { v4 as uuidv4 } from 'uuid';

/** One rating, applied now. Kept for older clients; the review page queues ratings through /api/review-words/sync. */
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
		const result = await syncReviews(
			userId,
			[{ id: uuidv4(), saved_word_id, rating: rating as Rating, reviewed_at: Date.now() }],
			{ awardXpForCorrect: false }
		);
		const row = result.words[saved_word_id];
		if (!row) return json({ error: 'Word not found' }, { status: 404 });

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
