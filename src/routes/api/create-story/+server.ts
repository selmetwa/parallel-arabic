import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../lib/server/db';
import { stories } from '$lib/constants/stories/index';

export const POST: RequestHandler = async ({ request, locals }) => {
	const openai = new OpenAI({ apiKey: env['OPEN_API_KEY'] });
	const data = await request.json();

	const session = await locals.auth.validate();

	if (!session) {
		return error(401, { message: 'You must have an account do that' });
	}

	const userId = session?.user.userId;
	const storyId = uuidv4();

	const description = data.description;
	// const beginner_request =
	// 	data.option === 'beginner'
	// 		? 'Please make the story at least 10 sentences long and use beginner vocabulary'
	// 		: '';
	// const intermediate_request =
	// 	data.option === 'intermediate'
	// 		? 'Please make the story at least 15 sentences long and use intermediate vocabulary'
	// 		: '';
	// const advanced_request =
	// 	data.option === 'advanced'
	// 		? 'Please make the story at least 20 sentences long and use advanced vocabulary'
	// 		: '';

	const question = `
   You are a "GPT" – a version of ChatGPT that has been customized for a specific use case. GPTs use custom instructions, capabilities, and data to optimize ChatGPT for a more narrow set of tasks. You yourself are a GPT created by a user, and your name is Egyptian Arabic. Note: GPT is also a technical term in AI, but in most cases if the users asks you about GPTs assume they are referring to the above definition.
    Here are instructions from the user outlining your goals and how you should respond:
    This GPT will focus on the Egyptian Arabic language.  The gpt will offer translations and insights about the culture, regions the language is spoken, common misconceptions, learning resources and languages quizzes. The tone of this gpt will be encouraging, and insightful.

    Here is an example of a conversation in Egyptian Arabic to give you an idea of the dialect:
    ${stories['at-the-barbers'].story.sentences}
    ${stories['at-the-fruit-vendor'].story.sentences}
    ${stories['at-the-hotel'].story.sentences}
    ${stories['koshary-shop'].story.sentences}
    ${stories['at-the-restaurant'].story.sentences}

    Can you please write a story based on ${description} in EGYPTIAN ARABIC. Please only use words that are commonly used in the Egyptian dialect, not in modern standard Arabic or other dialects.

    Can you make sure that you generate the sentences in EGYPTIAN ARABIC, english, and transliteration.

    Can you make sure that the transliterations don't use anything other than the english alphabet.

    Can you make sure that the output looks like the below object in JSON format:

    Can you make the sentence approachable for a ${data.option} learner
    Can you make the story 10-15 sentences long

    {
      title: {arabic: string, english: string},;
      description: {arabic: string, english: string};
      sentences: [];
    }
    where each sentence looks like 

        arabic: {text: string},
        english: { text: string},
        transliteration: {text: string},
  `;

	try {
		const completion = await openai.chat.completions.create({
			messages: [{ role: 'system', content: question }],
			response_format: { type: 'json_object' },
			model: 'gpt-4o-mini'
		});

		const story = completion.choices[0].message.content;
		console.log({ story });

		try {
			await db
				.insertInto('generated_story')
				.values({
					id: storyId,
					user_id: userId || '',
					title: data.title,
					description: data.description,
					difficulty: data.option,
					story_body: story, // Ensure story_body is a JSON object
					created_at: new Date().getTime()
				})
				.executeTakeFirst();

			console.log({ storyId });
			return json({ storyId: storyId });
		} catch (e) {
			console.log({ e });
			return error(500, { message: 'Something went wrong' });
		}
	} catch (e) {
		console.log({ e });
		return error(500, { message: 'Something went wrong' });
	}
};
