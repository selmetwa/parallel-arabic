import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';
import { sections } from '$lib/constants/sections';

const ALLOWED_CATEGORIES = ['most_common', 'most_common_2'];

export const load: PageServerLoad = async ({ url, parent }) => {
  const { isSubscribed } = await parent();

  const dialectFilter = 'egyptian-arabic';
  const categoryFilter = url.searchParams.get('category') || 'all';
  const searchQuery = url.searchParams.get('search') || '';

  // Build query - always restricted to owned categories
  let query = supabase
    .from('word')
    .select('id, arabic_word, english_word, transliterated_word, dialect, category, audio_url, frequency')
    .eq('dialect', 'egyptian-arabic')
    .in('category', ALLOWED_CATEGORIES)
    .order('frequency', { ascending: false, nullsFirst: false });

  if (categoryFilter !== 'all' && ALLOWED_CATEGORIES.includes(categoryFilter)) {
    query = query.eq('category', categoryFilter);
  }

  if (searchQuery) {
    query = query.or(`english_word.ilike.%${searchQuery}%,arabic_word.ilike.%${searchQuery}%,transliterated_word.ilike.%${searchQuery}%`);
  }

  const { data: words, error } = await query;

  if (error) {
    console.error('Error fetching words from database:', error);
    return {
      words: [],
      dialectFilter,
      categoryFilter,
      searchQuery,
      isSubscribed,
      categories: {},
      dialects: []
    };
  }

  const categoriesByDialect = {
    'egyptian-arabic': sections
      .filter(s => ALLOWED_CATEGORIES.includes(s.path))
      .map(s => ({ path: s.path, name: s.name }))
  };

  return {
    words: words || [],
    dialectFilter,
    categoryFilter,
    searchQuery,
    isSubscribed,
    categories: categoriesByDialect,
    dialects: ['egyptian-arabic']
  };
};
