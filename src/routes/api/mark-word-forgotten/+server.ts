import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request, locals }) => {
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
    // Mark word as forgotten in session
    const { error: updateError } = await supabase
      .from('saved_word')
      .update({ forgotten_in_session: true })
      .eq('id', saved_word_id)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error marking word as forgotten:', updateError);
      return json({ error: 'Failed to mark word as forgotten' }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error in mark-word-forgotten endpoint:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

