import { redirect } from '@sveltejs/kit';
import { googleAuth } from '$lib/server/lucia';
import { auth } from '$lib/server/lucia';
import type { RequestHandler } from './$types';
import { linkGoogleToExistingAccount } from '$lib/server/auth-linking';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('google_oauth_state');

	if (!storedState || !state || storedState !== state || !code) {
		console.error({
			url,
			storedState,
			state,
			code,
		})
		throw redirect(302, '/login?error=oauth_error');
	}

	try {
		const { googleUser, createUser } = await googleAuth.validateCallback(code);

		const getUser = async () => {
      // Check for existing user by email
			const existingUser = await db
        .selectFrom('user')
        .selectAll()
        .where('email', '=', googleUser.email ?? '')
        .executeTakeFirst();

        if (existingUser) {
				// Update existing user with Google info
				await db
					.updateTable('user')
					.set({
						google_id: googleUser.sub,
						auth_provider: existingUser.auth_provider === 'email' ? 'both' : 'google',
						name: googleUser.name,
						picture: googleUser.picture
					})
					.where('id', '=', existingUser.id)
					.execute();
				
				return auth.transformDatabaseUser(existingUser);
			}

			const linkedUser = await linkGoogleToExistingAccount(googleUser.sub, (googleUser.email ?? ''));
			if (linkedUser) {
				return auth.transformDatabaseUser(linkedUser);
			}
			
			const user = await createUser({
				attributes: {
					email: googleUser.email,
					email_verified: Number(true),
					name: googleUser.name,
					picture: googleUser.picture,
					auth_provider: 'google',
					google_id: googleUser.sub,
					is_subscriber: 0
				}
			});

			return user;
		};

		const user = await getUser();

		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		locals.auth.setSession(session);
	} catch (e) {
		console.error({ e })
		throw redirect(302, '/login?error=oauth_error');
	}

	throw redirect(302, '/stories');
};