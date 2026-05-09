import { supabase } from '$lib/supabaseClient';
import { StripeService } from '$lib/services/stripe.service';
import { isEmailWhitelisted } from './subscription';
import { env } from '$env/dynamic/private';

export const getUserHasActiveSubscription = async (userId: string | null) => {
  if (!userId) return false;

  const { data: user, error } = await supabase
    .from('user')
    .select('id, subscriber_id, email, is_subscriber')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user subscription:', error);
  }

  if (isEmailWhitelisted(user?.email)) return true;

  if (!user) return false;

  // No subscriber_id — fall back to the DB boolean (covers race between purchase and webhook)
  if (!user.subscriber_id) return user.is_subscriber ?? false;

  // Stripe subscription IDs always start with "sub_"
  if (user.subscriber_id.startsWith('sub_')) {
    try {
      const subscription = await StripeService.getSubscription(user.subscriber_id);
      if (!subscription) return false;
      const activeStatuses = ['active', 'trialing', 'past_due'];
      if (activeStatuses.includes(subscription.status)) {
        const now = Math.floor(Date.now() / 1000);
        return !!(subscription.current_period_end && subscription.current_period_end > now);
      }
      return false;
    } catch {
      return false;
    }
  }

  // RevenueCat / Apple IAP subscriber
  try {
    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
      headers: {
        Authorization: `Bearer ${env.REVENUECAT_API_KEY}`,
        'X-Platform': 'ios'
      }
    });
    if (!res.ok) return user.is_subscriber ?? false;
    const data = await res.json();
    const entitlement = data?.subscriber?.entitlements?.['Parallel Arabic Premium'];
    if (!entitlement?.expires_date) return false;
    return new Date(entitlement.expires_date) > new Date();
  } catch {
    return user.is_subscriber ?? false;
  }
};
