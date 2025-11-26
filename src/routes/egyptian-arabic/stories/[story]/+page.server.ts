import { stories } from '$lib/constants/stories/index';
import { trackActivitySimple } from '$lib/helpers/track-activity';

export const load = async ({ params, parent, locals }) => {
  // Get subscription status from layout (no DB query needed!)
  const { isSubscribed, user } = await parent();
  
  // Track story view (non-blocking)
  if (user?.id) {
    trackActivitySimple(user.id, 'story', 1).catch(err => {
      console.error('Error tracking story view:', err);
    });
  }
  
  return {
    isPaywalled: stories[params.story].isPaywalled,
    title: stories[params.story].story.title,
    sentences: stories[params.story].story.sentences,
    audio: stories[params.story].story.audio ?? undefined,
    description: stories[params.story].description,
    hasActiveSubscription: isSubscribed  // Use from layout!
  }
};