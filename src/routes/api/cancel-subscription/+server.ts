import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { StripeService } from '$lib/services/stripe.service';
import { ownStripeSubscription } from '$lib/server/own-stripe-subscription';
import { DETAIL_MAX, cancelReason } from '$lib/subscription/cancel-flow';
import { syncStripeSubscription } from '$lib/server/stripe-link';

/**
 * Cancel at the end of the paid period, with the reason from the cancel flow
 * recorded on the subscription. A paused subscription ends when its paid time
 * runs out, or now if it already has.
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	const owned = await ownStripeSubscription(locals);
	if ('denied' in owned) return owned.denied;

	const body = await request.json().catch(() => ({}));
	const reason = cancelReason(body?.reason);
	const detail = typeof body?.detail === 'string' ? body.detail.trim().slice(0, DETAIL_MAX) : '';
	const details = {
		feedback: reason?.feedback ?? ('other' as const),
		comment: [reason?.label, detail].filter(Boolean).join(': ')
	};

	try {
		const current = await StripeService.getSubscription(owned.subscriptionId);
		const subscription = current?.pause_collection
			? await StripeService.cancelPaused(owned.subscriptionId, details)
			: await StripeService.cancel(owned.subscriptionId, details);

		if (!subscription) {
			return json({ error: 'Failed to cancel subscription' }, { status: 500 });
		}
		// An immediate end (paused with no paid time left) also arrives by webhook;
		// syncing here means the page reloads with the right state.
		await syncStripeSubscription(subscription.id);

		return json({
			success: true,
			message: 'Subscription will be cancelled at the end of your billing period',
			cancelAt: subscription.cancel_at,
			currentPeriodEnd: subscription.current_period_end
		});
	} catch (error) {
		console.error('Error cancelling subscription:', error);
		return json({ error: 'Failed to cancel subscription' }, { status: 500 });
	}
};
