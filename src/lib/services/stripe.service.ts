/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stripe } from 'stripe';
import { PUBLIC_DOMAIN, PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';
import { STRIPE_SECRET } from '$env/static/private';

let stripe: Stripe | undefined;

/**
 * Stripe cancel subscription
 *
 * Update the current subscription to stop recurring payements at the end of the
 * current pay period.
 *
 */
const cancel = async (subscriptionId: string): Promise<Stripe.Subscription | undefined> => {
	if (stripe) {
		try {
			const subscription = await stripe.subscriptions.update(subscriptionId, {
				cancel_at_period_end: true
			});
			return subscription;
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
const subscribe = async (priceId: string): Promise<Stripe.Checkout.Session | undefined> => {
	if (stripe) {
		try {
			return await stripe.checkout.sessions.create({
				ui_mode: 'embedded',
				line_items: [
					{
						price: priceId,
						quantity: 1
					}
				],
				mode: 'subscription',
				return_url: `${PUBLIC_DOMAIN}/pricing/subscribed?session_id={CHECKOUT_SESSION_ID}`
			});
		} catch (error: any) {
			console.error(error);
		}
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
	getSession,
	getSubscription,
	subscribe
};