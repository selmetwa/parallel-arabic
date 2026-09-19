import { error } from '@sveltejs/kit';
import { getStoryById } from '$lib/helpers/story-helpers';
import { trackActivitySimple } from '$lib/helpers/track-activity';

export const load = async ({ params, locals, setHeaders, parent }) => {
  const { isSubscribed } = await parent();
  const session = await locals.auth.validate();
  const userId = session?.user?.id ?? null;

  const storyResult = await getStoryById(params.id);

  if (!storyResult.success || !storyResult.story) {
    console.error('Story not found:', storyResult.error);
    throw error(404, 'Story not found');
  }

  if (userId) {
    trackActivitySimple(userId, 'story', 1).catch(err => {
      console.error('Error tracking story view:', err);
    });
  }

  // Only the logged-out preview is safe to share across visitors in a CDN/shared
  // cache. Logged-in responses carry per-user data (isSubscribed, storyCompleted)
  // and must never be cached publicly, or one user's page gets served to another.
  if (!userId) {
    setHeaders({
      'Cache-Control': 'public, max-age=1800, s-maxage=7200, stale-while-revalidate=3600'
    });
  } else {
    setHeaders({
      'Cache-Control': 'private, no-store'
    });
  }

  const story = storyResult.story;

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
    isSubscribed: isSubscribed ?? false,
    story: [story],
    storyData: story,
    storyCompleted
  };
};
