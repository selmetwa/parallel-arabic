import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';
import type { LeaderboardEntry } from '../api/leaderboard/weekly/+server';

export const load: PageServerLoad = async ({ locals }) => {
  const { safeGetSession } = locals;
  const { user } = await safeGetSession();
  const currentUserId = user?.id ?? null;

  const { data: topRows, error } = await supabase
    .from('user')
    .select('id, email, xp_this_week')
    .eq('leaderboard_opt_out', false)
    .gt('xp_this_week', 0)
    .order('xp_this_week', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return { top10: [], currentUser: null };
  }

  const top10: LeaderboardEntry[] = (topRows ?? []).map((row, i) => ({
    rank: i + 1,
    displayName: (row.email ?? '').split('@')[0].slice(0, 14),
    xpThisWeek: row.xp_this_week ?? 0,
    isCurrentUser: row.id === currentUserId
  }));

  let currentUserEntry: { rank: number; xpThisWeek: number } | null = null;
  const currentUserInTop10 = top10.some(e => e.isCurrentUser);

  if (currentUserId && !currentUserInTop10) {
    const { data: cu } = await supabase
      .from('user')
      .select('xp_this_week, leaderboard_opt_out')
      .eq('id', currentUserId)
      .single();

    if (cu && !cu.leaderboard_opt_out && (cu.xp_this_week ?? 0) > 0) {
      const { count } = await supabase
        .from('user')
        .select('*', { count: 'exact', head: true })
        .eq('leaderboard_opt_out', false)
        .gt('xp_this_week', cu.xp_this_week ?? 0);
      currentUserEntry = { rank: (count ?? 0) + 1, xpThisWeek: cu.xp_this_week ?? 0 };
    }
  }

  return { top10, currentUser: currentUserEntry };
};
