import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import * as path from 'path';
import { convertStory } from '../../../helpers/convert-to-story';

import type { PageServerLoad } from '../../story/[storyId]/$types';

export const load: PageServerLoad = async ({ locals, params }: { locals: any, params: any }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, '/login');

  const storyId = params.id;
  const story = await db.selectFrom('story').selectAll().where('id', '=', storyId).execute();
  let formattedStory = null;

  if (story.length > 0) {
    const key = story[0].key;
    // refactor this
    const filePath = path.join("/Users/sherifelmetwally/Desktop/parallel-arabic/src", 'stories', `${key}.js`);
    try {
      const storyFile = await import(filePath);
      const storyObj = storyFile.story
      formattedStory = convertStory(storyObj);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.error(`File not found: ${filePath}`);
      } else {
        console.error(`Error reading file: ${filePath}`, error);
      }
    }
} else {
    console.log(`No story found for ID ${storyId}`);
}

	return {
		userId: session.user.userId,
		email: session.user.email,
    formattedStory: formattedStory,
    story
	};
};