import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ locals }) => {
	// Back to the familiar pattern - but now with Supabase under the hood!
	const session = await locals.auth.validate();

  const userId = session?.user?.id;
  
  // Get current verb_conjugation_tenses_viewed count
  const { data: userData, error: selectError } = await supabase
    .from('user')
    .select('verb_conjugation_tenses_viewed')
    .eq('id', userId || '')
    .single();

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Error fetching user tenses:', selectError);
  }

  const newTensesViewed = (userData?.verb_conjugation_tenses_viewed ?? 0) + 1;

  // Update the verb_conjugation_tenses_viewed count
  const { data: result, error: updateError } = await supabase
    .from('user')
    .update({ verb_conjugation_tenses_viewed: newTensesViewed })
    .eq('id', userId || '')
    .select();

  if (updateError) {
    console.error('Error updating tenses:', updateError);
  }
  
    console.log("tenses updated: ", {result});

    return json({ tensesViewed: newTensesViewed });
}
