import { getUserHasActiveSubscription } from "$lib/helpers/get-user-has-active-subscription";
import { db } from '$lib/server/db';

export const load = async ({ locals }) => {
	const session = await locals.auth.validate();
	const userId = session && session.user.userId || null;

	const hasActiveSubscription = await getUserHasActiveSubscription(userId ?? "");
	const sentencesViewed = await db.selectFrom('user').select('sentences_viewed').where('id', '=', userId ?? '').executeTakeFirst();

	return {
		session,
		isSubscribed: hasActiveSubscription,
		sentencesViewed: sentencesViewed?.sentences_viewed ?? 0
	};
}; 