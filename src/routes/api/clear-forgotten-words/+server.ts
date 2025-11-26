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
    // Clear all forgotten_in_session flags for this user (start new session)
    const { error: updateError } = await supabase
      .from('saved_word')
      .update({ forgotten_in_session: false })
      .eq('user_id', userId)
      .eq('forgotten_in_session', true);

    if (updateError) {
      console.error('Error clearing forgotten words:', updateError);
      return json({ error: 'Failed to clear forgotten words' }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error in clear-forgotten-words endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

