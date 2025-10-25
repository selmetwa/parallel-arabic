// Modules and libraries
import { StripeService } from '$lib/services/stripe.service';
import { redirect } from '@sveltejs/kit';

// Types and variables
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

/**
 * Subscribed load
 *
 * The *session_id* is passed from the url assigned upon subscribing. Here we
 * check if the stripeSessionId is null or not and then route accordingly. After that
 * we check the status of the session, meaning has it been paid or not, or then
 * route based on that.
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
	if (stripeSession?.payment_status != 'paid') {
    console.log('❌ Stripe session payment status is not paid');
		redirect(302, '/pricing/error');
	}

	/**
	 * If everything worked we need to save the payment information for that
	 * particular user, though if we can't find the user we should roll back the
	 * charge. This rollback has not been implemented.
	 *
	 */
	const { data: user, error: userError } = await supabase
		.from('user')
		.select('*')
		.eq('id', userId)
		.single();

	if (userError && userError.code !== 'PGRST116') {
		console.error('❌ Error fetching user:', userError);
		redirect(302, '/pricing/error');
	}

	const subscriberId = String(stripeSession.subscription ?? '');
	
	// Get the actual subscription details from Stripe instead of hardcoding 30 days
	let subscriptionEndDate: number;
	
	if (subscriberId) {
		try {
			const subscription = await StripeService.getSubscription(subscriberId);
			if (subscription && subscription.current_period_end) {
				// Stripe already provides the Unix timestamp
				subscriptionEndDate = subscription.current_period_end;
			} else {
				// Fallback to 30 days if we can't get subscription details
				const now = new Date();
				const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
				subscriptionEndDate = Math.floor(thirtyDaysFromNow.getTime() / 1000);
			}
		} catch (error) {
			console.error('Error fetching subscription from Stripe:', error);
			// Fallback to 30 days
			const now = new Date();
			const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
			subscriptionEndDate = Math.floor(thirtyDaysFromNow.getTime() / 1000);
		}
	} else {
		// Fallback if no subscription ID
		const now = new Date();
		const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
		subscriptionEndDate = Math.floor(thirtyDaysFromNow.getTime() / 1000);
	}

	if (user) {
		console.log('Updating user as subscriber');

		const { data: updatedUser, error: updateError } = await supabase
			.from('user')
			.update({
				is_subscriber: true,
				subscriber_id: subscriberId,
				subscription_end_date: subscriptionEndDate  // Keep as Unix timestamp (bigint)
			})
			.eq('id', userId)
			.select();

		if (updateError) {
			console.error('❌ Error updating user subscription:', updateError);
			redirect(302, '/pricing/error');
		}

    console.log('Result:', updatedUser);

		return {
			session: authSession,
			isSubscribed: true,
			subscriptionId: stripeSession.subscription as string,
			subscriptionEndDate: subscriptionEndDate
		};
	}

	console.log('❌ Redirecting to error page');
	redirect(302, '/pricing/error');
};
