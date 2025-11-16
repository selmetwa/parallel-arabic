import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  try {
    // Delete all saved words for this user
    const { error: deleteError } = await supabase
      .from('saved_word')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting saved words:', deleteError);
      return json({ error: 'Failed to clear words' }, { status: 500 });
    }

    return json({
      success: true,
      message: 'All words cleared successfully'
    });
  } catch (error) {
    console.error('Error in clear-all-words endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

