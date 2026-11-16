import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { fetchRevenueCatEntitlement, resolveUserRowId } from '$lib/server/revenuecat-entitlement';

export const POST: RequestHandler = async ({ request }) => {
  console.log('[RC webhook] ========== REQUEST RECEIVED ==========');
  console.log('[RC webhook] SERVICE_ROLE_KEY present:', !!env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('[RC webhook] WEBHOOK_SECRET present:', !!env.REVENUECAT_WEBHOOK_SECRET);

  let adminSupabase;
  try {
    adminSupabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY ?? '');
    console.log('[RC webhook] Supabase admin client created OK');
  } catch (err) {
    console.error('[RC webhook] Failed to create Supabase client:', err);
    return json({ error: 'Supabase init failed' }, { status: 500 });
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');

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

  const { app_user_id, type, expiration_at_ms, original_transaction_id, period_type } = event;
  console.log('[RC webhook] app_user_id:', app_user_id);
  console.log('[RC webhook] type:', type);
  console.log('[RC webhook] expiration_at_ms:', expiration_at_ms);
  console.log('[RC webhook] original_transaction_id:', original_transaction_id);

  // A restore on another account moved the purchase there. Renewals now go to
  // the new owner, so save the subscription on that user's row too.
  if (type === 'TRANSFER') {
    const transferredTo: string[] = event.transferred_to ?? [];
    console.log('[RC webhook] TRANSFER', { from: event.transferred_from, to: transferredTo });
    for (const userId of transferredTo) {
      if (userId.startsWith('$RCAnonymousID')) continue;
      const resolved = await fetchRevenueCatEntitlement(userId, env.REVENUECAT_API_KEY ?? '');
      if (!resolved?.isActive) continue;
      const rowId = await resolveUserRowId(adminSupabase, userId);
      if (!rowId) {
        console.warn('[RC webhook] TRANSFER matched no user row:', userId);
        continue;
      }

      const { data, error } = await adminSupabase
        .from('user')
        .update({
          is_subscriber: true,
          subscriber_id: resolved.transactionId,
          subscription_end_date: resolved.expiresMs ? Math.floor(resolved.expiresMs / 1000) : null
        })
        .eq('id', rowId)
        .select('id');

      if (error) console.error('[RC webhook] TRANSFER DB error:', error);
      else if (!data?.length) console.warn('[RC webhook] TRANSFER matched no user row:', rowId);
    }
    return json({ received: true });
  }

  if (!app_user_id) {
    console.log('[RC webhook] No app_user_id for event type:', type, '— skipping');
    return json({ received: true });
  }

  // app_user_id is usually public.user.id, but can be the Supabase auth id.
  const rowId = await resolveUserRowId(adminSupabase, app_user_id);
  if (!rowId) {
    // The purchase belongs to a RevenueCat customer we have no row for, so
    // this user keeps paying without access.
    console.warn('[RC webhook] No user row for app_user_id:', app_user_id, 'type:', type);
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
          subscription_end_date: subscriptionEndDate,
          // An Apple trial uses up the web trial too (see user-context trialEligible).
          ...(period_type === 'TRIAL' && { has_used_trial: true })
        })
        .eq('id', rowId)
        .select();

      console.log('[RC webhook] Update result - data:', JSON.stringify(data));
      console.log('[RC webhook] Update result - error:', JSON.stringify(error));
      if (error) console.error('[RC webhook] DB error:', error);
      // The purchase belongs to a RevenueCat customer we have no row for, so
      // this user keeps paying without access.
      else if (!data?.length) console.warn('[RC webhook] No user row for app_user_id:', app_user_id);
      break;
    }

    case 'CANCELLATION':
    case 'BILLING_ISSUE': {
      if (expiration_at_ms) {
        const { data, error } = await adminSupabase
          .from('user')
          .update({ subscription_end_date: Math.floor(expiration_at_ms / 1000) })
          .eq('id', rowId)
          .select();

        console.log('[RC webhook] Cancellation update - data:', JSON.stringify(data));
        console.log('[RC webhook] Cancellation update - error:', JSON.stringify(error));
      }
      break;
    }

    case 'EXPIRATION': {
      // The row's other RevenueCat customer (database id vs auth id) may still
      // hold an active subscription; keep that one instead of clearing.
      const { data: row } = await adminSupabase
        .from('user')
        .select('supabase_auth_id')
        .eq('id', rowId)
        .single();
      for (const id of [rowId, row?.supabase_auth_id]) {
        if (!id) continue;
        const resolved = await fetchRevenueCatEntitlement(id, env.REVENUECAT_API_KEY ?? '');
        if (!resolved?.isActive) continue;
        console.log('[RC webhook] EXPIRATION skipped, still active under', id);
        const { error } = await adminSupabase
          .from('user')
          .update({
            is_subscriber: true,
            subscriber_id: resolved.transactionId,
            subscription_end_date: resolved.expiresMs ? Math.floor(resolved.expiresMs / 1000) : null
          })
          .eq('id', rowId);
        if (error) console.error('[RC webhook] EXPIRATION keep-active DB error:', error);
        return json({ received: true });
      }

      const { data, error } = await adminSupabase
        .from('user')
        .update({
          is_subscriber: false,
          subscriber_id: null,
          subscription_end_date: null
        })
        .eq('id', rowId)
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
