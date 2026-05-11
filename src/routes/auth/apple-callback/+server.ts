import { redirect } from '@sveltejs/kit';
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
    console.error('[apple-callback] setSession error:', error);
    redirect(303, '/login?error=auth_failed');
  }

  await syncSupabaseUserWithDB(data.user, supabase);

  redirect(303, '/');
};
