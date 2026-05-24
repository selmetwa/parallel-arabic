import { json, type Cookies } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { syncSupabaseUserWithDB } from '$lib/helpers/supabase-auth-helpers';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

type ErrorCode =
  | 'no_token'
  | 'invalid_token'
  | 'no_user_id'
  | 'admin_lookup_failed'
  | 'db_sync_failed'
  | 'set_session_failed'
  | 'no_email'
  | 'unauthorized';

function err(code: ErrorCode, message: string, status: number, detail?: string) {
  return json({ error: message, code, detail }, { status });
}

function projectRef(): string | null {
  // Used to construct Supabase's auth cookie names. Cookie names look like
  // `sb-{projectRef}-auth-token` — the cookie value is the JSON-serialized
  // session object that Supabase's SSR adapter reads on subsequent requests.
  const match = PUBLIC_SUPABASE_URL.match(/^https?:\/\/([^.]+)\./);
  return match ? match[1] : null;
}

function writeSupabaseSessionCookies(
  cookies: Cookies,
  session: {
    access_token: string;
    refresh_token: string;
    expires_at?: number | null;
    expires_in?: number | null;
    token_type?: string | null;
    user?: unknown;
  }
) {
  const ref = projectRef();
  if (!ref) return;

  const cookieName = `sb-${ref}-auth-token`;
  const value = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at ?? null,
    expires_in: session.expires_in ?? null,
    token_type: session.token_type ?? 'bearer',
    user: session.user ?? null
  });

  cookies.set(cookieName, value, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    // ~7 days; Supabase refreshes on each request via the SSR adapter.
    maxAge: 60 * 60 * 24 * 7
  });
}

export const POST: RequestHandler = async ({ locals, request, cookies }) => {
  console.log('[sync] ========== START ==========');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { session, supabase } = locals as any;
  console.log('[sync] locals.session present:', !!session);

  // -------- Server flow: cookies already have a valid session --------
  if (session) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[sync] No user from server session');
      return err('unauthorized', 'No user', 401);
    }
    console.log('[sync] Server flow — syncing user:', user.id);
    try {
      await syncSupabaseUserWithDB(user, supabase);
      console.log('[sync] Server flow sync OK');
      return json({ ok: true });
    } catch (e) {
      const message = (e as Error)?.message || 'Sync failed';
      console.error('[sync] Server flow sync error:', e);
      return err('db_sync_failed', 'Could not finalize your account.', 500, message);
    }
  }

  // -------- Token flow: tokens passed in body --------
  let body: { access_token?: string; refresh_token?: string } | null = null;
  try {
    body = await request.json().catch(() => null);
  } catch {
    body = null;
  }

  const accessToken = body?.access_token;
  const refreshToken = body?.refresh_token;
  console.log('[sync] body received:', body ? 'yes' : 'no');
  console.log('[sync] access_token present:', !!accessToken);
  console.log('[sync] refresh_token present:', !!refreshToken);

  if (!accessToken) {
    return err('no_token', 'Sign-in token missing. Please try again.', 401);
  }

  const adminSupabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY ?? '');

  // Decode JWT to extract the user id (admin client doesn't validate JWTs via getUser()).
  let userId: string | undefined;
  try {
    const payloadB64 = accessToken.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    userId = payload.sub;
    console.log('[sync] decoded JWT sub:', userId);
  } catch (e) {
    console.error('[sync] JWT decode error:', e);
    return err('invalid_token', 'Sign-in token is malformed. Please try again.', 401);
  }
  if (!userId) {
    return err('no_user_id', 'Sign-in token has no user id. Please try again.', 401);
  }

  const { data: userResp, error: lookupError } = await adminSupabase.auth.admin.getUserById(userId);
  const user = userResp?.user;
  console.log(
    '[sync] getUserById error:',
    lookupError?.message,
    'user:',
    user?.id,
    'email:',
    user?.email
  );
  if (lookupError || !user) {
    return err(
      'admin_lookup_failed',
      'Could not verify your account with the auth provider.',
      401,
      lookupError?.message
    );
  }

  if (!user.email) {
    // Apple sign-in can return a user with no email when the user has Hide My
    // Email enabled and the relay hasn't propagated, or on repeat sign-ins.
    return err(
      'no_email',
      'Your Apple ID did not share an email with us. Please enable email sharing in Settings → Apple ID → Sign in with Apple, or use a different sign-in method.',
      400
    );
  }

  try {
    await syncSupabaseUserWithDB(user, adminSupabase);
    console.log('[sync] Token flow sync OK');
  } catch (e) {
    const message = (e as Error)?.message || 'Sync failed';
    console.error('[sync] Token flow sync error:', e);
    return err('db_sync_failed', 'Could not save your account. Please try again.', 500, message);
  }

  // Belt-and-suspenders cookie write. We do BOTH:
  //   1. Tell Supabase to setSession on the SSR client (writes cookies via the
  //      adapter callback when it works).
  //   2. Write the canonical sb-<ref>-auth-token cookie ourselves directly,
  //      so even if Supabase's setSession misbehaves (we've seen "Auth session
  //      missing!" errors in production), the SSR adapter on subsequent
  //      requests still finds a valid session cookie.
  if (refreshToken) {
    const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    console.log('[sync] setSession on locals.supabase error:', setSessionError?.message);

    const sessionForCookie = setSessionData?.session ?? {
      access_token: accessToken,
      refresh_token: refreshToken
    };
    writeSupabaseSessionCookies(cookies, sessionForCookie as any);
  } else {
    console.log('[sync] No refresh_token in body — writing cookies with access_token only');
    writeSupabaseSessionCookies(cookies, {
      access_token: accessToken,
      refresh_token: ''
    });
  }

  return json({ ok: true });
};
