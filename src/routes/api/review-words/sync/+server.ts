import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserHasActiveSubscription } from '$lib/helpers/get-user-has-active-subscription';
import { getUserReviewCount } from '$lib/helpers/get-user-review-count';
import { parseReviews, syncReviews } from '$lib/server/srs-sync';

// hooks.server.ts sets locals.auth, but App.Locals doesn't declare it.
type AuthLocals = {
	auth?: { validate(): Promise<{ sessionId?: string | null; user?: { id: string } | null } | null> };
};

const FREE_REVIEWS = 5;
const MAX_BATCH = 50;

/**
 * Applies ratings queued on the device (online or offline), in the order they
 * were made: `{ reviews: [{ id, saved_word_id, rating, reviewed_at }] }`.
 * Safe to retry: ids already applied are acknowledged without counting twice.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const { sessionId, user } = (await (locals as unknown as AuthLocals).auth?.validate()) ?? {};
	if (!sessionId || !user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json().catch(() => ({}));
	let reviews = parseReviews(body.reviews).sort((a, b) => a.reviewed_at - b.reviewed_at);
	if (reviews.length > MAX_BATCH) return json({ error: `Send at most ${MAX_BATCH} reviews at a time` }, { status: 400 });

	const [hasActiveSubscription, reviewCount] = await Promise.all([
		getUserHasActiveSubscription(user.id),
		getUserReviewCount(user.id)
	]);

	// Free accounts get 5 reviews in total; anything past that is dropped and the paywall shows.
	let requiresSubscription = false;
	if (!hasActiveSubscription) {
		const left = Math.max(0, FREE_REVIEWS - reviewCount);
		requiresSubscription = reviews.length > left;
		reviews = reviews.slice(0, left);
	}

	try {
		const result = await syncReviews(user.id, reviews);
		return json({
			...result,
			requiresSubscription,
			reviewCount: reviewCount + result.applied
		});
	} catch (e) {
		console.error('[review-sync] failed:', e);
		return json({ error: 'Could not save your reviews. They will be retried.' }, { status: 500 });
	}
};
