import { supabase } from '$lib/supabaseClient';
import { StripeService } from '$lib/services/stripe.service';
import { isEmailWhitelisted } from './subscription';
import { env } from '$env/dynamic/private';

const ENTITLEMENT_ID = 'Parallel Arabic Premium';

export const getUserHasActiveSubscription = async (userId: string | null) => {
  if (!userId) return false;
  return true
  const { data: user, error } = await supabase
    .from('user')
    .select('id, subscriber_id, email, is_subscriber, subscription_end_date')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user subscription:', error);
  }

  if (isEmailWhitelisted(user?.email)) return true;

  if (!user) return false;

  // DB-first source of truth. verify-apple-purchase and Stripe webhooks write
  // is_subscriber + subscription_end_date as the user-facing state of record.
  // The provider REST call below is treated as a sanity check that can flip
  // false → true (if the DB hasn't caught up), but never true → false on a
  // single transient lookup — that's the job of webhooks / scheduled jobs,
  // not a single-shot read.
  const endDateMs = user.subscription_end_date ? Number(user.subscription_end_date) * 1000 : null;
  const dbSaysActive = !!(
    user.is_subscriber &&
    (!endDateMs || endDateMs > Date.now())
  );

  if (dbSaysActive) return true;

  // DB doesn't currently show an active sub. Try the provider as a last chance
  // to confirm one we missed (e.g. webhook never fired, manual restore).

  if (!user.subscriber_id) return false;

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
        Authorization: `Bearer ${env.REVENUECAT_API_KEY}`
      }
    });
    if (!res.ok) return false;
    const data = await res.json();
    const entitlement = data?.subscriber?.entitlements?.[ENTITLEMENT_ID];
    if (!entitlement?.expires_date) return false;
    return new Date(entitlement.expires_date) > new Date();
  } catch {
    return false;
  }
};
