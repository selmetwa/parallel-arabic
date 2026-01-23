import type { PageServerLoad } from './$types';
import { sections } from '$lib/constants/sections';
import { darijaSections } from '$lib/constants/darija-sections';
import { levantineSections } from '$lib/constants/levantine-sections';
import { fushaSections } from '$lib/constants/fusha-sections';
import { supabase } from '$lib/supabaseClient';

interface GameProgress {
  id: string;
  dialect: string;
  category: string;
  game_mode: string;
  current_index: number;
  total_questions: number;
  score: number;
  words_to_review: any[];
  question_order: string[];
  status: string;
  started_at: number;
  last_played_at: number;
}

export const load: PageServerLoad = async ({ parent }) => {
  const { isSubscribed, user } = await parent();

  // Get categories based on selected dialect (include count for display)
  const categoriesByDialect = {
    'egyptian-arabic': sections.map(s => ({ path: s.path, name: s.name, count: s.count })),
    'levantine': levantineSections.map(s => ({ path: s.path, name: s.name, count: s.count })),
    'darija': darijaSections.map(s => ({ path: s.path, name: s.name, count: s.count })),
    'fusha': fushaSections.map(s => ({ path: s.path, name: s.name, count: s.count }))
  };

  // Define all available dialects
  const dialects = ['egyptian-arabic', 'levantine', 'darija', 'fusha'];

  // Fetch in-progress games for logged in users
  let inProgressGames: GameProgress[] = [];
  if (user?.id) {
    const { data: games } = await supabase
      .from('game_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .order('last_played_at', { ascending: false });

    inProgressGames = games || [];
  }

  // Create a lookup for category names
  const categoryNameLookup: Record<string, Record<string, string>> = {
    'egyptian-arabic': Object.fromEntries(sections.map(s => [s.path, s.name])),
    'levantine': Object.fromEntries(levantineSections.map(s => [s.path, s.name])),
    'darija': Object.fromEntries(darijaSections.map(s => [s.path, s.name])),
    'fusha': Object.fromEntries(fushaSections.map(s => [s.path, s.name]))
  };

  return {
    isSubscribed,
    user,
    categories: categoriesByDialect,
    dialects,
    inProgressGames,
    categoryNameLookup
  };
};
