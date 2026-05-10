import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request }) => {
  // Use service role to bypass RLS for server-side updates
  const adminSupabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY ?? '');

  // Validate shared secret
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (env.REVENUECAT_WEBHOOK_SECRET && token !== env.REVENUECAT_WEBHOOK_SECRET) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const event = body?.event;

  if (!event) {
    return json({ error: 'Missing event' }, { status: 400 });
  }

  const { app_user_id, type, expiration_at_ms, original_transaction_id } = event;

  if (!app_user_id) {
    return json({ error: 'Missing app_user_id' }, { status: 400 });
  }

  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE': {
      const subscriptionEndDate = expiration_at_ms
        ? Math.floor(expiration_at_ms / 1000)
        : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

      const { error } = await adminSupabase
        .from('user')
        .update({
          is_subscriber: true,
          subscriber_id: original_transaction_id ?? null,
          subscription_end_date: subscriptionEndDate
        })
        .eq('id', app_user_id);

      if (error) console.error('[RC webhook] Error updating subscription:', error);
      break;
    }

    case 'CANCELLATION':
    case 'BILLING_ISSUE': {
      // User cancelled or has billing issues — retain access until expiration_at_ms
      if (expiration_at_ms) {
        const { error } = await adminSupabase
          .from('user')
          .update({ subscription_end_date: Math.floor(expiration_at_ms / 1000) })
          .eq('id', app_user_id);

        if (error) console.error('[RC webhook] Error updating expiry on cancellation:', error);
      }
      break;
    }

    case 'EXPIRATION': {
      const { error } = await adminSupabase
        .from('user')
        .update({
          is_subscriber: false,
          subscriber_id: null,
          subscription_end_date: null
        })
        .eq('id', app_user_id);

      if (error) console.error('[RC webhook] Error clearing subscription on expiration:', error);
      break;
    }
  }

  return json({ received: true });
};
