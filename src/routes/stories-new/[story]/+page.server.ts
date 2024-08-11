import { stories } from '$lib/constants/stories/index';

export const load = async ({  params }) => {
  console.log({ params, stories })
  const story = stories[params.story]

  return {
    title: story.title,
    sentences: story.sentences
  }
};