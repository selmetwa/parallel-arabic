import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { StripeService } from '$lib/services/stripe.service';
import { ownStripeSubscription } from '$lib/server/own-stripe-subscription';
import { syncStripeSubscription } from '$lib/server/stripe-link';
import { canPause, isPauseMonths, pauseResumesAt } from '$lib/subscription/cancel-flow';

/** Pause billing for 1–3 months instead of cancelling. Monthly, paying plans only. */
export const POST: RequestHandler = async ({ locals, request }) => {
	const owned = await ownStripeSubscription(locals);
	if ('denied' in owned) return owned.denied;

	const body = await request.json().catch(() => ({}));
	const months = body?.months;
	if (!isPauseMonths(months)) return json({ error: 'Pick 1, 2 or 3 months' }, { status: 400 });

	const current = await StripeService.getSubscription(owned.subscriptionId);
	const paidThrough = current?.current_period_end ?? null;
	if (
		!current ||
		!paidThrough ||
		!canPause({
			status: current.status,
			interval: current.items.data[0]?.price?.recurring?.interval ?? null,
			cancelAtPeriodEnd: current.cancel_at_period_end,
			pausedUntil: current.pause_collection?.resumes_at ?? null
		})
	) {
		return json({ error: 'This subscription can’t be paused' }, { status: 400 });
	}

	const resumesAt = pauseResumesAt(paidThrough, months);
	const subscription = await StripeService.pause(owned.subscriptionId, resumesAt, paidThrough);
	if (!subscription) return json({ error: 'Failed to pause subscription' }, { status: 500 });
	await syncStripeSubscription(subscription.id);

	return json({ success: true, paidThrough, resumesAt });
};
