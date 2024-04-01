// import { db } from '$lib/server/db';
import * as path from 'path';
import { convertStory } from '../../../helpers/convert-to-story';

export const load = async () => {
	// const session = await locals.auth.validate();

  // const storyId = params.id;
  // const story = await db.selectFrom('story').selectAll().where('id', '=', storyId).execute();
  let formattedStory = null;

    // const key = story[0].key;
    // refactor this
    const filePath = path.join("/Users/sherifelmetwally/Desktop/parallel-arabic/src", 'stories', `omar-and-sarah.js`);
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

	return {
    formattedStory: formattedStory,
	};
};