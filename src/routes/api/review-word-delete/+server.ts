import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const DELETE: RequestHandler = async ({ request, locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const { saved_word_id } = await request.json();

  if (!saved_word_id) {
    return json({ error: 'saved_word_id is required' }, { status: 400 });
  }

  try {
    // Verify the word belongs to the user before deleting
    const { data: word, error: fetchError } = await supabase
      .from('saved_word')
      .select('id')
      .eq('id', saved_word_id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !word) {
      return json({ error: 'Word not found or unauthorized' }, { status: 404 });
    }

    // Delete the word
    const { error: deleteError } = await supabase
      .from('saved_word')
      .delete()
      .eq('id', saved_word_id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting word:', deleteError);
      return json({ error: 'Failed to delete word' }, { status: 500 });
    }

    return json({
      success: true,
      message: 'Word removed from review successfully'
    });
  } catch (error) {
    console.error('Error in review-word-delete endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

