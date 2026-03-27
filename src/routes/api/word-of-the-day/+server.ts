import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const GET: RequestHandler = async () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('word_of_the_day')
    .select('id, arabic, transliteration, english, example_egyptian, example_levantine, example_darija, example_fusha, audio_url, display_date')
    .eq('display_date', today)
    .maybeSingle();

  if (error) {
    console.error('Error fetching word of the day:', error);
    return json({ word: null });
  }

  return json({ word: data });
};
