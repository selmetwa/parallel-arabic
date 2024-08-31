import { stories } from '$lib/constants/stories/index';
import { getUserHasActiveSubscription } from "$lib/helpers/get-user-has-active-subscription";

export const load = async ({ params, locals }) => {
  const story = stories[params.story].story

  const session = await locals.auth.validate();
  const userId = session && session.user.userId || null;

  const hasActiveSubscription = await getUserHasActiveSubscription(userId ?? "");

  return {
    isPaywalled: stories[params.story].isPaywalled,
    title: story.title,
    sentences: story.sentences,
    audio: story.audio ?? undefined,
    description: stories[params.story].description,
    hasActiveSubscription
  }
};