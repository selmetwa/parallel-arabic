import { v4 as uuidv4 } from 'uuid';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request, locals }) => {
  const data = await request.json();
	const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId) {
    return json({ message: 'You must have an account do that' });
  }

  console.log({
    sessionId,
    data,
    user
  })
  const userId = user.id;
  const wordId = uuidv4();

  const { data: wordExists, error } = await supabase
  .from('saved_word')
  .select('*')
  .eq('arabic_word', data.activeWordObj.arabic)
  .eq('user_id', userId || '');

  if (wordExists?.[0]?.id) {
    return json({ message: 'You have already saved this' });
  }

  try {
    const { data: insertData, error: insertError } = await supabase.from('saved_word').insert([{
      id: wordId,
      user_id: userId ?? '',
      arabic_word: data.activeWordObj.arabic ?? '',
      english_word: data.activeWordObj.english ?? '',
      transliterated_word: data.activeWordObj.transliterated ?? '',
      created_at: new Date().getTime()
    }]).select();

    if (insertError) {
      return json({ message: 'Something went wrong' });
    }

    return json({ message: 'Saved' });
  } catch (e) {
    return error(500, { message: 'Something went wrong' });
  }
}
