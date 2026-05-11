import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { syncSupabaseUserWithDB } from '$lib/helpers/supabase-auth-helpers';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ locals, request }) => {
  // Try server-side session first (standard flow)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { session, supabase } = locals as any;

  if (session) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'No user' }, { status: 401 });
    await syncSupabaseUserWithDB(user, supabase);
    return json({ ok: true });
  }

  // Fallback: accept access_token in body (native Apple/Google sign-in where
  // server cookies aren't set yet during the first request)
  try {
    const body = await request.json().catch(() => null);
    const accessToken = body?.access_token;
    if (!accessToken) return json({ error: 'Not authenticated' }, { status: 401 });

    const adminSupabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY ?? '');
    const { data: { user }, error } = await adminSupabase.auth.getUser(accessToken);
    if (error || !user) return json({ error: 'Invalid token' }, { status: 401 });

    await syncSupabaseUserWithDB(user, adminSupabase);
    return json({ ok: true });
  } catch {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }
};
