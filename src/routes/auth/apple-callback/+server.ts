import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { syncSupabaseUserWithDB } from '$lib/helpers/supabase-auth-helpers';

export const GET: RequestHandler = async ({ url, locals }) => {
  const access_token = url.searchParams.get('access_token');
  const refresh_token = url.searchParams.get('refresh_token');

  if (!access_token || !refresh_token) {
    redirect(303, '/login?error=missing_tokens');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (locals as any).supabase;
  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });

  if (error || !data.user) {
    console.error('[apple-callback GET] setSession error:', error);
    redirect(303, '/login?error=auth_failed');
  }

  await syncSupabaseUserWithDB(data.user, supabase);
  redirect(303, '/');
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const { access_token, refresh_token } = await request.json();

  if (!access_token || !refresh_token) {
    return json({ error: 'Missing tokens' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (locals as any).supabase;
  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });

  if (error || !data.user) {
    console.error('[apple-callback POST] setSession error:', error);
    return json({ error: 'Auth failed', detail: error?.message }, { status: 401 });
  }

  await syncSupabaseUserWithDB(data.user, supabase);
  return json({ ok: true });
};
