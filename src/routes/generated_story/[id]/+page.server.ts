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

  return { 
    userId,
    story: [story], // Wrap in array to match existing format
    storyData: story // Also provide unwrapped for easier access
  }
};
