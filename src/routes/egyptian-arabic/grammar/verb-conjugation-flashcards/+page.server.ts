import type { PageServerLoad } from "./$types";
import { getUserHasActiveSubscription } from "$lib/helpers/get-user-has-active-subscription";
import { supabase } from '$lib/supabaseClient';

const API_URL = 'https://egyptian-arabic-vocab-selmetwa.koyeb.app';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  const userId = session && session.user?.id || null;

  const response = await fetch(`${API_URL}/vocab/verbs`);
	const json = await response.json();
  
  const { data: tensesViewedData, error } = await supabase
    .from('user')
    .select('verb_conjugation_tenses_viewed')
    .eq('id', userId ?? '')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user tenses viewed:', error);
  }

  const tensesViewed = tensesViewedData;

  const hasActiveSubscription = await getUserHasActiveSubscription(userId ?? "");

  return {
		words: json.slice(2),
    session,
    hasActiveSubscription,
    tensesViewed: tensesViewed?.verb_conjugation_tenses_viewed ?? 0,
  };
};