import { stories } from '$lib/constants/stories/index';

export const load = async ({ params, parent }) => {
  // Get subscription status from layout (no DB query needed!)
  const { isSubscribed } = await parent();
  
  return {
    isPaywalled: stories[params.story].isPaywalled,
    title: stories[params.story].story.title,
    sentences: stories[params.story].story.sentences,
    audio: stories[params.story].story.audio ?? undefined,
    description: stories[params.story].description,
    hasActiveSubscription: isSubscribed  // Use from layout!
  }
};