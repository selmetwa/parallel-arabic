import type { PageServerLoad } from "./$types";
import { supabase } from '$lib/supabaseClient';

const API_URL = 'https://egyptian-arabic-vocab-selmetwa.koyeb.app';

export const load: PageServerLoad = async ({ parent }) => {
  // Get session and subscription status from layout (no DB query for auth needed!)
  const { session, isSubscribed } = await parent();
  const userId = session?.user.id || null;

  // Fetch verb data and user-specific data in parallel
  const [response, tensesViewedResult] = await Promise.all([
    fetch(`${API_URL}/vocab/verbs`),
    userId ? supabase.from('user').select('verb_conjugation_tenses_viewed').eq('id', userId).single() : null
  ]);

  const tensesViewed = tensesViewedResult?.data || null;
  
	const json = await response.json();

  return {
		words: json.slice(2),
    session,  // Use from layout!
    hasActiveSubscription: isSubscribed,  // Use from layout!
    tensesViewed: tensesViewed?.verb_conjugation_tenses_viewed ?? 0,
  };
};