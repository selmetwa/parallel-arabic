import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

const ENTITLEMENT_ID = 'Parallel Arabic Premium';

type ResolvedEntitlement = {
  isActive: boolean;
  expiresMs: number | null;
  transactionId: string | null;
  source: 'revenuecat_rest' | 'client_customer_info';
};

function resolveFromRevenueCatRest(data: any): ResolvedEntitlement | null {
  const entitlement = data?.subscriber?.entitlements?.[ENTITLEMENT_ID];
  if (!entitlement) return null;

  const expiresMs = entitlement.expires_date ? new Date(entitlement.expires_date).getTime() : null;
  const isActive = expiresMs ? expiresMs > Date.now() : false;

  const subscriptions = data?.subscriber?.subscriptions ?? {};
  const subKey = Object.keys(subscriptions)[0];
  const transactionId = subscriptions[subKey]?.original_transaction_id ?? subKey ?? null;

  return { isActive, expiresMs, transactionId, source: 'revenuecat_rest' };
}

function resolveFromCustomerInfo(customerInfo: any): ResolvedEntitlement | null {
  const entitlement = customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
  if (!entitlement) return null;

  const expiresMs = entitlement.expirationDate
    ? new Date(entitlement.expirationDate).getTime()
    : entitlement.expirationDateMillis ?? null;

  const isActive = entitlement.isActive ?? (expiresMs ? expiresMs > Date.now() : true);
  const transactionId =
    entitlement.originalPurchaseDate ?? entitlement.productIdentifier ?? null;

  return { isActive, expiresMs, transactionId, source: 'client_customer_info' };
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAuthId = session.user.id;

  // The RevenueCat client SDK is initialized with `public.user.id` (the custom
  // alphanumeric id, not the Supabase auth UUID). Look it up so our RC REST
  // call queries the same subscriber the SDK created.
  const adminSupabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY ?? '');
  const { data: dbUser, error: lookupError } = await adminSupabase
    .from('user')
    .select('id')
    .eq('supabase_auth_id', supabaseAuthId)
    .single();

  if (lookupError || !dbUser?.id) {
    console.error('[verify-apple-purchase] Could not look up user.id', {
      supabaseAuthId,
      error: lookupError
    });
    return json(
      { error: 'Could not find your account. Please contact support.' },
      { status: 500 }
    );
  }

  const rcUserId = dbUser.id;

  // Optional client-provided customerInfo from the RevenueCat SDK. This is the
  // freshest source of truth on iOS — it came directly from StoreKit + the RC
  // SDK, which already validated the receipt with Apple. It bypasses the
  // multi-second cache lag of RevenueCat's REST API in sandbox.
  let clientCustomerInfo: any = null;
  try {
    const body = await request.json().catch(() => null);
    clientCustomerInfo = body?.customerInfo ?? null;
  } catch {
    // body is optional
  }

  try {
    if (!env.REVENUECAT_API_KEY) {
      console.error('[verify-apple-purchase] REVENUECAT_API_KEY env var is not set');
      return json(
        { error: 'Server configuration error: subscription verification key is missing.' },
        { status: 500 }
      );
    }

    let resolved: ResolvedEntitlement | null = null;
    let restStatus = 0;

    // Defense in depth: try RC REST first. If it has the entitlement, trust it.
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${rcUserId}`, {
        headers: { Authorization: `Bearer ${env.REVENUECAT_API_KEY}` }
      });
      restStatus = res.status;

      if (res.status === 401 || res.status === 403) {
        const bodyText = await res.text().catch(() => '');
        console.error('[verify-apple-purchase] RevenueCat auth error', {
          status: res.status,
          body: bodyText
        });
        // No retries on auth errors; fall through to client-provided customerInfo.
        break;
      }

      if (res.ok) {
        const data = await res.json();
        resolved = resolveFromRevenueCatRest(data);
        if (resolved?.isActive) break;
      }

      // Sandbox lag: short backoff then retry once.
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    // Fallback: trust the client-provided customerInfo if REST didn't find an
    // active entitlement. This covers the sandbox propagation lag where Apple
    // and the SDK already see the purchase but RC's REST cache hasn't caught up.
    if (!resolved?.isActive && clientCustomerInfo) {
      const fromClient = resolveFromCustomerInfo(clientCustomerInfo);
      if (fromClient?.isActive) {
        resolved = fromClient;
        console.log('[verify-apple-purchase] using client customerInfo as fallback', {
          rcUserId,
          restStatus
        });
      }
    }

    if (!resolved?.isActive) {
      console.warn('[verify-apple-purchase] No active entitlement found', { rcUserId, restStatus });
      return json({ active: false, reason: 'no_entitlement' });
    }

    const { data: updatedRows, error } = await adminSupabase
      .from('user')
      .update({
        is_subscriber: true,
        subscriber_id: resolved.transactionId,
        subscription_end_date: resolved.expiresMs ? Math.floor(resolved.expiresMs / 1000) : null
      })
      .eq('id', rcUserId)
      .select('id');

    if (error) {
      console.error('[verify-apple-purchase] DB update error:', error);
      return json({ error: 'Could not save subscription status. Please contact support.' }, { status: 500 });
    }

    if (!updatedRows || updatedRows.length === 0) {
      console.error('[verify-apple-purchase] DB update affected 0 rows', {
        id: rcUserId
      });
      return json(
        { error: 'Could not find your account to save the subscription. Please contact support.' },
        { status: 500 }
      );
    }

    return json({ active: true, source: resolved.source });
  } catch (err) {
    console.error('[verify-apple-purchase] Error:', err);
    return json({ error: 'Internal error' }, { status: 500 });
  }
};
