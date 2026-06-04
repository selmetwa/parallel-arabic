import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async ({ parent }) => {
  // Get subscription info from parent layout
  const { isSubscribed, user } = await parent();

  const userId = user?.id ?? null;

  const { data: userData, error } = await supabase
    .from('user')
    .select('verb_conjugation_tenses_viewed')
    .eq('id', userId ?? '')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user conjugation tenses:', error);
  }

  return {
    tensesViewed: userData?.verb_conjugation_tenses_viewed ?? 0,
    isSubscribed,
    user
  };
};
