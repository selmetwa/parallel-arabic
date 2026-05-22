import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    if (!env.REVENUECAT_API_KEY) {
      console.error('[verify-apple-purchase] REVENUECAT_API_KEY env var is not set');
      return json(
        { error: 'Server configuration error: subscription verification key is missing.' },
        { status: 500 }
      );
    }

    const key = env.REVENUECAT_API_KEY;
    console.log('[verify-apple-purchase] key sanity', {
      prefix: key.slice(0, 4),
      length: key.length,
      hasWhitespace: key !== key.trim()
    });

    let res: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
        headers: {
          Authorization: `Bearer ${env.REVENUECAT_API_KEY}`
        }
      });
      if (res.ok) break;
      if (res.status === 403 || res.status === 401) break;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }

    if (!res || !res.ok) {
      const status = res?.status ?? 0;
      const bodyText = res ? await res.text().catch(() => '') : '';
      console.error('[verify-apple-purchase] RevenueCat lookup failed', { status, body: bodyText, userId });
      const message =
        status === 401 || status === 403
          ? 'Subscription verification credentials are invalid. Contact support.'
          : 'Could not reach the subscription provider. Please try again in a moment.';
      return json({ error: message, status }, { status: 502 });
    }

    const data = await res.json();
    const entitlement = data?.subscriber?.entitlements?.['Parallel Arabic Premium'];

    if (!entitlement) {
      console.warn('[verify-apple-purchase] No entitlement found for user', { userId });
      return json({ active: false, reason: 'no_entitlement' });
    }

    const expiresDate = entitlement.expires_date ? new Date(entitlement.expires_date) : null;
    const isActive = expiresDate ? expiresDate > new Date() : false;

    if (isActive) {
      const subscriptions = data?.subscriber?.subscriptions ?? {};
      const subKey = Object.keys(subscriptions)[0];
      const transactionId = subscriptions[subKey]?.original_transaction_id ?? subKey ?? null;

      const { error } = await supabase
        .from('user')
        .update({
          is_subscriber: true,
          subscriber_id: transactionId,
          subscription_end_date: expiresDate ? Math.floor(expiresDate.getTime() / 1000) : null
        })
        .eq('supabase_auth_id', userId);

      if (error) {
        console.error('[verify-apple-purchase] DB update error:', error);
        return json({ error: 'Could not save subscription status. Please contact support.' }, { status: 500 });
      }
    }

    return json({ active: isActive });
  } catch (err) {
    console.error('[verify-apple-purchase] Error:', err);
    return json({ error: 'Internal error' }, { status: 500 });
  }
};
