import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { syncSupabaseUserWithDB } from '$lib/helpers/supabase-auth-helpers';

export const POST: RequestHandler = async ({ locals }) => {
  const { session, supabase } = locals;
  if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'No user' }, { status: 401 });

  await syncSupabaseUserWithDB(user, supabase);
  return json({ ok: true });
};
