// import { redirect } from '@sveltejs/kit';
// import { googleAuth } from '$lib/server/lucia';
// import type { RequestHandler } from './$types';
// import { dev } from '$app/environment';

// export const GET: RequestHandler = async ({ cookies }) => {
// 	const [authUrl, state] = await googleAuth.getAuthorizationUrl();
// 	cookies.set('google_oauth_state', state, {
// 		httpOnly: true,
// 		secure: !dev,
// 		path: '/',
// 		maxAge: 60 * 60
// 	});
// 	throw redirect(302, authUrl);
// };