import type { RequestHandler } from '@sveltejs/kit';
import Stripe from 'stripe';
import { STRIPE_SECRET,  } from '$env/static/private';
import { PUBLIC_WEBHOOK_SECRET } from '$env/static/public';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { syncStripeSubscription } from '$lib/server/stripe-link';

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
		// Real 400 so Stripe reports the delivery as failed instead of accepted.
		return json({ error: `Webhook Error: ${(err as Error).message}` }, { status: 400 });
	}

  // Handle subscription deletion (when subscription period ends after cancellation)
  async function handleSubscriptionDeleted(subscriptionId: string) {
    const { data: userToUpdate, error: fetchError } = await supabase
      .from('user')
      .select('*')
      .eq('subscriber_id', subscriptionId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user for subscription deletion:', fetchError);
      return;
    }

    if (userToUpdate) {
      const { error: updateError } = await supabase
        .from('user')
        .update({
          is_subscriber: false,
          subscriber_id: null,
          subscription_end_date: null
        })
        .eq('subscriber_id', subscriptionId);

      if (updateError) {
        console.error('Error updating user after subscription deletion:', updateError);
      } else {
        console.log(`Subscription ended for user ${userToUpdate.id}, is_subscriber set to false`);
      }
    }
  }

	// Handle the event. Every handler is awaited so the function isn't torn down
	// mid-write.
	switch (event.type) {
    case 'checkout.session.completed': {
      // The only place that knows which user started the checkout, via
      // client_reference_id. Covers users who close the tab before the
      // return page loads — with a trial there is no charge to tip us off.
      const session = event.data.object;
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : (session.subscription?.id ?? null);
      await syncStripeSubscription(subscriptionId, session.client_reference_id);
      break;
    }
    case 'customer.subscription.created':
		case 'customer.subscription.updated':
      // Status-aware: grants on trialing/active, revokes on past_due/unpaid.
      await syncStripeSubscription(event.data.object.id);
			break;
    case 'customer.subscription.deleted':
      // Fires when the subscription period ends (after cancel_at_period_end was set)
      await handleSubscriptionDeleted(event.data.object.id);
      break;
		default:
	}

	return json({
		status: 200,
		body: 'Received'
	});
};
