// import * as Sentry from '@sentry/sveltekit';
import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { getPostHogClient } from '$lib/server/posthog';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import { dev } from '$app/environment';

const DIALECTS = ['egyptian-arabic', 'darija', 'levantine', 'fusha'];

const posthogProxy: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname.startsWith('/ingest')) {
		const useAssetHost =
			pathname.startsWith('/ingest/static/') || pathname.startsWith('/ingest/array/');
		const hostname = useAssetHost ? 'us-assets.i.posthog.com' : 'us.i.posthog.com';

		const url = new URL(event.request.url);
		url.protocol = 'https:';
		url.hostname = hostname;
		url.port = '443';
		url.pathname = pathname.replace(/^\/ingest/, '');

		const headers = new Headers(event.request.headers);
		headers.set('host', hostname);
		headers.set('accept-encoding', '');

		const clientIp = event.request.headers.get('x-forwarded-for') || event.getClientAddress();
		if (clientIp) {
			headers.set('x-forwarded-for', clientIp);
		}

		const response = await fetch(url.toString(), {
			method: event.request.method,
			headers,
			body: event.request.body,
			// @ts-expect-error - duplex is required for streaming request bodies
			duplex: 'half'
		});

		return response;
	}

	return resolve(event);
};

const redirects: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	// /[dialect]/vocab or /[dialect]/write → /vocabulary?dialect=<dialect>
	// const vocabWriteMatch = pathname.match(
	// 	/^\/(egyptian-arabic|darija|levantine|fusha)\/(vocab|write)(?:\/.*)?$/
	// );
	// if (vocabWriteMatch) {
	// 	redirect(301, `/vocabulary?dialect=${vocabWriteMatch[1]}`);
	// }

	// /[dialect]/generated-stories/[id] → /stories (path mismatch: real route uses /generated_story with underscore)
	if (pathname.includes('/generated-stories/')) {
		redirect(301, '/stories');
	}

	// Dialect-prefixed pages that only exist as global routes
	if (pathname.endsWith('/anki-decks') && DIALECTS.some((d) => pathname.startsWith(`/${d}/`))) {
		redirect(301, '/anki-decks');
	}
	if (pathname === '/darija/sentences') {
		redirect(301, '/sentences');
	}

	return resolve(event);
};

// Sentry.init({
// 	dsn: process.env.SENTRY_DSN,
// 	environment: process.env.SENTRY_ENVIRONMENT,
// 	release: process.env.SENTRY_RELEASE,
// 	sendDefaultPii: true,
// 	tracesSampleRate: 1.0
// });

export const handleError: HandleServerError = async ({ error, status, message }) => {
	const posthog = getPostHogClient();
	posthog.capture({
		distinctId: 'server',
		event: 'server_error',
		properties: {
			error: error instanceof Error ? error.message : String(error),
			status,
			message
		}
	});
	console.error(error);
	return { message, status };
};
// export const handleError = Sentry.handleErrorWithSentry();

// Only log in development mode to avoid production overhead
const DEBUG = dev;

const supabase: Handle = async ({ event, resolve }) => {
	/**
	 * Creates a Supabase client specific to this server request.
	 *
	 * The Supabase client gets the Auth token from the request cookies.
	 */
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			/**
			 * SvelteKit's cookies API requires `path` to be explicitly set in
			 * the cookie options. Setting `path` to `/` replicates previous/
			 * standard behavior.
			 */
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	/**
	 * Unlike `supabase.auth.getSession()`, which returns the session _without_
	 * validating the JWT, this function also calls `getUser()` to validate the
	 * JWT before returning the session.
	 */
	event.locals.safeGetSession = async () => {
		try {
			const {
				data: { session }
			} = await event.locals.supabase.auth.getSession();

			if (!session) {
				return { session: null, user: null };
			}

			const {
				data: { user },
				error
			} = await event.locals.supabase.auth.getUser();

			if (error) {
				if (DEBUG) console.error('❌ [hooks.server.ts] Error fetching user from auth:', error);
				// JWT validation has failed
				await event.locals.supabase.auth.signOut();
				return { session: null, user: null };
			}

			// query the user from the database
			const { data: realUser, error: realUserError } = await event.locals.supabase
				.from('user')
				.select('*')
				.eq('supabase_auth_id', user?.id)
				.single();

			if (realUserError) {
				if (DEBUG) {
					console.error('❌ [hooks.server.ts] Error fetching user from database:', realUserError);
					console.error('❌ [hooks.server.ts] Database query details:', {
						supabase_auth_id: user?.id,
						errorCode: realUserError.code,
						errorMessage: realUserError.message
					});
				}
				// IMPORTANT: do NOT sign the user out here. This branch fires during
				// first-time sign-in (auth.users exists but public.user has not been
				// created yet by /api/auth/sync), and signing out invalidates the
				// freshly-issued refresh token — breaking the very sync call that
				// would have created the row. Return null so the UI treats them as
				// unauthenticated, but keep the Supabase session alive so /api/auth/sync
				// can finish the work.
				return { session: null, user: null };
			}

			if (!realUser) {
				if (DEBUG)
					console.error('❌ [hooks.server.ts] User not found in database for auth ID:', user?.id);
				// Same reasoning as above — do not sign out.
				return { session: null, user: null };
			}

			return { session, user: realUser };
		} catch (error) {
			if (DEBUG) {
				console.error('❌ [hooks.server.ts] Unexpected error in safeGetSession:', error);
				console.error(
					'❌ [hooks.server.ts] Error stack:',
					error instanceof Error ? error.stack : 'No stack trace'
				);
			}
			return { session: null, user: null };
		}
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			/**
			 * Supabase libraries use the `content-range` and `x-supabase-api-version`
			 * headers, so we need to tell SvelteKit to pass it through.
			 */
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	// Optional: Add route protection logic here
	// if (!event.locals.session && event.url.pathname.startsWith('/private')) {
	//   redirect(303, '/auth')
	// }

	return resolve(event);
};

// Auth helper that maintains compatibility with existing Lucia patterns
const auth: Handle = async ({ event, resolve }) => {
	// Create auth object similar to Lucia's locals.auth for backward compatibility
	event.locals.auth = {
		validate: async () => {
			const { session, user } = await event.locals.safeGetSession();
			if (!session || !user) return null;

			return {
				sessionId: session.access_token,
				user: {
					id: user.id,
					email: user.email || undefined,
					supabase_auth_id: user.supabase_auth_id
				}
			};
		},
		setSession: () => {
			// Session management should be handled client-side with Supabase
		},
		invalidateSession: async () => {
			await event.locals.supabase.auth.signOut();
		}
	};

	return resolve(event);
};

export const handle: Handle = sequence(posthogProxy, redirects, supabase, authGuard, auth);
// export const handle: Handle = sequence(Sentry.sentryHandle(), redirects, supabase, authGuard, auth);
