import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { StripeService } from '$lib/services/stripe.service';
import { ownStripeSubscription } from '$lib/server/own-stripe-subscription';
import { syncStripeSubscription } from '$lib/server/stripe-link';

/** Undo a pending cancellation, or end a pause early. */
export const POST: RequestHandler = async ({ locals }) => {
	const owned = await ownStripeSubscription(locals);
	if ('denied' in owned) return owned.denied;

	const subscription = await StripeService.resume(owned.subscriptionId);
	if (!subscription) return json({ error: 'Failed to resume subscription' }, { status: 500 });
	await syncStripeSubscription(subscription.id);

	return json({ success: true, status: subscription.status });
};
