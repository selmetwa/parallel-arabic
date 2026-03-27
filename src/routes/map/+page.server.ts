import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async ({ parent }) => {
  const { session, user } = await parent();

  if (!session || !user) {
    throw redirect(302, '/login');
  }

  const { data: savedWords, error } = await supabase
    .from('saved_word')
    .select(`
      id,
      arabic_word,
      english_word,
      transliterated_word,
      dialect,
      word:word_id (
        category
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved words for map:', error);
    return { session, user, words: [] };
  }

  const words = (savedWords || []).map((w: any) => ({
    id: w.id,
    arabic: w.arabic_word,
    english: w.english_word,
    transliteration: w.transliterated_word,
    dialect: w.dialect || 'egyptian-arabic',
    category: w.word?.category || 'Uncategorized',
  }));

  return { session, user, words };
};
