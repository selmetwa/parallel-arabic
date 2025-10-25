import type { PageServerLoad } from "./$types";
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async ({ parent }) => {
  // Get session and subscription status from layout
  const { session, isSubscribed } = await parent();
  
  // Fetch all videos from all dialects in one query
  const { data: videos, error } = await supabase
    .from('video')
    .select('id, title, description, thumbnail_url, created_at, dialect, user_id')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching videos:', error);
  }

  // Add dialect display names to each video
  const videosWithDialectNames = (videos || []).map(video => ({
    ...video,
    dialect_name: getDialectDisplayName(video.dialect)
  }));
  
  return {
    session,
    isSubscribed,
    hasActiveSubscription: isSubscribed, // Keep for backward compatibility
    videos: videosWithDialectNames
  };
};

// Helper function to get display names for dialects
function getDialectDisplayName(dialect: string) {
  const dialectNames = {
    'egyptian-arabic': 'Egyptian Arabic',
    'darija': 'Moroccan Darija',
    'fusha': 'Modern Standard Arabic',
    'levantine': 'Levantine Arabic',
    'iraqi': 'Iraqi Arabic',
    'khaleeji': 'Khaleeji Arabic'
  };
  
  return dialectNames[dialect as keyof typeof dialectNames] || dialect;
}
