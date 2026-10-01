import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { checkUserSubscription } from '$lib/helpers/subscription';
import { isPaywalled } from '$lib/server/paywall-experiment';

// Only the hard paywall group lands here (see the root layout's load).
// Anyone else who opens the URL goes back into the app.
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	if (!isPaywalled(locals.user, checkUserSubscription(locals.user))) redirect(303, '/');
};
