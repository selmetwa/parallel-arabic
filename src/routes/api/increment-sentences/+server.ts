import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ locals }) => {
	// Back to the familiar pattern - but now with Supabase under the hood!
	const session = await locals.auth.validate();

  const userId = session?.user?.id;
  
  // Get current sentences_viewed count
  const { data: userData, error: selectError } = await supabase
    .from('user')
    .select('sentences_viewed')
    .eq('id', userId || '')
    .single();

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Error fetching user sentences:', selectError);
  }

  const newSentencesViewed = (userData?.sentences_viewed ?? 0) + 1;

  // Update the sentences_viewed count
  const { data: result, error: updateError } = await supabase
    .from('user')
    .update({ sentences_viewed: newSentencesViewed })
    .eq('id', userId || '')
    .select();

  if (updateError) {
    console.error('Error updating sentences:', updateError);
  }
  
    console.log("sentences updated: ", {result});

    return json({ sentencesViewed: newSentencesViewed });
}
