import type { PageServerLoad } from './$types';
import { sections } from '$lib/constants/sections';
import { darijaSections } from '$lib/constants/darija-sections';
import { levantineSections } from '$lib/constants/levantine-sections';
import { fushaSections } from '$lib/constants/fusha-sections';
import { supabase } from '$lib/supabaseClient';
import { QUIZ_FAQS } from '$lib/constants/game-content';
import { GAME_DIALECTS, GAME_THEMES } from '$lib/games/themes';

/** Dialects whose words were seeded by theme rather than imported as sections. */
const THEMED_DIALECTS = ['iraqi', 'khaleeji', 'saudi'] as const;

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
  const categoriesByDialect: Record<string, { path: string; name: string; count: number }[]> = {
    'egyptian-arabic': sections.map(s => ({ path: s.path, name: s.name, count: s.count })),
    'levantine': levantineSections.map(s => ({ path: s.path, name: s.name, count: s.count })),
    'darija': darijaSections.map(s => ({ path: s.path, name: s.name, count: s.count })),
    'fusha': fushaSections.map(s => ({ path: s.path, name: s.name, count: s.count }))
  };

  // Their categories are the game themes; count the seeded words for each.
  const { data: themedWords } = await supabase
    .from('word')
    .select('dialect, category')
    .in('dialect', [...THEMED_DIALECTS]);
  for (const dialect of THEMED_DIALECTS) {
    categoriesByDialect[dialect] = GAME_THEMES.flatMap((theme) => {
      const path = theme.categories[dialect];
      if (!path) return [];
      const count = (themedWords ?? []).filter((w) => w.dialect === dialect && w.category === path).length;
      return count ? [{ path, name: theme.label, count }] : [];
    });
  }

  // Define all available dialects
  const dialects: string[] = [...GAME_DIALECTS];

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
    'fusha': Object.fromEntries(fushaSections.map(s => [s.path, s.name])),
    ...Object.fromEntries(
      THEMED_DIALECTS.map((d) => [d, Object.fromEntries(categoriesByDialect[d].map((c) => [c.path, c.name]))])
    )
  };

  return {
    isSubscribed,
    user,
    categories: categoriesByDialect,
    dialects,
    inProgressGames,
    categoryNameLookup,
    // Surfaced so the layout can emit FAQPage structured data.
    faqs: QUIZ_FAQS
  };
};
