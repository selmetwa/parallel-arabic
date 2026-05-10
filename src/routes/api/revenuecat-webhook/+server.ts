import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request }) => {
  console.log('[RC webhook] ========== REQUEST RECEIVED ==========');
  console.log('[RC webhook] SUPABASE_URL:', PUBLIC_SUPABASE_URL);
  console.log('[RC webhook] SERVICE_ROLE_KEY present:', !!env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('[RC webhook] SERVICE_ROLE_KEY prefix:', env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20));
  console.log('[RC webhook] WEBHOOK_SECRET present:', !!env.REVENUECAT_WEBHOOK_SECRET);
  console.log('[RC webhook] WEBHOOK_SECRET value:', env.REVENUECAT_WEBHOOK_SECRET);

  let adminSupabase;
  try {
    adminSupabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY ?? '');
    console.log('[RC webhook] Supabase admin client created OK');
  } catch (err) {
    console.error('[RC webhook] Failed to create Supabase client:', err);
    return json({ error: 'Supabase init failed' }, { status: 500 });
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  console.log('[RC webhook] Auth header received:', authHeader);
  const token = authHeader.replace('Bearer ', '');
  console.log('[RC webhook] Token extracted:', token);
  console.log('[RC webhook] Token matches secret:', token === env.REVENUECAT_WEBHOOK_SECRET);

  if (env.REVENUECAT_WEBHOOK_SECRET && token !== env.REVENUECAT_WEBHOOK_SECRET) {
    console.error('[RC webhook] Unauthorized — token mismatch');
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
    console.log('[RC webhook] Body parsed OK, event type:', body?.event?.type);
  } catch (err) {
    console.error('[RC webhook] Failed to parse request body:', err);
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body?.event;
  if (!event) {
    console.error('[RC webhook] No event in body');
    return json({ error: 'Missing event' }, { status: 400 });
  }

  const { app_user_id, type, expiration_at_ms, original_transaction_id } = event;
  console.log('[RC webhook] app_user_id:', app_user_id);
  console.log('[RC webhook] type:', type);
  console.log('[RC webhook] expiration_at_ms:', expiration_at_ms);
  console.log('[RC webhook] original_transaction_id:', original_transaction_id);

  if (!app_user_id) {
    console.log('[RC webhook] No app_user_id for event type:', type, '— skipping (expected for TRANSFER events)');
    return json({ received: true });
  }

  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE':
    case 'NON_RENEWING_PURCHASE': {
      const subscriptionEndDate = expiration_at_ms
        ? Math.floor(expiration_at_ms / 1000)
        : Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

      console.log('[RC webhook] Updating user to subscriber, end date:', subscriptionEndDate);
      const { data, error } = await adminSupabase
        .from('user')
        .update({
          is_subscriber: true,
          subscriber_id: original_transaction_id ?? null,
          subscription_end_date: subscriptionEndDate
        })
        .eq('supabase_auth_id', app_user_id)
        .select();

      console.log('[RC webhook] Update result - data:', JSON.stringify(data));
      console.log('[RC webhook] Update result - error:', JSON.stringify(error));
      if (error) console.error('[RC webhook] DB error:', error);
      break;
    }

    case 'CANCELLATION':
    case 'BILLING_ISSUE': {
      if (expiration_at_ms) {
        const { data, error } = await adminSupabase
          .from('user')
          .update({ subscription_end_date: Math.floor(expiration_at_ms / 1000) })
          .eq('supabase_auth_id', app_user_id)
          .select();

        console.log('[RC webhook] Cancellation update - data:', JSON.stringify(data));
        console.log('[RC webhook] Cancellation update - error:', JSON.stringify(error));
      }
      break;
    }

    case 'EXPIRATION': {
      const { data, error } = await adminSupabase
        .from('user')
        .update({
          is_subscriber: false,
          subscriber_id: null,
          subscription_end_date: null
        })
        .eq('supabase_auth_id', app_user_id)
        .select();

      console.log('[RC webhook] Expiration update - data:', JSON.stringify(data));
      console.log('[RC webhook] Expiration update - error:', JSON.stringify(error));
      break;
    }

    default:
      console.log('[RC webhook] Unhandled event type:', type);
  }

  console.log('[RC webhook] ========== DONE ==========');
  return json({ received: true });
};
