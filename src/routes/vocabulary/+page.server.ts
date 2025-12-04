import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';
import { sections } from '$lib/constants/sections';
import { darijaSections } from '$lib/constants/darija-sections';
import { levantineSections } from '$lib/constants/levantine-sections';
import { fushaSections } from '$lib/constants/fusha-sections';

export const load: PageServerLoad = async ({ url, parent }) => {
  const { isSubscribed } = await parent();

  // Get query parameters for filtering
  const dialectFilter = url.searchParams.get('dialect') || 'all';
  const categoryFilter = url.searchParams.get('category') || 'all';
  const searchQuery = url.searchParams.get('search') || '';

  // Build query
  let query = supabase
    .from('word')
    .select('id, arabic_word, english_word, transliterated_word, dialect, category, audio_url, frequency')
    .order('frequency', { ascending: false, nullsFirst: false });

  // Apply filters
  if (dialectFilter !== 'all') {
    query = query.eq('dialect', dialectFilter);
  }

  if (categoryFilter !== 'all') {
    query = query.eq('category', categoryFilter);
  }

  if (searchQuery) {
    query = query.or(`english_word.ilike.%${searchQuery}%,arabic_word.ilike.%${searchQuery}%,transliterated_word.ilike.%${searchQuery}%`);
  }

  // Fetch all matching words - we'll use intersection observer for rendering
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

  // Get categories based on selected dialect
  const categoriesByDialect = {
    'egyptian-arabic': sections.map(s => ({ path: s.path, name: s.name })),
    'levantine': levantineSections.map(s => ({ path: s.path, name: s.name })),
    'darija': darijaSections.map(s => ({ path: s.path, name: s.name })),
    'fusha': fushaSections.map(s => ({ path: s.path, name: s.name }))
  };

  // Define all available dialects
  const uniqueDialects = ['egyptian-arabic', 'levantine', 'darija', 'fusha'];

  return {
    words: words || [],
    dialectFilter,
    categoryFilter,
    searchQuery,
    isSubscribed,
    categories: categoriesByDialect,
    dialects: uniqueDialects
  };
};
