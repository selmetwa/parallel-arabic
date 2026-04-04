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
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import { getSpeakerNames } from '$lib/utils/voice-config';
import { generateStoryAudio } from '../../../lib/server/audio-generation';
import { uploadStoryToStorage } from '$lib/helpers/storage-helpers';
import { invalidateStoryCaches } from '$lib/server/redis';

interface GenerationData {
	description: string;
	dialect: string;
	storyType: string;
	sentenceCount: number;
	learningTopics: string[];
	vocabularyWords: string;
	option: string;
	useReviewWordsOnly?: boolean;
	reviewWordsSource?: 'all' | 'due-for-review';
	reviewWords?: Array<{ arabic: string; english: string; transliteration: string }>;
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
	const sentenceCount = (data as GenerationData).sentenceCount || 10; // Default to 10 sentences
	const learningTopics = (data as GenerationData).learningTopics || []; // Array of selected learning topics
	const vocabularyWords = (data as GenerationData).vocabularyWords || ''; // Vocabulary words to feature
	const option = (data as GenerationData).option;
	const useReviewWordsOnly = (data as GenerationData).useReviewWordsOnly || false;
	const reviewWords = (data as GenerationData).reviewWords || [];

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

	// Structural opening variants — genuinely different, not synonym-swapping
	const storyOpeningVariants = [
		"Start in the middle of the action — the protagonist is already dealing with their problem in sentence 1. No setup, no background.",
		"Open with dialogue — the very first sentence is a character speaking.",
		"Begin with a specific sensory detail (a smell, a sound, a texture) that immediately grounds the reader in the setting.",
		"Start with an unexpected or surprising discovery that raises an immediate question in the reader's mind.",
		"Open with the protagonist making a difficult decision or realizing something has gone wrong."
	];

	const conversationOpeningVariants = [
		"Open mid-conversation — the speakers are already in the middle of discussing something.",
		"Begin with one speaker asking an unusual or unexpected question.",
		"Start with a misunderstanding or confusion between the two speakers.",
		"Open with one speaker delivering surprising news.",
		"Begin with one speaker asking for help with a specific, concrete problem."
	];

	// Dialect-specific configurations with cultural grounding
	const dialectConfigs = {
		'egyptian-arabic': {
			name: 'EGYPTIAN ARABIC',
			description: 'Please only use words that are commonly used in the Egyptian dialect, not in modern standard Arabic or other dialects.',
			culturalContext: `Settings: Cairo neighborhoods (Zamalek, Mohandeseen, Maadi, Downtown Cairo, Shubra, Heliopolis, Dokki), Alexandria corniche, local transport (tok tok, microbus, metro, yellow taxi), markets (Khan el-Khalili, Ataba, Wekalet el-Balah), institutions (ahwa/coffeehouse, pharmacy, government office, bank, hospital).
Currency: Egyptian pounds (جنيه) — use realistic prices (e.g., a cup of tea is 5-10 pounds, taxi ride is 30-80 pounds).
Food & drink: ful, ta3meya, koshari, feteer, hawawshi, ahwa mazboot/sada/ziyada, karkade, 7Up (classic Egyptian order).
Character archetypes: taxi driver, bawab (doorman), hanut owner, government employee, university student, housewife, street vendor, pharmacist, mechanic.
Dialect flavor words: يعني، خالص، أيوه، معلش، يلا، ماشي، بالظبط، طب، إيه ده، مش كده، أهو، عادي`,
			examples: [
				stories['at-the-barbers'].story.sentences.slice(0, 5),
				stories['at-the-fruit-vendor'].story.sentences.slice(0, 5)
			],
			commonWords: commonWords.slice(0, 500)
		},
		'fusha': {
			name: 'MODERN STANDARD ARABIC (FUSHA)',
			description: 'Please use formal Modern Standard Arabic as used in news, literature, and official communications. Avoid colloquial expressions.',
			culturalContext: `Settings: news studios, universities, conference rooms, official offices, schools, courtrooms, newspapers, international organizations.
Register: formal written Arabic — use complete verb conjugations, proper case endings where natural, classical connectors (حيث، إذ، بينما، غير أن).
Character archetypes: journalist, professor, student, government official, diplomat, author, judge, teacher.
Flavor: include rhetorical questions, formal transitions, and varied sentence lengths to avoid monotony.`,
			examples: [],
			commonWords: []
		},
		'levantine': {
			name: 'LEVANTINE ARABIC',
			description: 'Please use Levantine Arabic dialect as spoken in Syria, Lebanon, Palestine, and Jordan. Use natural conversational Levantine expressions.',
			culturalContext: `Settings: Beirut neighborhoods (Hamra, Gemmayzeh, Achrafieh), Damascus old city, Amman neighborhoods (Abdoun, Jabal Amman), Palestinian towns, Mediterranean coast, mountain villages.
Currency: use context-appropriate currency (Lebanese liras, Jordanian dinars, Syrian pounds).
Food & drink: hummus, falafel, shawarma, manakish, knafeh, jallab, ayran, mate (popular in Syria/Lebanon).
Character archetypes: shop owner, university student, taxi driver, café owner, farmer, family elder, mechanic, school teacher.
Dialect flavor words: هيك، شو، كيفك، مرحبا، يسلمو، معلش، يلا، شو بدك، منيح، هلق، بكرا، إنشالله`,
			examples: [],
			commonWords: []
		},
		'darija': {
			name: 'MOROCCAN DARIJA',
			description: 'Please use Moroccan Darija dialect as spoken in Morocco. Use natural conversational Moroccan Arabic expressions and vocabulary.',
			culturalContext: `Settings: Casablanca neighborhoods (Maarif, Hay Hassani), Marrakech medina and Jemaa el-Fna, Rabat, Fes medina, local hammam, souk, train station (ONCF), café maure.
Currency: Moroccan dirhams (درهم) — use realistic prices (e.g., mint tea is 5-10 dirhams, taxi is 10-20 dirhams).
Food & drink: atay (mint tea), msemen, harira, couscous (especially Friday), briouats, sellou, mahia.
Character archetypes: souk vendor, hammam worker, taxi driver, student, mechanic, café owner, farmer from the countryside visiting the city.
Dialect flavor: mix of Arabic, Berber, and French loanwords — e.g., الطوموبيل، البوليس، كاطيو، واخا، بغيت، مزيان، باغي، دابا، هاد، واش`,
			examples: [],
			commonWords: []
		},
		'iraqi': {
			name: 'IRAQI ARABIC',
			description: 'Please use Iraqi Arabic dialect as spoken in Iraq. Use natural conversational Iraqi expressions and vocabulary.',
			culturalContext: `Settings: Baghdad neighborhoods (Karrada, Mansour, Kadhimiya, Sadr City), Basra port area, Erbil bazaar, Tigris riverside, local chai khana (tea house), government ministry, market.
Currency: Iraqi dinars (دينار) — use realistic prices.
Food & drink: masgouf (grilled fish), quzi, dolma, samoon bread, chai (tea is central to Iraqi social life), gaimer (clotted cream with bread).
Character archetypes: chai seller, market vendor, engineer, teacher, taxi driver, farmer from the south, Kurdish visitor from Erbil.
Dialect flavor words: شلونك، هواية، عدل، چا، لازم، بس، اهواية، گلبي، إيبه، شبيك`,
			examples: [],
			commonWords: []
		},
		'khaleeji': {
			name: 'KHALEEJI ARABIC',
			description: 'Please use Khaleeji Arabic dialect as spoken in the Gulf states (UAE, Saudi Arabia, Kuwait, Bahrain, Qatar, Oman). Use natural conversational Gulf Arabic expressions and vocabulary.',
			culturalContext: `Settings: Dubai Mall, Abu Dhabi corniche, Riyadh's Olaya district, Kuwait souk, Bahrain's Manama, Muscat's Mutrah souk, desert camping (مخيم), diwaniya (sitting room for men), majlis.
Currency: use context-appropriate currency (UAE dirhams, Saudi riyals, Kuwaiti dinars).
Food & drink: kabsa, machboos, harees, luqaimat, gahwa (cardamom coffee — essential to Gulf hospitality), dates (تمر), shawarma.
Character archetypes: Emirati businessman, Saudi student abroad returning home, Kuwaiti diwaniya host, Omani fisherman, expat worker, mall employee, desert guide.
Dialect flavor words: وش، زين، هيه، عيل، وايد، كذا، ليش، إيش، حق، بعدين، إن شاء الله، الله يسلمك`,
			examples: [],
			commonWords: []
		}
	} as const;

	type DialectKey = keyof typeof dialectConfigs;
	const validDialect = dialect as DialectKey;
	const config = dialectConfigs[validDialect] || dialectConfigs['egyptian-arabic'];

	const contentType = storyType === 'conversation' ? 'conversation' : 'story';

	// Pick a structurally distinct opening approach
	const openingVariants = storyType === 'conversation' ? conversationOpeningVariants : storyOpeningVariants;
	const randomOpeningVariant = openingVariants[Math.floor(Math.random() * openingVariants.length)];

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

	// Build review words section (highest priority when useReviewWordsOnly is true)
	let reviewWordsSection = '';
	if (useReviewWordsOnly && reviewWords.length > 0) {
		const wordsList = reviewWords.map((word) => 
			`Arabic: ${word.arabic}, English: ${word.english}, Transliteration: ${word.transliteration}`
		).join('\n');
		
		reviewWordsSection = `
		
		REVIEW WORDS TO INCORPORATE: The following are words the user is actively learning. You should incorporate some of these words naturally throughout your ${contentType}, but you do NOT need to include every single word. Quality and naturalness are more important than quantity.
		
		IMPORTANT GUIDELINES:
		- Select a reasonable subset of words that fit naturally into your ${contentType}
		- Prioritize natural, comprehensible sentences over cramming in all words
		- It's better to use fewer words well than to force all words and create awkward, incomprehensible sentences
		- Aim to include words that work well together contextually
		- If including all words would make the content unnatural or hard to understand, use only those that fit naturally
		
		AVAILABLE REVIEW WORDS (choose a subset that fits naturally):
		${wordsList}
		
		Remember: The goal is to create natural, readable content that helps reinforce learning. Including 5-10 words naturally is better than forcing 20+ words into awkward sentences.`;
	}

	// Build vocabulary words section (only if not using review words only)
	let vocabularyWordsSection = '';
	if (!useReviewWordsOnly && vocabularyWords.trim()) {
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

    CULTURAL CONTEXT FOR THIS DIALECT:
    ${config.culturalContext}

    CRITICAL REQUIREMENT: You MUST generate exactly ${sentenceCount} sentences. This is non-negotiable. Count your sentences and ensure you have exactly ${sentenceCount}.

    Please write a ${contentType} based on "${description}" in ${config.name}. ${config.description}

    OPENING APPROACH: ${randomOpeningVariant}

    DIFFICULTY LEVEL: ${getDifficultyDescription(option)}

    REQUIRED STORY ELEMENTS (all must be present):
    - Protagonist: Give them a specific name, age, occupation, and one clear personality trait — not just a generic "person"
    - Setting: Name a specific place with concrete details (not just "a market" — which market, which neighborhood, what time of day)
    - Conflict or Goal: The protagonist must want something specific or face a concrete obstacle to overcome
    - Turning point: Something must change, be decided, or be discovered before the end
    - Cultural grounding: Include at least 2 specific cultural details (local food, realistic price amounts, place names, social customs)

    FORBIDDEN — Do NOT do any of these:
    - Open with "One day..." / "There was a man/woman who..." / "كان يا ما كان" / generic scene-setting exposition
    - Give characters only generic names (Ahmed, Fatima) with no further identity or personality
    - Write a story where nothing goes wrong or nothing is at stake
    - Use generic settings without naming the specific place
    - Write textbook-perfect dialogue with no personality, hesitations, or natural rhythm
    - Have all characters speak in the same voice and style

    LINGUISTIC AUTHENTICITY:
    - Include natural fillers and hesitations appropriate to the dialect (see cultural context above)
    - Give characters distinct speech patterns — not everyone speaks the same way
    - Use realistic price points and quantities when mentioned
    - Real spoken Arabic includes some repetition, emphasis, and self-correction — don't sanitize it out
    - Specificity rule: prefer concrete nouns over generic ones ("a 1983 Peugeot taxi with a cracked windshield" beats "a car")

    ${learningTopicsSection}

    ${reviewWordsSection}

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
    - Include descriptive elements and distinct character voices
    - Make it engaging and culturally authentic to the dialect region
    - Use varied sentence structures and vocabulary
    `}

    IMPORTANT: Please use generous amounts of verb conjugations and noun plurals as well as possessive suffixes.
    make sure to incorporate present and past tense verbs.

    LENGTH REQUIREMENT: Generate exactly ${sentenceCount} sentences - no more, no less. Please count carefully.

    Can you make sure that you generate the sentences in ${config.name}, english, and transliteration.

    Can you make sure that the transliterations don't use anything other than the english alphabet.

    REQUIRED SECTIONS:
    1. keyVocab: Extract 5-15 key vocabulary words from the story. These should be important words that appear in the story and are worth learning. Each word should have: arabic, english, transliteration.
    2. quiz: Create a short multiple-choice quiz with 3-5 questions based on the story content. Each question should:
       - Have a question in English
       - CRITICAL: If the question asks for the English meaning/translation of an Arabic word/phrase, the options MUST be in English. If the question asks for the Arabic translation of an English word/phrase, the options MUST be in Arabic.
       - Include 2-4 options (only one correct) - language depends on question type as above
       - Include an "optionLanguage" field: "english" if options are in English, "arabic" if options are in Arabic
       - Include a hint with transliteration (if Arabic option) or English explanation (if English option)
       - Test comprehension of the story, vocabulary, or grammar concepts from the story

    Can you make sure that the output looks like the below object in JSON format:

    REMEMBER: You must generate exactly ${sentenceCount} sentences in the sentences array.

    {
      title: {arabic: string, english: string},
      description: {arabic: string, english: string},
      sentences: [],
      keyVocab: [
        {arabic: string, english: string, transliteration: string},
        ...
      ],
      quiz: {
        questions: [
          {
            question: string (in English),
            options: [
              {id: string (unique ID like "opt1", "opt2", etc), text: string (in Arabic OR English depending on question type), isCorrect: boolean},
              ...
            ],
            correctAnswerId: string (must match one option's id),
            optionLanguage: "arabic" | "english" (required - indicates language of options),
            hint: {
              transliteration: string (optional - if Arabic option),
              arabic: string (optional)
            }
          },
          ...
        ]
      }
    }
    where each sentence looks like 

        arabic: {text: string},
        english: {text: string},
        transliteration: {text: string},
        ${storyType === 'conversation' ? 'speaker: {name: string},' : ''}
        wordAlignments: [
          {arabic: string, english: string, transliteration: string},
          ...
        ]

    IMPORTANT: For each sentence, you MUST provide word-by-word alignments in the wordAlignments array.
    Each Arabic word should map to its English meaning and transliteration.
    If one Arabic word translates to multiple English words, combine them (e.g., "I am" for واحد Arabic word).
    The wordAlignments array should have one entry per Arabic word in the sentence.
  `;

	try {
		const storySchema = createStorySchema(storyType === 'conversation');
		const response = await generateContentWithRetry(ai, {
			model: 'gemini-3.1-pro-preview',
			contents: question,
			// @ts-expect-error - generationConfig is valid but types may be outdated
			generationConfig: {
				temperature: 0.8,
				maxOutputTokens: 5000, // Optimized token limit for stories
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

		// Invalidate Redis cache for stories
		await invalidateStoryCaches(storyId, dialect);

		return json({ storyId: storyId });
	} catch (e) {
		console.error('Database or JSON parsing error:', e);
			return error(500, { message: 'Something went wrong' });
		}
	} catch (e) {
		return error(500, { message: 'Something went wrong' });
	}
};
