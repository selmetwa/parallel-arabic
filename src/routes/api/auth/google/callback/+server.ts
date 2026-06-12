import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { syncSupabaseUserWithDB } from '$lib/helpers/supabase-auth-helpers';
import { getPostHogClient } from '$lib/server/posthog';

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

			// Check if this is a new user before syncing
			const { data: existingUser, error: selectError } = await supabase
				.from('user')
				.select('id')
				.eq('supabase_auth_id', data.user.id)
				.single();

			// PGRST116 = no rows returned, meaning it's a new user
			const isNewUser = !existingUser && selectError?.code === 'PGRST116';

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

			const posthog = getPostHogClient();
			posthog.capture({
				distinctId: data.user.id,
				event: isNewUser ? 'user_signed_up' : 'user_logged_in',
				properties: { method: 'google' }
			});
			await posthog.flush();

			// If it's a new user, redirect with newSignup flag to trigger onboarding
			const redirectUrl = isNewUser ? '/?newSignup=true' : next;
			console.log('🏠 Redirecting to:', redirectUrl);
			throw redirect(303, redirectUrl);
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
