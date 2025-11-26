import type { PageServerLoad } from "./$types";
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async ({ locals, parent }) => {
  // Get session and subscription info from parent layout
  const { session, isSubscribed, user } = await parent();

  const userId = session && session.user.id || null;

  const { data: userData, error } = await supabase
    .from('user')
    .select('sentences_viewed')
    .eq('id', userId ?? '')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user sentences:', error);
  }

  return {
    sentencesViewed: userData?.sentences_viewed ?? 0,
    isSubscribed,
    user
  };
};
