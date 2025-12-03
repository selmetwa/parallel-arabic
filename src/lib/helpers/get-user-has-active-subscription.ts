import { supabase } from '$lib/supabaseClient';
import { StripeService } from '$lib/services/stripe.service';

// Whitelist of emails that have access to all lessons regardless of subscription
const WHITELISTED_EMAILS = [
  'selmetwa@gmail.com',
  'sherifliketheclash@gmail.com'
];

export const getUserHasActiveSubscription = async (userId: string | null) => {
  // Fast path for no user
  if (!userId) {
    return false;
  }

  // Fetch user email and subscriber_id to check whitelist and subscription
  const { data: user, error } = await supabase
    .from('user')
    .select('subscriber_id, email')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user subscription ID:', error);
  }

  // Check if user is whitelisted
  if (user?.email && WHITELISTED_EMAILS.includes(user.email.toLowerCase())) {
    return true;
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