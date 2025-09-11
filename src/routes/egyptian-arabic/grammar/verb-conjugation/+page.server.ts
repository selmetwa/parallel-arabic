import type { PageServerLoad } from "./$types";
import { db } from '$lib/server/db';

const API_URL = 'https://egyptian-arabic-vocab-selmetwa.koyeb.app';

export const load: PageServerLoad = async ({ parent }) => {
  // Get session and subscription status from layout (no DB query for auth needed!)
  const { session, isSubscribed } = await parent();
  const userId = session?.user.userId || null;

  // Fetch verb data and user-specific data in parallel
  const [response, tensesViewed] = await Promise.all([
    fetch(`${API_URL}/vocab/verbs`),
    userId ? db.selectFrom('user').select('verb_conjugation_tenses_viewed').where('id', '=', userId).executeTakeFirst() : null
  ]);
  
	const json = await response.json();

  return {
		words: json.slice(2),
    session,  // Use from layout!
    hasActiveSubscription: isSubscribed,  // Use from layout!
    tensesViewed: tensesViewed?.verb_conjugation_tenses_viewed ?? 0,
  };
};