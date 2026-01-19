import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import { StripeService } from '$lib/services/stripe.service';

export const POST: RequestHandler = async ({ locals }) => {
  const { session, user } = await locals.safeGetSession();

  if (!session || !user) {
    return json({ error: 'You must be logged in to cancel your subscription' }, { status: 401 });
  }

  // Get the user's subscriber_id
  const { data: userData, error: fetchError } = await supabase
    .from('user')
    .select('subscriber_id')
    .eq('id', user.id)
    .single();

  if (fetchError) {
    console.error('Error fetching user:', fetchError);
    return json({ error: 'Failed to fetch user data' }, { status: 500 });
  }

  if (!userData?.subscriber_id) {
    return json({ error: 'No active subscription found' }, { status: 400 });
  }

  try {
    // Cancel the subscription at period end
    const subscription = await StripeService.cancel(userData.subscriber_id);

    if (!subscription) {
      return json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    // Return success with the cancellation date
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

