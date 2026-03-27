import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  xpThisWeek: number;
  isCurrentUser: boolean;
}

export interface LeaderboardResponse {
  top10: LeaderboardEntry[];
  currentUser: { rank: number; xpThisWeek: number } | null;
}

/** Turn an email into a leaderboard display name: "johndoe@..." → "johndoe" (max 14 chars) */
function displayName(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local.length > 14 ? local.slice(0, 14) + '…' : local;
}

export const GET: RequestHandler = async ({ locals }) => {
  const { safeGetSession } = locals;
  const { user } = await safeGetSession();
  const currentUserId = user?.id ?? null;

  // Fetch top 10 visible users (opt-in only, must have earned XP this week)
  const { data: topRows, error: topError } = await supabase
    .from('user')
    .select('id, email, xp_this_week')
    .eq('leaderboard_opt_out', false)
    .gt('xp_this_week', 0)
    .order('xp_this_week', { ascending: false })
    .limit(10);

  if (topError) {
    console.error('Error fetching leaderboard:', topError);
    return json({ top10: [], currentUser: null }, { status: 500 });
  }

  const top10: LeaderboardEntry[] = (topRows ?? []).map((row, i) => ({
    rank: i + 1,
    displayName: displayName(row.email ?? ''),
    xpThisWeek: row.xp_this_week ?? 0,
    isCurrentUser: row.id === currentUserId
  }));

  // If the current user is not in the top 10, fetch their rank separately
  let currentUserEntry: { rank: number; xpThisWeek: number } | null = null;
  const currentUserInTop10 = top10.some(e => e.isCurrentUser);

  if (currentUserId && !currentUserInTop10) {
    const { data: currentUserRow } = await supabase
      .from('user')
      .select('xp_this_week, leaderboard_opt_out')
      .eq('id', currentUserId)
      .single();

    if (currentUserRow && !currentUserRow.leaderboard_opt_out && (currentUserRow.xp_this_week ?? 0) > 0) {
      // Count how many visible users have more XP than the current user
      const { count } = await supabase
        .from('user')
        .select('*', { count: 'exact', head: true })
        .eq('leaderboard_opt_out', false)
        .gt('xp_this_week', currentUserRow.xp_this_week ?? 0);

      currentUserEntry = {
        rank: (count ?? 0) + 1,
        xpThisWeek: currentUserRow.xp_this_week ?? 0
      };
    }
  }

  return json({ top10, currentUser: currentUserEntry } satisfies LeaderboardResponse);
};
