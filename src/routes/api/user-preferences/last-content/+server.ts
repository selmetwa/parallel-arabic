import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request, locals }) => {
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'You must be logged in to update last content' }, { status: 401 });
  }

  const body = await request.json();
  const { 
    last_content_type, 
    last_content_id, 
    last_content_position, 
    last_content_dialect,
    last_content_accessed_at 
  } = body;

  // Validate content type
  const validContentTypes = ['sentences', 'lessons', 'stories', 'vocabulary', 'alphabet', 'review'];
  if (last_content_type && !validContentTypes.includes(last_content_type)) {
    return json({ error: 'Invalid content type' }, { status: 400 });
  }

  // Validate dialect
  const validDialects = ['egyptian-arabic', 'fusha', 'levantine', 'darija'];
  if (last_content_dialect && !validDialects.includes(last_content_dialect)) {
    return json({ error: 'Invalid dialect' }, { status: 400 });
  }

  // Build update object
  const updateData: Record<string, string | number | null> = {
    last_content_accessed_at: last_content_accessed_at || Date.now()
  };
  
  if (last_content_type !== undefined) {
    updateData.last_content_type = last_content_type;
  }
  
  if (last_content_id !== undefined) {
    updateData.last_content_id = last_content_id;
  }
  
  if (typeof last_content_position === 'number') {
    updateData.last_content_position = last_content_position;
  }
  
  if (last_content_dialect !== undefined) {
    updateData.last_content_dialect = last_content_dialect;
  }

  try {
    const { error: updateError } = await supabase
      .from('user')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating last content:', updateError);
      return json({ error: 'Failed to update last content' }, { status: 500 });
    }

    return json({ success: true });
  } catch (e) {
    console.error('Exception updating last content:', e);
    return json({ error: 'Something went wrong' }, { status: 500 });
  }
};

