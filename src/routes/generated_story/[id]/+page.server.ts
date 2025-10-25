import { error } from '@sveltejs/kit';
import { getStoryById } from '$lib/helpers/story-helpers';

export const load = async ({ params, locals }) => {
  const session = await locals.auth.validate();
  const userId = session && session.user.id || null;
  
  const storyResult = await getStoryById(params.id);

  if (!storyResult.success || !storyResult.story) {
    console.error('Story not found:', storyResult.error);
    throw error(404, 'Story not found');
  }

  const story = storyResult.story;

  return { 
    userId,
    story: [story], // Wrap in array to match existing format
    storyData: story // Also provide unwrapped for easier access
  }
};
