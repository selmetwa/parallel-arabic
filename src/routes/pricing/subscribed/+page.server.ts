// Modules and libraries
import { StripeService } from '$lib/services/stripe.service';
import { syncStripeSubscription } from '$lib/server/stripe-link';
import { redirect } from '@sveltejs/kit';

// Types and variables
import type { PageServerLoad } from './$types';

/**
 * Subscribed load
 *
 * The *session_id* is passed from the url assigned upon subscribing. Here we
 * check if the stripeSessionId is null or not and then route accordingly. After that
 * we check the status of the session, meaning has it been paid or not, or then
 * route based on that.
 *
 * A trial checkout completes with payment_status 'no_payment_required' (nothing
 * is due today), so that counts as success just like 'paid'.
 *
 */
export const load: PageServerLoad = async ({ url, locals }) => {
	const authSession = await locals.auth.validate();
	const userId = authSession && authSession.user.id;

	const stripeSessionId = url.searchParams.get('session_id');
	if (stripeSessionId == null) {
		console.log('❌ No stripe session ID found');
		redirect(302, '/pricing/error');
	}

	const stripeSession = await StripeService.getSession(stripeSessionId);
	const completed =
		stripeSession?.payment_status === 'paid' ||
		stripeSession?.payment_status === 'no_payment_required';

	if (!completed) {
		console.log('❌ Stripe session was not completed:', stripeSession?.payment_status);
		redirect(302, '/pricing/error');
	}

	/**
	 * Write the subscription onto the user row. The webhook does the same thing
	 * from checkout.session.completed, so closing the tab before landing here is
	 * no longer a problem — whichever arrives first wins and the other is a no-op.
	 */
	const subscriptionId =
		typeof stripeSession.subscription === 'string'
			? stripeSession.subscription
			: (stripeSession.subscription?.id ?? null);

	const result = await syncStripeSubscription(subscriptionId, userId);

	if (!result.updated) {
		console.log('❌ Could not link subscription to a user, redirecting to error page');
		redirect(302, '/pricing/error');
	}

	return {
		session: authSession,
		isSubscribed: true,
		isTrial: result.isTrial,
		subscriptionId: subscriptionId,
		subscriptionEndDate: result.endDate
	};
};
