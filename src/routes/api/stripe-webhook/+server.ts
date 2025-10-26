import type { RequestHandler } from '@sveltejs/kit';
import Stripe from 'stripe';
import { STRIPE_SECRET,  } from '$env/static/private';
import { PUBLIC_WEBHOOK_SECRET } from '$env/static/public';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

// Initialize Stripe with your secret key
const stripe = new Stripe(STRIPE_SECRET, {
	apiVersion: '2024-06-20'
});

export const GET = async () => {
  return json({
    message: "Hey, you're not supposed to be here!"
  })
}

export const POST: RequestHandler = async ({ request }) => {
	const signature = request.headers.get('stripe-signature') || '';
	const payload = await request.text(); // Use `text()` to get the raw body

	let event;

	try {
		event = stripe.webhooks.constructEvent(payload, signature, PUBLIC_WEBHOOK_SECRET);
	} catch (err) {
		return json({
			status: 400,
			body: `Webhook Error: ${(err as Error).message}`
		});
	}

  async function updateSubscription(subscriptionId: string) {
    const { data: userToUpdate, error: fetchError } = await supabase
      .from('user')
      .select('*')
      .eq('subscriber_id', subscriptionId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user for subscription update:', fetchError);
      return;
    }

    if (userToUpdate) {
      // Get the actual subscription from Stripe instead of hardcoding 30 days
      let subscriptionEndDate: number;
      
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
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

      const { data: result, error: updateError } = await supabase
        .from('user')
        .update({
          is_subscriber: true,
          subscriber_id: subscriptionId,
          subscription_end_date: new Date(subscriptionEndDate * 1000).toISOString()
        })
        .eq('subscriber_id', subscriptionId)
        .select();

      if (updateError) {
        console.error('Error updating user subscription:', updateError);
      }
    }
  }

	// Handle the event
	switch (event.type) {
		case 'customer.subscription.updated':
      updateSubscription(event.data.object.id)
			break;
		// Add other cases for different event types as needed
		default:
	}

	return json({
		status: 200,
		body: 'Received'
	});
};
