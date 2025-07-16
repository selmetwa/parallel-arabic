import { redirect } from '@sveltejs/kit';
import { googleAuth } from '$lib/server/lucia';
import { auth } from '$lib/server/lucia';
import type { RequestHandler } from './$types';
import { linkGoogleToExistingAccount } from '$lib/server/auth-linking';
import { db } from '$lib/server/db';
import { LuciaError } from 'lucia';

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
			// First, try to find existing user by Google key
			try {
				const existingKey = await auth.useKey('google', googleUser.sub, null);
				// If key exists, try to get the user
				try {
					const user = await auth.getUser(existingKey.userId);
					return user;
				} catch (userError) {
					// Key exists but user doesn't - this is an orphaned key
					if (userError instanceof LuciaError && userError.message === 'AUTH_INVALID_USER_ID') {
						console.log('Found orphaned Google key for user ID:', existingKey.userId, 'Cleaning up...');
						
						// Delete the orphaned key
						await db
							.deleteFrom('user_key')
							.where('id', '=', `google:${googleUser.sub}`)
							.execute();
						
						console.log('Orphaned Google key cleaned up successfully');
						
						// Continue with normal user creation flow below
					} else {
						throw userError; // Re-throw if it's a different error
					}
				}
			} catch (e) {
				// Key doesn't exist, continue with user creation flow
				if (!(e instanceof LuciaError) || e.message !== 'AUTH_INVALID_KEY_ID') {
					throw e; // Re-throw if it's not the expected error
				}
			}

			// Check for existing user by email
			const existingUserByEmail = await db
				.selectFrom('user')
				.selectAll()
				.where('email', '=', googleUser.email ?? '')
				.executeTakeFirst();

			if (existingUserByEmail) {
				// User exists with this email, create Google key for them
				try {
					await auth.createKey({
						userId: existingUserByEmail.id,
						providerId: 'google',
						providerUserId: googleUser.sub,
						password: null
					});
				} catch (keyError) {
					// Key might already exist, ignore this error
					console.log('Google key already exists for user');
				}

				// Update existing user with Google info
				await db
					.updateTable('user')
					.set({
						google_id: googleUser.sub,
						auth_provider: existingUserByEmail.auth_provider === 'email' ? 'both' : 'google',
						name: googleUser.name,
						picture: googleUser.picture
					})
					.where('id', '=', existingUserByEmail.id)
					.execute();
				
				return auth.transformDatabaseUser(existingUserByEmail);
			}

			// Try to link to existing account (legacy users)
			const linkedUser = await linkGoogleToExistingAccount(googleUser.sub, (googleUser.email ?? ''));
			if (linkedUser) {
				return auth.transformDatabaseUser(linkedUser);
			}
			
			// No existing user found, create new one
			try {
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
			} catch (createError) {
				console.error('Error creating user:', createError);
				
				// If creation fails due to duplicate key, try to find existing user
				if (createError instanceof LuciaError && createError.message === 'AUTH_DUPLICATE_KEY_ID') {
					// Try to find the user by Google key one more time
					try {
						const retryKey = await auth.useKey('google', googleUser.sub, null);
						const retryUser = await auth.getUser(retryKey.userId);
						return retryUser;
					} catch (retryError) {
						// Still can't find user, check if this is another orphaned key case
						if (retryError instanceof LuciaError && retryError.message === 'AUTH_INVALID_USER_ID') {
							console.log('Found another orphaned Google key during retry. Cleaning up...');
							
							// Delete the orphaned key and try creating user again
							await db
								.deleteFrom('user_key')
								.where('id', '=', `google:${googleUser.sub}`)
								.execute();
							
							// Try creating the user one more time
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
						}
						
						// Still can't find user, this is an unexpected state
						console.error('Could not find user after duplicate key error:', retryError);
						throw new Error('Authentication failed - please try logging in instead');
					}
				}

				throw createError; // Re-throw if it's not a duplicate key error
			}
		};

		const user = await getUser();

		const session = await auth.createSession({
			userId: user.userId,
			attributes: {}
		});
		locals.auth.setSession(session);
	} catch (e) {
		console.error({ e });
		
		// Provide more specific error messaging
		const errorMessage = e instanceof Error ? e.message : String(e);
		if (errorMessage.includes('AUTH_DUPLICATE_KEY_ID') || errorMessage.includes('Authentication failed')) {
			throw redirect(302, '/login?error=account_exists');
		}
		throw redirect(302, '/login?error=oauth_error');
	}

	throw redirect(302, '/stories');
};