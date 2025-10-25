import { supabase } from '$lib/supabaseClient';
import { getStoriesByDialect } from '$lib/helpers/story-helpers';

export const load = async ({ parent }) => {
  // Get subscription status from layout (no DB query for auth needed!)
  const { isSubscribed } = await parent();
  
  // Fetch generated stories with full content from storage
  const storiesResult = await getStoriesByDialect('egyptian-arabic');
  
  let user_generated_stories = [];
  if (!storiesResult.success) {
    console.error('Error fetching egyptian-arabic stories:', storiesResult.error);
  } else {
    user_generated_stories = storiesResult.stories || [];
  }

  console.log('user_generated_stories count:', user_generated_stories.length)
  return {
    hasActiveSubscription: isSubscribed,  // Use from layout!
    user_generated_stories: user_generated_stories || []
  }
};