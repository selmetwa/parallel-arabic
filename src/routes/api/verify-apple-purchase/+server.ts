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
    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${userId}`, {
      headers: {
        Authorization: `Bearer ${env.REVENUECAT_API_KEY}`,
        'X-Platform': 'ios'
      }
    });

    if (!res.ok) {
      return json({ error: 'Failed to fetch subscriber info' }, { status: 502 });
    }

    const data = await res.json();
    const entitlement = data?.subscriber?.entitlements?.['Parallel Arabic Premium'];

    if (!entitlement) {
      return json({ active: false });
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
        .eq('id', userId);

      if (error) console.error('[verify-apple-purchase] DB update error:', error);
    }

    return json({ active: isActive });
  } catch (err) {
    console.error('[verify-apple-purchase] Error:', err);
    return json({ error: 'Internal error' }, { status: 500 });
  }
};
