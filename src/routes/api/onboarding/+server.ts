import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'You must have an account to onboard' }, { status: 401 });
  }

  const { target_dialect, learning_reason, proficiency_level } = await request.json();

  // Validate inputs
  const validDialects = ['egyptian-arabic', 'fusha', 'levantine', 'darija'];
  const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  if (!target_dialect || !validDialects.includes(target_dialect)) {
    return json({ error: 'Invalid dialect' }, { status: 400 });
  }

  if (!proficiency_level || !validLevels.includes(proficiency_level)) {
    return json({ error: 'Invalid proficiency level' }, { status: 400 });
  }

  if (!learning_reason || typeof learning_reason !== 'string') {
    return json({ error: 'Learning reason is required' }, { status: 400 });
  }

  try {
    const { error: updateError } = await supabase
      .from('user')
      .update({
        target_dialect,
        learning_reason,
        proficiency_level,
        onboarding_completed: true,
        onboarding_completed_at: Date.now()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating onboarding data:', updateError);
      return json({ error: 'Failed to save onboarding data' }, { status: 500 });
    }

    return json({ success: true });
  } catch (e) {
    console.error('Exception updating onboarding data:', e);
    return json({ error: 'Something went wrong' }, { status: 500 });
  }
};

