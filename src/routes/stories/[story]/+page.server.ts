import { stories } from '$lib/constants/stories/index';
import { trackActivitySimple } from '$lib/helpers/track-activity';

export const load = async ({ params, parent, locals, setHeaders }) => {
  const { isSubscribed, user } = await parent();

  if (user?.id) {
    trackActivitySimple(user.id, 'story', 1).catch(err => {
      console.error('Error tracking story view:', err);
    });
  }

  setHeaders({
    'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400'
  });

  return {
    isPaywalled: stories[params.story].isPaywalled,
    title: stories[params.story].story.title,
    sentences: stories[params.story].story.sentences,
    audio: stories[params.story].story.audio ?? undefined,
    description: stories[params.story].description,
    hasActiveSubscription: isSubscribed
  }
};
