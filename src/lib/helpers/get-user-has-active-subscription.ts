import { supabase } from '$lib/supabaseClient';
import { StripeService } from '$lib/services/stripe.service';

export const getUserHasActiveSubscription = async (userId: string | null) => {
  // Fast path for no user
  if (!userId) {
    return false;
  }

  // Only fetch the subscriber_id field to identify which Stripe subscription to check
  const { data: user, error } = await supabase
    .from('user')
    .select('subscriber_id')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user subscription ID:', error);
  }

  if (!user || !user.subscriber_id) {
    return false;
  }

  // Check subscription status directly from Stripe
  try {
    const subscription = await StripeService.getSubscription(user.subscriber_id);
    
    if (!subscription) {
      return false;
    }

    // Check if subscription is active
    // Active statuses: 'active', 'trialing', 'past_due' (past_due might still grant access)
    // Inactive statuses: 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'
    const activeStatuses = ['active', 'trialing', 'past_due'];
    if (activeStatuses.includes(subscription.status)) {
      // Also verify the current period hasn't ended
      const now = Math.floor(Date.now() / 1000);
      if (subscription.current_period_end && subscription.current_period_end > now) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error fetching subscription from Stripe:', error);
    // Fallback to false if Stripe check fails
    return false;
  }
};