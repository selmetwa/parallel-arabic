import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { syncSupabaseUserWithDB } from '$lib/helpers/supabase-auth-helpers';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  console.log('🔗 Google OAuth callback hit');
  
	const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';
  const error = url.searchParams.get('error');
  const error_description = url.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('❌ Google OAuth error:', error, error_description);
    throw redirect(303, `/login?error=${encodeURIComponent(error_description || error)}`);
  }

  if (!code) {
    console.error('❌ No OAuth code received');
    throw redirect(303, '/login?error=No authorization code received');
  }

  try {
    // Exchange the OAuth code for a Supabase session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('❌ Code exchange error:', exchangeError);
      throw redirect(303, `/login?error=${encodeURIComponent('Google authentication failed')}`);
    }

    if (data.session && data.user) {
      console.log('✅ Google OAuth successful for:', data.user.email);
      
      try {
        // Sync user data with your existing database using our helper
        console.log('🔄 Syncing user with database...');
        await syncSupabaseUserWithDB(data.user, supabase);
        console.log('✅ User synced to database:', data.user.email);
      } catch (syncError) {
        console.error('❌ Failed to sync user to database:', syncError);
        // Continue with login even if sync fails - can be retried later
        // Don't block the user from logging in
      }
      
      console.log('🏠 Redirecting to:', next);
      throw redirect(303, next);
    }
    
    // No session created
    console.error('❌ No session created during OAuth exchange');
    throw redirect(303, '/login?error=Authentication failed');
    
  } catch (err) {
    // Handle any unexpected errors
    if (err instanceof Response) {
      // This is a redirect, re-throw it
      throw err;
    }
    
    console.error('💥 Unexpected error during Google OAuth:', err);
    throw redirect(303, '/login?error=Authentication failed');
  }
};