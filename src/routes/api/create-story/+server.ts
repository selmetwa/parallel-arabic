import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../lib/server/db';
import { stories } from '$lib/constants/stories/index';
import { commonWords } from '$lib/constants/common-words';

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
	const dialect = data.dialect || 'egyptian-arabic'; // Default to Egyptian

	// Add variety to story creation prompts
	const storyStyles = [
		"Create a unique and engaging story",
		"Write an original and captivating story", 
		"Develop a creative and interesting story",
		"Craft a distinctive and compelling story",
		"Generate a fresh and imaginative story",
		"Compose an innovative and varied story",
		"Build a dynamic and entertaining story",
		"Design an engaging and original story",
		"Form a creative and diverse story",
		"Produce a vibrant and unique story",
		"Construct an authentic and varied story",
		"Make a compelling and distinctive story",
		"Create a rich and immersive story",
		"Develop an engaging and authentic story",
		"Write a creative and memorable story"
	];

	const narrativeApproaches = [
		"with realistic dialogue and natural conversations",
		"focusing on character development and interactions",
		"emphasizing cultural authenticity and local customs",
		"including everyday situations and relatable scenarios",
		"with descriptive settings and vivid details",
		"featuring diverse characters and perspectives",
		"incorporating Egyptian humor and expressions",
		"highlighting daily life and common experiences",
		"with engaging plot twists and interesting developments",
		"focusing on family dynamics and relationships",
		"including local traditions and cultural elements",
		"emphasizing problem-solving and decision-making",
		"with authentic Egyptian social interactions",
		"featuring workplace or educational scenarios",
		"incorporating travel and exploration themes",
		"highlighting food culture and cooking experiences",
		"with seasonal or holiday-related themes",
		"focusing on friendship and community bonds",
		"including shopping and marketplace interactions",
		"emphasizing personal growth and learning experiences"
	];

	// Dialect-specific configurations
	const dialectConfigs = {
		'egyptian-arabic': {
			name: 'EGYPTIAN ARABIC',
			description: 'Please only use words that are commonly used in the Egyptian dialect, not in modern standard Arabic or other dialects.',
			examples: [
				stories['at-the-barbers'].story.sentences.slice(0, 5),
				stories['at-the-fruit-vendor'].story.sentences.slice(0, 5)
			],
			commonWords: commonWords.slice(0, 500)
		},
		'fusha': {
			name: 'MODERN STANDARD ARABIC (FUSHA)',
			description: 'Please use formal Modern Standard Arabic as used in news, literature, and official communications. Avoid colloquial expressions.',
			examples: [], // No pre-built examples for Fusha yet
			commonWords: [] // No specific word list for Fusha yet
		},
		'levantine': {
			name: 'LEVANTINE ARABIC',
			description: 'Please use Levantine Arabic dialect as spoken in Syria, Lebanon, Palestine, and Jordan. Use natural conversational Levantine expressions.',
			examples: [], // No pre-built examples for Levantine yet
			commonWords: [] // No specific word list for Levantine yet
		},
		'darija': {
			name: 'MOROCCAN DARIJA',
			description: 'Please use Moroccan Darija dialect as spoken in Morocco. Use natural conversational Moroccan Arabic expressions and vocabulary.',
			examples: [], // No pre-built examples for Darija yet
			commonWords: [] // No specific word list for Darija yet
		},
		'iraqi': {
			name: 'IRAQI ARABIC',
			description: 'Please use Iraqi Arabic dialect as spoken in Iraq. Use natural conversational Iraqi expressions and vocabulary.',
			examples: [], // No pre-built examples for Iraqi yet
			commonWords: [] // No specific word list for Iraqi yet
		},
		'khaleeji': {
			name: 'KHALEEJI ARABIC',
			description: 'Please use Khaleeji Arabic dialect as spoken in the Gulf states (UAE, Saudi Arabia, Kuwait, Bahrain, Qatar, Oman). Use natural conversational Gulf Arabic expressions and vocabulary.',
			examples: [], // No pre-built examples for Khaleeji yet
			commonWords: [] // No specific word list for Khaleeji yet
		}
	} as const;

	type DialectKey = keyof typeof dialectConfigs;
	const validDialect = dialect as DialectKey;
	const config = dialectConfigs[validDialect] || dialectConfigs['egyptian-arabic'];
	
	// Random variety elements
	const randomStyle = storyStyles[Math.floor(Math.random() * storyStyles.length)];
	const randomApproach = narrativeApproaches[Math.floor(Math.random() * narrativeApproaches.length)];
	const timestamp = new Date().toISOString();

	// Build dialect-specific examples section
	let examplesSection = '';
	if (config.examples.length > 0) {
		examplesSection = `
		Here is an example of a conversation in ${config.name} to give you an idea of the dialect:
		${config.examples.map((exampleSet: any) => 
			exampleSet.map((sentence: any) => 
				`${sentence.arabic.speaker}: ${sentence.arabic.text} (${sentence.transliteration.text}) - "${sentence.english.text}"`
			).join('\n')
		).join('\n')}`;
	}

	// Build common words section
	let commonWordsSection = '';
	if (config.commonWords.length > 0) {
		commonWordsSection = `
		Here are some of the most common words in ${config.name}:
		${config.commonWords.map((word: any) => 
			`${word.word} (${word.franco}) means "${word.en}"`
		).join('. ')}`;
	}

	const question = `
   You are a "GPT" – a version of ChatGPT that has been customized for a specific use case. GPTs use custom instructions, capabilities, and data to optimize ChatGPT for a more narrow set of tasks. You yourself are a GPT created by a user, and your name is Egyptian Arabic. Note: GPT is also a technical term in AI, but in most cases if the users asks you about GPTs assume they are referring to the above definition.
    Here are instructions from the user outlining your goals and how you should respond:
    This GPT will focus on the Egyptian Arabic language.  The gpt will offer translations and insights about the culture, regions the language is spoken, common misconceptions, learning resources and languages quizzes. The tone of this gpt will be encouraging, and insightful.

    CRITICAL REQUIREMENT: You MUST generate exactly 25 sentences. This is non-negotiable. Count your sentences and ensure you have exactly 25.

    ${randomStyle} - Can you please write a story based on ${description} in ${config.name} ${randomApproach}. ${config.description}

    IMPORTANT: Be creative and original. Avoid repetitive patterns and create unique storylines with varied vocabulary and sentence structures.

    STORY LENGTH REQUIREMENT: Generate exactly 25 sentences - no more, no less. Please count carefully.

    Can you make sure that you generate the sentences in ${config.name}, english, and transliteration.

    Can you make sure that the transliterations don't use anything other than the english alphabet.

    Can you make the sentence approachable for a ${data.option} learner

    ${examplesSection}

    ${commonWordsSection}

    Can you make sure that the output looks like the below object in JSON format:

    Generation timestamp: ${timestamp}

    REMEMBER: You must generate exactly 25 sentences in the sentences array.

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
			model: 'gpt-4o-mini',
			// Higher creativity parameters to ensure full generation and variety
			temperature: 0.9,  // Higher creativity for full story generation
		});

		const story = completion.choices[0].message.content;

		try {
			// Parse and validate the story content
			if (!story) {
				throw new Error('No story content generated');
			}
			
			// Validate that the story can be parsed as JSON
			const parsedStory = JSON.parse(story);
			if (!parsedStory || !parsedStory.sentences) {
				throw new Error('Invalid story structure');
			}
			
			await db
				.insertInto('generated_story')
				.values({
					id: storyId,
					user_id: userId || '',
					title: data.title,
					description: data.description,
					difficulty: data.option,
					story_body: story, // Now guaranteed to be a string
					created_at: new Date().getTime()
				})
				.executeTakeFirst();

			return json({ storyId: storyId });
		} catch (e) {
			console.error('Database or JSON parsing error:', e);
			return error(500, { message: 'Something went wrong' });
		}
	} catch (e) {
		return error(500, { message: 'Something went wrong' });
	}
};
