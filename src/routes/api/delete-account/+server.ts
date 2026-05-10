import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import { StripeService } from '$lib/services/stripe.service';

export const POST: RequestHandler = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  if (!session) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAuthId = session.user.id;
  const adminSupabase = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY ?? '');

  // Fetch user record
  const { data: userData, error: fetchError } = await adminSupabase
    .from('user')
    .select('id, subscriber_id')
    .eq('supabase_auth_id', supabaseAuthId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[delete-account] Error fetching user:', fetchError);
  }

  // Cancel Stripe subscription if active
  if (userData?.subscriber_id?.startsWith('sub_')) {
    try {
      await StripeService.cancel(userData.subscriber_id);
    } catch (err) {
      console.error('[delete-account] Error cancelling Stripe subscription:', err);
    }
  }

  if (userData?.id) {
    // Delete saved words
    await adminSupabase.from('saved_word').delete().eq('user_id', userData.id);

    // Delete user record
    await adminSupabase.from('user').delete().eq('id', userData.id);
  }

  // Delete Supabase auth user
  const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(supabaseAuthId);
  if (authDeleteError) {
    console.error('[delete-account] Error deleting auth user:', authDeleteError);
    return json({ error: 'Failed to delete account' }, { status: 500 });
  }

  return json({ success: true });
};
