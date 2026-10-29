import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// Server-only: the service role key bypasses RLS. SvelteKit fails the build if this reaches
// browser code. Don't call supabase.auth session methods on it — a stored session would
// replace the service role for every request.
export const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
