import { error } from '@sveltejs/kit';
import { getStoryById } from '$lib/helpers/story-helpers';
import { trackActivitySimple } from '$lib/helpers/track-activity';

export const load = async ({ params, locals, setHeaders }) => {
  const session = await locals.auth.validate();
  const userId = session && session.user.id || null;
  
  const storyResult = await getStoryById(params.id);

  if (!storyResult.success || !storyResult.story) {
    console.error('Story not found:', storyResult.error);
    throw error(404, 'Story not found');
  }

  // Track story view (non-blocking)
  if (userId) {
    trackActivitySimple(userId, 'story', 1).catch(err => {
      console.error('Error tracking story view:', err);
    });
  }

  // Set cache headers - story content rarely changes
  // Cache for 30 min in browser, 2 hours on CDN
  setHeaders({
    'Cache-Control': 'public, max-age=1800, s-maxage=7200, stale-while-revalidate=3600'
  });

  const story = storyResult.story;

  // Check if user has already completed this story (for XP dedup UI)
  let storyCompleted = false;
  if (userId) {
    const { data: completion } = await locals.supabase
      .from('user_story_completion')
      .select('id')
      .eq('user_id', userId)
      .eq('story_id', story.id)
      .maybeSingle();
    storyCompleted = !!completion;
  }

  return {
    userId,
    story: [story], // Wrap in array to match existing format
    storyData: story, // Also provide unwrapped for easier access
    storyCompleted
  };
};
