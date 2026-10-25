/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stripe } from 'stripe';
import { PUBLIC_DOMAIN, PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';
import { STRIPE_SECRET } from '$env/static/private';
import { PAID_THROUGH_KEY, pausedPaidThrough } from '$lib/subscription/cancel-flow';

let stripe: Stripe | undefined;

/**
 * Stripe cancel subscription
 *
 * Update the current subscription to stop recurring payements at the end of the
 * current pay period.
 *
 */
const cancel = async (
	subscriptionId: string,
	details?: Stripe.SubscriptionUpdateParams.CancellationDetails
): Promise<Stripe.Subscription | undefined> => {
	if (stripe) {
		try {
			const subscription = await stripe.subscriptions.update(subscriptionId, {
				cancel_at_period_end: true,
				...(details && { cancellation_details: details })
			});
			return subscription;
		} catch (error: any) {
			console.error(error);
		}
	}
};

/**
 * Stripe pause
 *
 * Stops charging until `resumesAt`; the invoices in between are voided.
 * `paidThrough` (the end of the period already paid for) goes on the metadata,
 * because Stripe keeps a paused subscription `active` and access should still
 * stop there (see stripeAccessEnd).
 */
const pause = async (
	subscriptionId: string,
	resumesAt: number,
	paidThrough: number
): Promise<Stripe.Subscription | undefined> => {
	if (stripe) {
		try {
			return await stripe.subscriptions.update(subscriptionId, {
				pause_collection: { behavior: 'void', resumes_at: resumesAt },
				metadata: { [PAID_THROUGH_KEY]: String(paidThrough) }
			});
		} catch (error: any) {
			console.error(error);
		}
	}
};

/**
 * Stripe resume
 *
 * Undoes a pending cancellation or a pause. Ending a pause after the paid
 * period has run out restarts the billing cycle today, so they pay for the
 * access they get back.
 */
const resume = async (subscriptionId: string): Promise<Stripe.Subscription | undefined> => {
	if (stripe) {
		try {
			const current = await stripe.subscriptions.retrieve(subscriptionId);
			const paidThrough = pausedPaidThrough(current);
			const lapsed = !!paidThrough && paidThrough <= Math.floor(Date.now() / 1000);
			return await stripe.subscriptions.update(subscriptionId, {
				cancel_at_period_end: false,
				// A paused subscription is cancelled with a date (cancelPaused), not at period end.
				...(current.cancel_at && !current.cancel_at_period_end && { cancel_at: '' }),
				cancellation_details: { feedback: '', comment: '' },
				...(current.pause_collection && {
					pause_collection: '',
					metadata: { [PAID_THROUGH_KEY]: '' }
				}),
				...(lapsed && { billing_cycle_anchor: 'now', proration_behavior: 'none' })
			});
		} catch (error: any) {
			console.error(error);
		}
	}
};

/**
 * End a paused subscription. Paid time still left runs out first; otherwise it
 * ends now, since nothing is being paid for.
 */
const cancelPaused = async (
	subscriptionId: string,
	details: Stripe.SubscriptionUpdateParams.CancellationDetails
): Promise<Stripe.Subscription | undefined> => {
	if (stripe) {
		try {
			const current = await stripe.subscriptions.retrieve(subscriptionId);
			const paidThrough = pausedPaidThrough(current);
			if (paidThrough && paidThrough > Math.floor(Date.now() / 1000)) {
				return await stripe.subscriptions.update(subscriptionId, {
					cancel_at: paidThrough,
					cancellation_details: details
				});
			}
			return await stripe.subscriptions.cancel(subscriptionId, { cancellation_details: details });
		} catch (error: any) {
			console.error(error);
		}
	}
};

/**
 * Stripe session status
 *
 * We use this to check the *payment_status* field to see if it was 'paid' or not.
 *
 */
const getSession = async (sessionId: string): Promise<Stripe.Checkout.Session | undefined> => {
	if (stripe) {
		try {
			return await stripe.checkout.sessions.retrieve(sessionId);
		} catch (error: any) {
			console.error(error);
		}
	}
};

/**
 * Stripe subscription status
 *
 * We use this to check the subscription status and change the home page accordingly.
 *
 */
const getSubscription = async (
	subscriptionId: string
): Promise<Stripe.Subscription | undefined> => {
	if (stripe) {
		try {
			return await stripe.subscriptions.retrieve(subscriptionId);
		} catch (error: any) {
			console.error(error);
		}
	}
};

/**
 * Stripe embedded subscribe
 *
 * This is returns an embedded subscription mode for a item of *priceId*. This could, alternatively
 * redirect user's the Stripe site to pay or to a custom form.
 *
 */
export const TRIAL_PERIOD_DAYS = 7;

type SubscribeOptions = {
	/** public.user.id — stamped on the session so the webhook can find the user */
	userId: string;
	email?: string | null;
	/** Card is always collected; this only decides whether day 1 is charged. */
	withTrial: boolean;
};

const subscribe = async (
	priceId: string,
	options: SubscribeOptions
): Promise<Stripe.Checkout.Session | undefined> => {
  console.log('🔄 [stripe-service] Creating checkout session for priceId:', priceId, 'trial:', options.withTrial);
  console.log('🔄 [stripe-service] Stripe instance initialized:', !!stripe);
	if (stripe) {
		try {
			console.log('🔄 [stripe-service] Calling stripe.checkout.sessions.create...');
			const session = await stripe.checkout.sessions.create({
				ui_mode: 'embedded',
				line_items: [
					{
						price: priceId,
						quantity: 1
					}
				],
				mode: 'subscription',
				client_reference_id: options.userId,
				...(options.email ? { customer_email: options.email } : {}),
				// Force card collection even when nothing is due today.
				payment_method_collection: 'always',
				subscription_data: {
					metadata: { user_id: options.userId },
					...(options.withTrial && {
						trial_period_days: TRIAL_PERIOD_DAYS,
						trial_settings: { end_behavior: { missing_payment_method: 'cancel' as const } }
					})
				},
				// return_url: `http://localhost:5173/pricing/subscribed?session_id={CHECKOUT_SESSION_ID}`,
				return_url: `${PUBLIC_DOMAIN}/pricing/subscribed?session_id={CHECKOUT_SESSION_ID}`
			});
			console.log('✅ [stripe-service] Checkout session created successfully:', !!session.client_secret);
			return session;
		} catch (error: any) {
			console.error('❌ [stripe-service] Error creating checkout session:', error);
		}
	} else {
		console.error('❌ [stripe-service] Stripe not initialized!');
	}
};

/**
 * Intialize
 *
 * We run this at start up in order to check if the necessary environemt
 * variables exist. It doesn't guarantee they are valid, though.
 *
 */
const initializeStripe = async (): Promise<boolean> => {
	if (STRIPE_SECRET && PUBLIC_STRIPE_PUBLISHABLE_KEY) {
		stripe = new Stripe(STRIPE_SECRET);
		return true;
	}
	return false;
};

(async () => {
	const result = await initializeStripe();
	if (!result) {
		console.log('[Stripe service] - Failed to initialize');
	} else {
		console.log('[Stripe service] - Started');
	}
})();

export const StripeService = {
	cancel,
	cancelPaused,
	pause,
	resume,
	getSession,
	getSubscription,
	subscribe
};