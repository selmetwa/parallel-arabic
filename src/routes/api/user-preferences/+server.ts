import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'You must be logged in to update preferences' }, { status: 401 });
  }

  const body = await request.json();
  const { show_arabic, show_transliteration, show_english, preferred_font_size } = body;

  // Build update object with only provided fields
  const updateData: Record<string, boolean | string> = {};
  
  if (typeof show_arabic === 'boolean') {
    updateData.show_arabic = show_arabic;
  }
  
  if (typeof show_transliteration === 'boolean') {
    updateData.show_transliteration = show_transliteration;
  }
  
  if (typeof show_english === 'boolean') {
    updateData.show_english = show_english;
  }
  
  if (preferred_font_size && ['small', 'medium', 'large'].includes(preferred_font_size)) {
    updateData.preferred_font_size = preferred_font_size;
  }

  if (Object.keys(updateData).length === 0) {
    return json({ error: 'No valid preferences provided' }, { status: 400 });
  }

  try {
    const { error: updateError } = await supabase
      .from('user')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user preferences:', updateError);
      return json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return json({ success: true });
  } catch (e) {
    console.error('Exception updating user preferences:', e);
    return json({ error: 'Something went wrong' }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'You must be logged in to get preferences' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('user')
      .select('show_arabic, show_transliteration, show_english, preferred_font_size, last_content_type, last_content_id, last_content_position, last_content_dialect, last_content_accessed_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user preferences:', error);
      return json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return json(data);
  } catch (e) {
    console.error('Exception fetching user preferences:', e);
    return json({ error: 'Something went wrong' }, { status: 500 });
  }
};

