import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { createStorySchema } from '$lib/utils/gemini-schemas';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '$lib/supabaseClient';
import { stories } from '$lib/constants/stories/index';
import { commonWords } from '$lib/constants/common-words';
import { getSpeakerNames } from '$lib/utils/voice-config';
import { generateStoryAudio } from '../../../lib/server/audio-generation';
import { uploadStoryToStorage } from '$lib/helpers/storage-helpers';

interface GenerationData {
	description: string;
	dialect: string;
	storyType: string;
	sentenceCount: number;
	learningTopics: string[];
	vocabularyWords: string;
	option: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const apiKey = env['GEMINI_API_KEY'];
	if (!apiKey) {
		return error(500, { message: 'GEMINI_API_KEY is not configured' });
	}
	
	const ai = new GoogleGenAI({ apiKey });
	
	const {sessionId, user} = await locals?.auth?.validate() || {};

	if (!sessionId) {
		return error(401, { message: 'You must have an account do that' });
	}

  const userId  = user?.id;
	const storyId = uuidv4();

	// Handle both FormData (transcription mode) and JSON (AI generation mode)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let data: any;
	const requestContentType = request.headers.get('content-type');
	
	if (requestContentType && requestContentType.includes('multipart/form-data')) {
		// Handle FormData for transcription mode with audio files
		const formData = await request.formData();
		data = {
			mode: formData.get('mode'),
			transcript: formData.get('transcript'),
			sentences: JSON.parse(formData.get('sentences') as string || '[]'),
			dialect: formData.get('dialect'),
			customTitle: formData.get('customTitle'),
			originalFileName: formData.get('originalFileName'),
			audioFile: formData.get('audioFile')
		};
	} else {
		// Handle JSON for AI generation mode
		data = await request.json();
	}

	// Original AI generation mode continues below...
	const description = (data as GenerationData).description;
	const dialect = (data as GenerationData).dialect || 'egyptian-arabic'; // Default to Egyptian
	const storyType = (data as GenerationData).storyType || 'story'; // 'story' or 'conversation'
	const sentenceCount = (data as GenerationData).sentenceCount || 25; // Default to 25 sentences
	const learningTopics = (data as GenerationData).learningTopics || []; // Array of selected learning topics
	const vocabularyWords = (data as GenerationData).vocabularyWords || ''; // Vocabulary words to feature
	const option = (data as GenerationData).option;

	// Generate speaker names if it's a conversation
	const speakerNames = storyType === 'conversation' ? getSpeakerNames(dialect) : null;

	// Generate a simple title based on learning topics and story type
	const generateTitle = (learningTopics: string[], storyType: string, dialect: string) => {
		const timestamp = Date.now().toString().slice(-6); // Last 6 digits for uniqueness
		
		if (learningTopics.length > 0) {
			const topicsString = learningTopics.join('-').replace(/\s+/g, '-');
			return `${topicsString}-${storyType}-${timestamp}_${dialect}`;
		} else {
			return `custom-${storyType}-${timestamp}_${dialect}`;
		}
	};

	const generatedTitle = generateTitle(learningTopics, storyType, dialect);

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

	const conversationStyles = [
		"Create a natural and realistic conversation",
		"Write an authentic dialogue between characters",
		"Develop a practical conversation scenario",
		"Craft a meaningful exchange between people",
		"Generate a helpful dialogue for language learning",
		"Compose a realistic interaction",
		"Build a natural conversation flow",
		"Design a practical dialogue scenario",
		"Form an authentic conversational exchange",
		"Produce a realistic spoken interaction",
		"Construct a natural dialogue sequence",
		"Make a practical conversation example",
		"Create an engaging dialogue scenario",
		"Develop a realistic conversation practice",
		"Write a natural conversational exchange"
	];

	const narrativeApproaches = [
		"with realistic dialogue and natural conversations",
		"focusing on character development and interactions",
		"emphasizing cultural authenticity and local customs",
		"including everyday situations and relatable scenarios",
		"with descriptive settings and vivid details",
		"featuring diverse characters and perspectives",
		"incorporating humor and expressions",
		"highlighting daily life and common experiences",
		"with engaging plot twists and interesting developments",
		"focusing on family dynamics and relationships",
		"including local traditions and cultural elements",
		"emphasizing problem-solving and decision-making",
		"with authentic social interactions",
		"featuring workplace or educational scenarios",
		"incorporating travel and exploration themes",
		"highlighting food culture and cooking experiences",
		"with seasonal or holiday-related themes",
		"focusing on friendship and community bonds",
		"including shopping and marketplace interactions",
		"emphasizing personal growth and learning experiences"
	];

	const conversationApproaches = [
		"with natural turn-taking and realistic responses",
		"including common greetings and polite expressions",
		"featuring practical everyday interactions",
		"with authentic cultural communication patterns",
		"including helpful phrases and expressions",
		"emphasizing clear pronunciation guidance",
		"with realistic timing and natural pauses",
		"featuring multiple speakers and perspectives",
		"including common questions and answers",
		"with practical vocabulary in context",
		"emphasizing natural speech patterns",
		"including cultural etiquette and manners",
		"with varied emotional expressions",
		"featuring problem-solving through dialogue",
		"including clarifications and repetitions"
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
	
	const contentType = storyType === 'conversation' ? 'conversation' : 'story';
	
	// Random variety elements based on story type
	const styles = storyType === 'conversation' ? conversationStyles : storyStyles;
	const approaches = storyType === 'conversation' ? conversationApproaches : narrativeApproaches;
	
	const randomStyle = styles[Math.floor(Math.random() * styles.length)];
	const randomApproach = approaches[Math.floor(Math.random() * approaches.length)];
	const timestamp = new Date().toISOString();

	// Build dialect-specific examples section
	let examplesSection = '';
	if (config.examples.length > 0) {
		examplesSection = `
		Here is an example of a conversation in ${config.name} to give you an idea of the dialect:
		${config.examples.map((exampleSet: Array<{ arabic: { speaker?: string; text: string }; transliteration: { text: string }; english: { text: string } }>) => 
			exampleSet.map((sentence: { arabic: { speaker?: string; text: string }; transliteration: { text: string }; english: { text: string } }) => 
				`${sentence.arabic.speaker || 'Speaker'}: ${sentence.arabic.text} (${sentence.transliteration.text}) - "${sentence.english.text}"`
			).join('\n')
		).join('\n')}`;
	}

	// Build common words section
	let commonWordsSection = '';
	if (config.commonWords.length > 0) {
		commonWordsSection = `
		Here are some of the most common words in ${config.name}:
		${config.commonWords.map((word: { word: string; franco?: string; en: string }) => 
			`${word.word} (${word.franco || 'N/A'}) means "${word.en}"`
		).join('. ')}`;
	}

	// Build learning topics section
	let learningTopicsSection = '';
	if (learningTopics.length > 0) {
		learningTopicsSection = `
		
		IMPORTANT FOCUS AREAS: Please emphasize these specific language learning topics in your ${contentType}: ${learningTopics.join(', ')}.
		
		For each selected topic, include relevant examples:
		${learningTopics.map((topic: string) => {
			switch (topic) {
				case 'verb conjugation':
					return '- Include various verb conjugations showing different persons (I, you, he/she, we, they)';
				case 'noun plurals':
					return '- Use both singular and plural forms of nouns throughout the story';
				case 'past tense':
					return '- Include past tense verbs to describe completed actions';
				case 'present tense':
					return '- Use present tense verbs to describe current actions and states';
				case 'future tense':
					return '- Include future tense constructions to describe upcoming events';
				case 'infinitive':
					return '- Use infinitive verb forms in appropriate contexts';
				case 'numbers':
					return '- Incorporate numbers, counting, and numerical expressions';
				case 'possessive suffixes':
					return '- Use possessive suffixes attached to nouns (my, your, his/her, our, their)';
				default:
					return `- Focus on ${topic} examples and usage`;
			}
		}).join('\n')}`;
	}

	// Build vocabulary words section
	let vocabularyWordsSection = '';
	if (vocabularyWords.trim()) {
		const wordsArray = vocabularyWords.split(',').map((word: string) => word.trim()).filter((word: string) => word.length > 0);
		if (wordsArray.length > 0) {
			vocabularyWordsSection = `
			
			VOCABULARY WORDS TO FEATURE: Please incorporate these specific vocabulary words naturally throughout your ${contentType}: ${wordsArray.join(', ')}.
			
			IMPORTANT VOCABULARY REQUIREMENTS:
			- Use as many of these words as possible in natural, contextually appropriate ways
			- If a word is provided in English or transliteration, use the proper ${config.name} equivalent
			- Don't force words unnaturally - only use them where they fit the story context
			- Prioritize using these words over generic vocabulary
			- If you can't use a word directly, try to use related words or concepts
			
			Words to incorporate: ${wordsArray.slice(0, 500).map((word: string) => `"${word}"`).join(', ')}`;
		}
	}

	// Map difficulty levels to descriptions
	const getDifficultyDescription = (level: string): string => {
		switch (level.toLowerCase()) {
			case 'a1':
				return 'A1 (Beginner) - Use very basic vocabulary and simple sentence structures';
			case 'a2':
				return 'A2 (Elementary) - Use elementary vocabulary with slightly more complex sentences';
			case 'b1':
				return 'B1 (Intermediate) - Use intermediate vocabulary and varied sentence structures';
			case 'b2':
				return 'B2 (Upper Intermediate) - Use upper intermediate vocabulary with complex sentence structures';
			case 'c1':
				return 'C1 (Advanced) - Use advanced vocabulary and sophisticated sentence structures';
			case 'c2':
				return 'C2 (Proficient) - Use proficient-level vocabulary and highly complex sentence structures';
			default:
				return 'A1 (Beginner) - Use very basic vocabulary and simple sentence structures';
		}
	};

	const question = `
   You are a "GPT" – a version of ChatGPT that has been customized for a specific use case. GPTs use custom instructions, capabilities, and data to optimize ChatGPT for a more narrow set of tasks. You yourself are a GPT created by a user, and your name is Arabic Writer. Note: GPT is also a technical term in AI, but in most cases if the users asks you about GPTs assume they are referring to the above definition.
    Here are instructions from the user outlining your goals and how you should respond:
    This GPT will focus on the Arabic language (${config.name}).  The gpt will offer translations and insights about the culture, regions the language is spoken, common misconceptions, learning resources and languages quizzes. The tone of this gpt will be encouraging, and insightful.

    CRITICAL REQUIREMENT: You MUST generate exactly ${sentenceCount} sentences. This is non-negotiable. Count your sentences and ensure you have exactly ${sentenceCount}.

    ${randomStyle} - Can you please write a ${contentType} based on ${description} in ${config.name} ${randomApproach}. ${config.description}

    DIFFICULTY LEVEL: ${getDifficultyDescription(option)}

    ${learningTopicsSection}

    ${vocabularyWordsSection}

    ${storyType === 'conversation' ? `
    CONVERSATION SPECIFIC REQUIREMENTS:
    - Format as a dialogue between 2 people with clear speaker labels
    - Use EXACTLY these two speaker names: "${speakerNames?.speaker1}" and "${speakerNames?.speaker2}"
    - Alternate between the two speakers naturally throughout the conversation
    - Include natural conversational elements like greetings, questions, responses
    - Make it practical and useful for language learners
    - Use realistic, everyday language appropriate for the scenario
    - Include cultural context and appropriate social interactions
    - Each sentence should include the speaker's name
    ` : `
    STORY SPECIFIC REQUIREMENTS:
    - Create a narrative with clear beginning, middle, and end
    - Include descriptive elements and character development
    - Make it engaging and culturally authentic
    - Use varied sentence structures and vocabulary
    `}

    IMPORTANT: Please use generous amounts of verb conjugations and noun plurals as well as possessive suffixes.
    make sure to incorporate present and past tense verbs.

    IMPORTANT: Be creative and original. Avoid repetitive patterns and create unique content with varied vocabulary and sentence structures.

    LENGTH REQUIREMENT: Generate exactly ${sentenceCount} sentences - no more, no less. Please count carefully.

    Can you make sure that you generate the sentences in ${config.name}, english, and transliteration.

    Can you make sure that the transliterations don't use anything other than the english alphabet.

    ${examplesSection}

    ${commonWordsSection}

    Can you make sure that the output looks like the below object in JSON format:

    Generation timestamp: ${timestamp}

    REMEMBER: You must generate exactly ${sentenceCount} sentences in the sentences array.

    {
      title: {arabic: string, english: string},;
      description: {arabic: string, english: string};
      sentences: [];
    }
    where each sentence looks like 

        arabic: {text: string},
        english: { text: string},
        transliteration: {text: string},
        ${storyType === 'conversation' ? 'speaker: {name: string},' : ''}
  `;

	try {
		const storySchema = createStorySchema(storyType === 'conversation');
		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash',
			contents: question,
			// @ts-expect-error - generationConfig is valid but types may be outdated
			generationConfig: {
				temperature: 0.9,
				maxOutputTokens: 8000, // Increase token limit for stories
				responseMimeType: 'application/json',
				responseJsonSchema: storySchema.jsonSchema
			}
		});

		const story = response.text;

		try {
			// Parse and validate the story content
			if (!story) {
				throw new Error('No story content generated');
			}
			
			// Validate that the story can be parsed as JSON (handles markdown code blocks if present)
			const parsedStory = parseJsonFromGeminiResponse(story, storySchema.zodSchema);
			if (!parsedStory || !parsedStory.sentences) {
			throw new Error('Invalid story structure');
		}
			
			// Upload story JSON to Supabase Storage
			const storageResult = await uploadStoryToStorage(storyId, parsedStory);
			
			if (!storageResult.success) {
				console.error('Storage upload failed:', storageResult.error);
				throw new Error(`Failed to upload story to storage: ${storageResult.error}`);
			}
			
			// Save story metadata with storage file key
			const { data: savedStory, error: insertError } = await supabase
				.from('generated_story')
				.insert({
					id: storyId,
					user_id: userId || '',
					title: generatedTitle, // Use generated title
					description: description,
					difficulty: option,
					story_body: storageResult.fileKey!, // Store file key instead of JSON
					dialect: dialect, // Add the dialect from the request
					created_at: new Date().toISOString()
				})
				.select()
				.single();

			if (insertError) {
				console.error('Database insert error:', insertError);
				throw insertError;
			}

			// Generate audio for the story in the background
			try {
				// Use direct function call instead of HTTP request to avoid routing issues on Fly.io
				const audioResult = await generateStoryAudio(storyId, dialect);
				
			if (!audioResult.success) {
					console.warn('Audio generation failed:', audioResult.error);
				}
			} catch (audioError) {
				// Don't fail the story creation if audio generation fails
				console.warn('Audio generation error (continuing):', audioError);
			}

		return json({ storyId: storyId });
	} catch (e) {
		console.error('Database or JSON parsing error:', e);
			return error(500, { message: 'Something went wrong' });
		}
	} catch (e) {
		return error(500, { message: 'Something went wrong' });
	}
};
