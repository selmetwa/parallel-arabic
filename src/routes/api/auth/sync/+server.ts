import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { syncSupabaseUserWithDB } from '$lib/helpers/supabase-auth-helpers';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ locals, request }) => {
  console.log('[sync] ========== START ==========');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { session, supabase } = locals as any;
  console.log('[sync] locals.session present:', !!session);

  if (session) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[sync] No user from server session');
      return json({ error: 'No user' }, { status: 401 });
    }
    console.log('[sync] Server flow — syncing user:', user.id);
    try {
      await syncSupabaseUserWithDB(user, supabase);
      console.log('[sync] Server flow sync OK');
      return json({ ok: true });
    } catch (err) {
      console.error('[sync] Server flow sync error:', err);
      return json({ error: 'Sync failed', detail: (err as Error)?.message }, { status: 500 });
    }
  }

  // Fallback: accept access_token in body
  try {
    const body = await request.json().catch(() => null);
    console.log('[sync] body received:', body ? 'yes' : 'no');
    const accessToken = body?.access_token;
    console.log('[sync] access_token present:', !!accessToken);
    if (!accessToken) return json({ error: 'No access token' }, { status: 401 });

    const adminSupabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY ?? '');
    const { data: { user }, error } = await adminSupabase.auth.getUser(accessToken);
    console.log('[sync] getUser error:', error?.message, 'user:', user?.id, 'email:', user?.email);
    if (error || !user) return json({ error: 'Invalid token', detail: error?.message }, { status: 401 });

    try {
      await syncSupabaseUserWithDB(user, adminSupabase);
      console.log('[sync] Token flow sync OK');
      return json({ ok: true });
    } catch (err) {
      console.error('[sync] Token flow sync error:', err);
      return json({ error: 'Sync failed', detail: (err as Error)?.message }, { status: 500 });
    }
  } catch (err) {
    console.error('[sync] Outer error:', err);
    return json({ error: 'Failed', detail: (err as Error)?.message }, { status: 500 });
  }
};
