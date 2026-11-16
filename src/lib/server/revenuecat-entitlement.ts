import type { SupabaseClient } from '@supabase/supabase-js';

export const ENTITLEMENT_ID = 'Parallel Arabic Premium';

export type ResolvedEntitlement = {
  isActive: boolean;
  expiresMs: number | null;
  transactionId: string | null;
  source: 'revenuecat_rest' | 'client_customer_info';
};

export function resolveFromRevenueCatRest(data: any): ResolvedEntitlement | null {
  const entitlement = data?.subscriber?.entitlements?.[ENTITLEMENT_ID];
  if (!entitlement) return null;

  const expiresMs = entitlement.expires_date ? new Date(entitlement.expires_date).getTime() : null;
  const isActive = expiresMs ? expiresMs > Date.now() : false;

  // With monthly and annual products a subscriber can have several entries, so
  // use the one that grants the entitlement, not whichever is listed first.
  const subscriptions = data?.subscriber?.subscriptions ?? {};
  const subKey = entitlement.product_identifier ?? Object.keys(subscriptions)[0];
  const transactionId = subscriptions[subKey]?.original_transaction_id ?? subKey ?? null;

  return { isActive, expiresMs, transactionId, source: 'revenuecat_rest' };
}

/**
 * The public.user.id a RevenueCat app user id belongs to. Old app builds logged
 * the SDK in with the Supabase auth id on some screens, so purchases can live
 * under either id. Null when no row matches.
 */
export async function resolveUserRowId(
  adminSupabase: SupabaseClient,
  appUserId: string
): Promise<string | null> {
  const { data: byId } = await adminSupabase.from('user').select('id').eq('id', appUserId).maybeSingle();
  if (byId?.id) return byId.id;
  const { data: byAuthId } = await adminSupabase
    .from('user')
    .select('id')
    .eq('supabase_auth_id', appUserId)
    .maybeSingle();
  return byAuthId?.id ?? null;
}

/** Looks a subscriber up through RevenueCat's REST API. Null when the call fails. */
export async function fetchRevenueCatEntitlement(
  appUserId: string,
  apiKey: string
): Promise<ResolvedEntitlement | null> {
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (!res.ok) {
    console.error('[revenuecat] REST lookup failed', { appUserId, status: res.status });
    return null;
  }
  return resolveFromRevenueCatRest(await res.json());
}
