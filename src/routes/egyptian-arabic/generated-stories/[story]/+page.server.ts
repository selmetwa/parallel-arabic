import { db } from '$lib/server/db';
import { BLOCKED_STORY_IDS } from '$lib/constants/stories/blocked';
import { error } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
  const session = await locals.auth.validate();
  const userId = session && session.user.userId || null;
  console.log({ params });
  const story = await db.selectFrom('generated_story').selectAll().where('id', '=', params.story).execute();

  if (BLOCKED_STORY_IDS.includes(story?.[0]?.id)) {
    throw error(404, 'This story is blocked');
  }

  return { 
    userId,
    story
  }
};