import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { createLessonSchema, type LessonSchema } from '$lib/utils/gemini-schemas';
import { v4 as uuidv4 } from 'uuid';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import { supabase } from '$lib/supabaseClient';
import { uploadLessonToStorage } from '$lib/helpers/storage-helpers';
import fs from 'fs';
import path from 'path';

interface LessonGenerationData {
	topic: string;
	dialect: string;
	level: 'beginner' | 'intermediate' | 'advanced';
	learningTopics?: string[];
	vocabularyWords?: string;
	subLessonCount?: number;
}

/**
 * Write debug log to file
 */
function writeDebugLog(lessonId: string, logData: Record<string, unknown>) {
	try {
		// Create logs directory if it doesn't exist
		const logsDir = path.join(process.cwd(), 'logs', 'lessons');
		if (!fs.existsSync(logsDir)) {
			fs.mkdirSync(logsDir, { recursive: true });
		}
		
		const logFile = path.join(logsDir, `lesson_${lessonId}_${Date.now()}.json`);
		const logContent = {
			timestamp: new Date().toISOString(),
			lessonId,
			...logData
		};
		
		fs.writeFileSync(logFile, JSON.stringify(logContent, null, 2));
		console.log(`📝 Debug log written to: ${logFile}`);
		return logFile;
	} catch (error) {
		console.error('Failed to write debug log:', error);
		return null;
	}
}

/**
 * Extract all words and sentences from a lesson and save them to the user's review deck
 */
async function saveLessonWordsAndSentences(
	lesson: LessonSchema,
	userId: string,
	dialect: string
): Promise<void> {
	const wordsAndSentences: Array<{
		arabic: string;
		english: string;
		transliteration: string;
	}> = [];

	// Extract words from sub-lesson phrases
	if (lesson.subLessons && Array.isArray(lesson.subLessons)) {
		for (const subLesson of lesson.subLessons) {
			if (subLesson.content?.phrases && Array.isArray(subLesson.content.phrases)) {
				for (const phrase of subLesson.content.phrases) {
					if (phrase.arabic && phrase.english && phrase.transliteration) {
						wordsAndSentences.push({
							arabic: phrase.arabic.trim(),
							english: phrase.english.trim(),
							transliteration: phrase.transliteration.trim()
						});
					}
				}
			}
		}
	}

	// Extract review words
	if (lesson.review?.words && Array.isArray(lesson.review.words)) {
		for (const word of lesson.review.words) {
			if (word.arabic && word.english && word.transliteration) {
				wordsAndSentences.push({
					arabic: word.arabic.trim(),
					english: word.english.trim(),
					transliteration: word.transliteration.trim()
				});
			}
		}
	}

	// Extract review sentences
	if (lesson.review?.sentences && Array.isArray(lesson.review.sentences)) {
		for (const sentence of lesson.review.sentences) {
			if (sentence.arabic && sentence.english && sentence.transliteration) {
				wordsAndSentences.push({
					arabic: sentence.arabic.trim(),
					english: sentence.english.trim(),
					transliteration: sentence.transliteration.trim()
				});
			}
		}
	}

	// Extract words from grammar focus examples
	if (lesson.grammarFocus && Array.isArray(lesson.grammarFocus)) {
		for (const grammar of lesson.grammarFocus) {
			if (grammar.examples && Array.isArray(grammar.examples)) {
				for (const example of grammar.examples) {
					if (example.arabic && example.english && example.transliteration) {
						wordsAndSentences.push({
							arabic: example.arabic.trim(),
							english: example.english.trim(),
							transliteration: example.transliteration.trim()
						});
					}
				}
			}
		}
	}

	// Extract words from pronunciation tips examples
	if (lesson.pronunciationTips && Array.isArray(lesson.pronunciationTips)) {
		for (const tip of lesson.pronunciationTips) {
			if (tip.examples && Array.isArray(tip.examples)) {
				for (const example of tip.examples) {
					if (example.arabic && example.english && example.transliteration) {
						wordsAndSentences.push({
							arabic: example.arabic.trim(),
							english: example.english.trim(),
							transliteration: example.transliteration.trim()
						});
					}
				}
			}
		}
	}

	// Extract words from common mistakes examples
	if (lesson.commonMistakes && Array.isArray(lesson.commonMistakes)) {
		for (const mistake of lesson.commonMistakes) {
			if (mistake.examples && Array.isArray(mistake.examples)) {
				for (const example of mistake.examples) {
					// Add correct examples
					if (example.correct?.arabic && example.correct.english && example.correct.transliteration) {
						wordsAndSentences.push({
							arabic: example.correct.arabic.trim(),
							english: example.correct.english.trim(),
							transliteration: example.correct.transliteration.trim()
						});
					}
					// Add incorrect examples (for learning purposes)
					if (example.incorrect?.arabic && example.incorrect.english && example.incorrect.transliteration) {
						wordsAndSentences.push({
							arabic: example.incorrect.arabic.trim(),
							english: example.incorrect.english.trim(),
							transliteration: example.incorrect.transliteration.trim()
						});
					}
				}
			}
		}
	}

	// Remove duplicates based on Arabic text
	const uniqueWords = new Map<string, typeof wordsAndSentences[0]>();
	for (const item of wordsAndSentences) {
		if (item.arabic && !uniqueWords.has(item.arabic)) {
			uniqueWords.set(item.arabic, item);
		}
	}

	const uniqueArray = Array.from(uniqueWords.values());

	if (uniqueArray.length === 0) {
		console.log('No words/sentences to save from lesson');
		return;
	}

	// Save words/sentences using the same logic as save-sentences endpoint
	const now = Date.now();
	const savedWordsToInsert = [];

	for (const item of uniqueArray) {
		const arabicWord = item.arabic;
		const englishWord = item.english;
		const transliteratedWord = item.transliteration;

		// Check if word already exists in saved_word for this user
		const { data: wordExists } = await supabase
			.from('saved_word')
			.select('id')
			.eq('arabic_word', arabicWord)
			.eq('user_id', userId)
			.maybeSingle();

		// Skip if already exists
		if (wordExists?.id) {
			continue;
		}

		// Try to find the word in the word table to link via word_id
		let wordId: string | null = null;
		if (arabicWord) {
			let wordQuery = supabase
				.from('word')
				.select('id')
				.eq('arabic_word', arabicWord)
				.limit(1);
			
			// If dialect is provided, filter by it
			if (dialect) {
				wordQuery = wordQuery.eq('dialect', dialect);
			}
			
			const { data: wordData } = await wordQuery.maybeSingle();
			if (wordData) {
				wordId = wordData.id;
			}
		}

		// Prepare word for insertion
		savedWordsToInsert.push({
			id: uuidv4(),
			user_id: userId,
			word_id: wordId,
			arabic_word: arabicWord,
			english_word: englishWord,
			transliterated_word: transliteratedWord,
			dialect: dialect,
			ease_factor: 2.5,
			interval_days: 0,
			repetitions: 0,
			next_review_date: null,
			last_review_date: null,
			is_learning: true,
			mastery_level: 0,
			created_at: now
		});
	}

	if (savedWordsToInsert.length === 0) {
		console.log('All words/sentences from lesson already exist in review deck');
		return;
	}

	// Insert words into saved_word table
	const { error: insertError } = await supabase
		.from('saved_word')
		.insert(savedWordsToInsert);

	if (insertError) {
		console.error('Error saving lesson words/sentences:', insertError);
		throw new Error(`Failed to save words/sentences: ${insertError.message}`);
	}

	console.log(`✅ Saved ${savedWordsToInsert.length} words/sentences from lesson to review deck`);
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const apiKey = env['GEMINI_API_KEY'];
	if (!apiKey) {
		return error(500, { message: 'GEMINI_API_KEY is not configured' });
	}
	
	const ai = new GoogleGenAI({ apiKey });
	
	// @ts-expect-error - auth property exists on locals at runtime
	const {sessionId, user} = await locals?.auth?.validate() || {};

	if (!sessionId || !user) {
		return error(401, { message: 'You must have an account to do that' });
	}

	const userId = user.id;
	const lessonId = uuidv4();

	const data = await request.json() as LessonGenerationData;
	const topic = data.topic || '';
	const dialect = data.dialect || 'egyptian-arabic';
	const level = data.level || 'beginner';
	const learningTopics = data.learningTopics || [];
	const vocabularyWords = data.vocabularyWords || '';
	const subLessonCount = data.subLessonCount || 3; // Default to 3 sub-lessons

	// Dialect-specific configurations
	const dialectConfigs = {
		'egyptian-arabic': {
			name: 'EGYPTIAN ARABIC',
			description: 'Please only use words that are commonly used in the Egyptian dialect, not in modern standard Arabic or other dialects.',
		},
		'fusha': {
			name: 'MODERN STANDARD ARABIC (FUSHA)',
			description: 'Please use formal Modern Standard Arabic as used in news, literature, and official communications. Avoid colloquial expressions.',
		},
		'levantine': {
			name: 'LEVANTINE ARABIC',
			description: 'Please use Levantine Arabic dialect as spoken in Syria, Lebanon, Palestine, and Jordan. Use natural conversational Levantine expressions.',
		},
		'darija': {
			name: 'MOROCCAN DARIJA',
			description: 'Please use Moroccan Darija dialect as spoken in Morocco. Use natural conversational Moroccan Arabic expressions and vocabulary.',
		},
	} as const;

	type DialectKey = keyof typeof dialectConfigs;
	const validDialect = dialect as DialectKey;
	const config = dialectConfigs[validDialect] || dialectConfigs['egyptian-arabic'];

	// Build learning topics section
	let learningTopicsSection = '';
	if (learningTopics.length > 0) {
		learningTopicsSection = `
		
		IMPORTANT FOCUS AREAS: Please emphasize these specific language learning topics in your lesson: ${learningTopics.join(', ')}.
		
		For each selected topic, include relevant examples and explanations:
		${learningTopics.map((topic: string) => {
			switch (topic) {
				case 'verb conjugation':
					return `- CRITICAL: Verb conjugation is particularly difficult in Arabic. You MUST provide comprehensive coverage:
  * ALWAYS include the UNCONJUGATED verb (infinitive/base form) FIRST before showing conjugations
  * Show the base form in Arabic, English, and transliteration to give students context
  * Example format: "Base verb: [Arabic] ([English]) - [transliteration]"
  * Include ALL tenses: present tense, past tense, and future tense
  * Include ALL persons with gender distinctions:
    - I (ana) - first person singular
    - You masculine (enta/inta) - second person singular masculine
    - You feminine (enti/inti) - second person singular feminine
    - He (howa/huwa) - third person singular masculine
    - She (heya/hiya) - third person singular feminine
    - We (e7na/na7nu) - first person plural
    - You plural (entum/intum) - second person plural
    - They masculine (homma/hum) - third person plural masculine
    - They feminine (homma/hunna) - third person plural feminine
  * Provide MULTIPLE examples for EACH person in EACH tense
  * Include exercises specifically testing verb conjugation with all forms
  * In grammar focus section, create a comprehensive verb conjugation table showing all forms
  * Make sure to cover both regular and common irregular verbs
  * Include examples showing how verb conjugation changes based on gender and number
  * When presenting verb conjugations, always show: "Base verb → Conjugated form" to help students understand the relationship`;
				case 'noun plurals':
					return '- Use both singular and plural forms of nouns throughout the lesson. Include examples of regular plurals, broken plurals, and dual forms where applicable.';
				case 'past tense':
					return `- Include past tense verbs to describe completed actions
  * Provide examples for ALL persons: I, you (m/f), he, she, we, you (plural), they (m/f)
  * Show gender distinctions in second and third person
  * Include multiple verbs conjugated in past tense
  * Create exercises specifically testing past tense conjugation`;
				case 'present tense':
					return `- Use present tense verbs to describe current actions and states
  * Provide examples for ALL persons: I, you (m/f), he, she, we, you (plural), they (m/f)
  * Show gender distinctions in second and third person
  * Include multiple verbs conjugated in present tense
  * Create exercises specifically testing present tense conjugation`;
				case 'future tense':
					return `- Include future tense constructions to describe upcoming events
  * Provide examples for ALL persons: I, you (m/f), he, she, we, you (plural), they (m/f)
  * Show gender distinctions in second and third person
  * Include multiple verbs conjugated in future tense
  * Create exercises specifically testing future tense conjugation`;
				case 'infinitive':
					return '- Use infinitive verb forms (masdar) in appropriate contexts. Show how infinitives are formed and used.';
				case 'numbers':
					return '- Incorporate numbers, counting, and numerical expressions. Include cardinal and ordinal numbers.';
				case 'possessive suffixes':
					return '- Use possessive suffixes attached to nouns (my, your, his/her, our, their). Show all forms with examples.';
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
			
			VOCABULARY WORDS TO FEATURE: Please incorporate these specific vocabulary words naturally throughout your lesson: ${wordsArray.join(', ')}.
			
			IMPORTANT VOCABULARY REQUIREMENTS:
			- Use as many of these words as possible in natural, contextually appropriate ways
			- If a word is provided in English or transliteration, use the proper ${config.name} equivalent
			- Don't force words unnaturally - only use them where they fit the lesson context
			- Prioritize using these words over generic vocabulary
			- Include these words in the review section as well
			
			Words to incorporate: ${wordsArray.slice(0, 500).map((word: string) => `"${word}"`).join(', ')}`;
		}
	}

	const levelDescription = {
		beginner: 'Beginner level - Use very basic vocabulary, simple sentence structures, and fundamental grammar concepts. Focus on essential everyday phrases and common words.',
		intermediate: 'Intermediate level - Use intermediate vocabulary with more complex sentence structures. Include varied grammar concepts and practical communication skills.',
		advanced: 'Advanced level - Use advanced vocabulary with sophisticated sentence structures. Include complex grammar concepts and nuanced language usage.'
	};

	const question = `
	You are an expert Arabic language teacher creating comprehensive lessons for students learning ${config.name}.
	
	CRITICAL REQUIREMENTS:
	- Generate a complete lesson with exactly ${subLessonCount} sub-lessons
	- Each sub-lesson must have at least 1 exercise
	- Include exactly 10 review words and 5 review sentences that incorporate those words
	- The review sentences must use the review words naturally
	- Include a comprehensive quiz at the end with 5-8 questions testing the entire lesson
	- All content must be in ${config.name}: ${config.description}
	
	LESSON TOPIC: ${topic || 'General Arabic language learning'}
	
	LEVEL: ${levelDescription[level]}
	
	${learningTopicsSection}
	
	${vocabularyWordsSection}
	
	${learningTopics.includes('verb conjugation') ? `
	CRITICAL VERB CONJUGATION REQUIREMENTS (This is particularly difficult in Arabic - be VERY thorough):
	- Verb conjugation is one of the most challenging aspects of Arabic learning
	- You MUST provide comprehensive, systematic coverage of verb conjugation
	- CRITICAL: ALWAYS include the UNCONJUGATED verb (infinitive/base form) FIRST before showing any conjugations
	  * Show the base form in Arabic, English, and transliteration
	  * Format: "Base verb: [Arabic] ([English]) - [transliteration]"
	  * This gives students essential context to understand how the verb conjugates
	  * Example: "Base verb: كتب (to write) - katab" before showing "I write", "you write", etc.
	- For EACH verb you introduce, provide conjugation examples for:
	  * ALL tenses: Present tense, Past tense, Future tense
	  * ALL persons with gender distinctions:
	    - First person singular (I/ana)
	    - Second person singular masculine (you m/enta/inta)
	    - Second person singular feminine (you f/enti/inti)
	    - Third person singular masculine (he/howa/huwa)
	    - Third person singular feminine (she/heya/hiya)
	    - First person plural (we/e7na/na7nu)
	    - Second person plural (you plural/entum/intum)
	    - Third person plural masculine (they m/homma/hum)
	    - Third person plural feminine (they f/homma/hunna)
	- Create conjugation tables in the grammar focus section showing systematic patterns
	  * Always start each table with the base/unconjugated form
	  * Show: "Base verb → Conjugated form" to help students understand the relationship
	- Include multiple example verbs (at least 3-5 different verbs) fully conjugated
	- Show how conjugation changes based on:
	  * Tense (present vs past vs future)
	  * Person (first, second, third)
	  * Gender (masculine vs feminine in second and third person)
	  * Number (singular vs plural)
	- Include exercises specifically designed to test verb conjugation:
	  * Fill-in-blank exercises with different persons and tenses (MUST include options array)
	  * Multiple-choice questions asking students to identify correct conjugations
	  * Matching exercises pairing pronouns with correct verb forms
	  * DO NOT use translation exercises
	- In quiz section, include multiple questions testing verb conjugation across different forms
	- Provide clear explanations of conjugation patterns and rules
	- Include common irregular verbs and their conjugation patterns
	- Show negative forms and question forms with conjugated verbs
	` : ''}
	
	LESSON STRUCTURE REQUIREMENTS:
	1. Create a comprehensive lesson with:
	   - A clear title in Arabic, English, and transliteration
	   - A description explaining what the lesson covers
	   - Learning objectives (what students will learn)
	   - Estimated duration in minutes
	   - Key takeaways (main points to remember)
	
	2. Create exactly ${subLessonCount} sub-lessons, each with:
	   - A unique title in Arabic, English, and transliteration
	   - Content section with:
	     * At least 5-10 phrases/vocabulary items with Arabic, English, and transliteration
	     * Optional grammar explanations
	   - EXERCISES: Each sub-lesson MUST have 2-3 exercises (aim for 3 when possible)
	     * Exercise types: multiple-choice, fill-in-blank, or matching (DO NOT use translation exercises)
	     * Vary exercise types within each sub-lesson
	     * If verb conjugation is a focus topic, include at least one exercise specifically testing conjugation
	     * Exercises should be comprehensive and test different aspects of the sub-lesson content
	     * Make exercises progressively challenging within each sub-lesson
	     * CRITICAL: Fill-in-blank exercises MUST include an "options" array with multiple choice options for each blank
	     * Fill-in-blank exercises should have at least 3-4 options per blank, with only one correct answer per blank
	
	3. Include a review section with:
	   - Exactly 10 review words (Arabic, English, transliteration)
	   - Exactly 5 review sentences that naturally incorporate the review words
	
	4. Add optional but valuable content:
	   - Grammar focus: specific grammar rules covered with examples
	     * If verb conjugation is covered, MUST include a comprehensive conjugation table
	     * Conjugation tables should show ALL persons (I, you m/f, he, she, we, you plural, they m/f) for ALL tenses (present, past, future)
	     * Include multiple example verbs showing different conjugation patterns
	     * Provide clear explanations of gender distinctions and how they affect conjugation
	   - Cultural notes: cultural context related to the lesson
	   - Pronunciation tips: notes for difficult sounds with examples
	   - Common mistakes: errors to avoid with corrections
	     * If verb conjugation is covered, include common conjugation mistakes students make
	   - Related lessons: suggestions for related topics
	   - Difficulty tags: appropriate tags like "vocabulary-heavy", "grammar-focused", etc.
	   - Audio practice indicators: whether speaking/listening practice is included
	   - Quiz: A comprehensive quiz at the end with 8-12 questions testing the entire lesson content
	     * If verb conjugation is covered, include multiple quiz questions testing different conjugation forms
	     * Quiz should test all major concepts covered in the lesson
	
	5. Ensure all Arabic text uses ${config.name} dialect/variety
	
	IMPORTANT FORMATTING:
	- All transliterations must use only the English alphabet (no special characters)
	- All Arabic text must be in ${config.name}
	- Exercises should be practical and help reinforce the lesson content
	- Review words should be key vocabulary from the lesson
	- Review sentences should demonstrate natural usage of the review words
	
	CRITICAL JSON STRUCTURE REQUIREMENT:
	- Return the lesson data DIRECTLY at the root level, NOT wrapped in a "lesson" object
	- The JSON must start with: { "id": "...", "title": {...}, "level": "...", ...
	- DO NOT wrap it like: { "lesson": { "title": {...}, ... } }
	- Use camelCase for all field names (NOT snake_case)
	- The "level" field MUST be lowercase: "beginner", "intermediate", or "advanced" (NOT "Beginner" or "BEGINNER")
	- The "description" field MUST be an object: { "english": "...", "arabic": "..." } (NOT a string)
	
	EXACT JSON SCHEMA STRUCTURE (follow this exactly):
	{
		"id": "string (required)",
		"title": {
			"arabic": "string (required)",
			"english": "string (required)",
			"transliteration": "string (required)"
		},
		"level": "beginner" | "intermediate" | "advanced" (lowercase, required),
		"description": {
			"english": "string (required)",
			"arabic": "string (optional)"
		},
		"learningObjectives": ["array of strings (optional)"],
		"estimatedDuration": number (optional, in minutes),
		"prerequisites": ["array of strings (optional)"],
		"subLessons": [
			{
				"id": "string (required)",
				"title": {
					"arabic": "string",
					"english": "string",
					"transliteration": "string"
				},
				"content": {
					"title": { "arabic": "string", "english": "string", "transliteration": "string" },
					"phrases": [
						{
							"arabic": "string",
							"english": "string",
							"transliteration": "string"
						}
					],
					"explanations": [{"english": "string"}] (optional)
				},
				"exercises": [
					{
						"id": "string",
						"type": "multiple-choice" | "fill-in-blank" | "matching" (DO NOT use "translation"),
						"question": {
							"english": "string",
							"arabic": "string (optional)"
						},
						"options": [{"arabic": "string", "english": "string", "transliteration": "string", "isCorrect": boolean}] (REQUIRED for fill-in-blank and multiple-choice exercises),
						"correctAnswer": "string or array of strings",
						"hint": {"english": "string", "arabic": "string", "transliteration": "string"} (optional)
					}
				] (REQUIRED - must have 2-3 exercises per sub-lesson, aim for 3 when possible. Vary exercise types. Fill-in-blank exercises MUST have options array.)
			}
		] (REQUIRED - must have at least ${subLessonCount} sub-lessons),
		"review": {
			"words": [
				{"arabic": "string", "english": "string", "transliteration": "string"}
			] (EXACTLY 10 words required),
			"sentences": [
				{"arabic": "string", "english": "string", "transliteration": "string"}
			] (EXACTLY 5 sentences required)
		} (REQUIRED),
		"summary": {"english": "string", "arabic": "string (optional)"} (optional),
		"keyTakeaways": ["array of strings"] (optional),
		"grammarFocus": [
			{
				"title": "string",
				"english": "string",
				"arabic": "string (optional)",
				"examples": [
					{"arabic": "string", "english": "string", "transliteration": "string"}
				] (optional - if included, examples MUST be objects with arabic, english, transliteration, NOT strings)
			}
		] (optional - if verb conjugation is covered, MUST include comprehensive conjugation tables showing all persons and tenses),
		"culturalNotes": [{"title": "string (optional)", "english": "string", "arabic": "string (optional)"}] (optional),
		"pronunciationTips": [
			{
				"sound": "string",
				"transliteration": "string (optional)",
				"description": "string",
				"examples": [
					{"arabic": "string", "transliteration": "string", "english": "string"}
				] (optional - if included, examples MUST be objects with arabic, transliteration, english, NOT strings)
			}
		] (optional),
		"commonMistakes": [
			{
				"mistake": "string",
				"correct": "string",
				"explanation": "string",
				"examples": [
					{
						"incorrect": {"arabic": "string", "english": "string", "transliteration": "string"},
						"correct": {"arabic": "string", "english": "string", "transliteration": "string"}
					}
				] (optional - if included, examples MUST have both incorrect and correct objects with arabic, english, transliteration)
			}
		] (optional),
		"relatedLessons": [{"id": "string (optional)", "title": "string", "reason": "string (optional)"}] (optional),
		"difficultyTags": ["vocabulary-heavy", "grammar-focused", "conversation-focused", "reading-focused", "writing-focused", "listening-focused", "speaking-focused", "beginner-friendly", "challenging", "interactive"] (optional - ONLY use these exact values),
		"audioPractice": {"hasSpeakingPractice": boolean, "hasListeningPractice": boolean, "audioFilesCount": number, "notes": "string"} (optional),
		"quiz": {
			"title": "string (optional)",
			"description": "string (optional)",
			"questions": [
				{
					"id": "string",
					"type": "multiple-choice" | "fill-in-blank" | "matching" (DO NOT use "translation"),
					"question": {"english": "string", "arabic": "string (optional)"},
					"options": [{"arabic": "string", "english": "string", "transliteration": "string", "isCorrect": boolean}] (REQUIRED for fill-in-blank and multiple-choice exercises),
					"correctAnswer": "string or array of strings",
					"hint": {"english": "string", "arabic": "string", "transliteration": "string"} (optional)
				}
			] (REQUIRED - 8-12 questions testing the entire lesson. If verb conjugation is covered, include multiple questions testing different conjugation forms. Fill-in-blank questions MUST have options array.)
		} (REQUIRED - must include a comprehensive quiz)
	}
	
	CRITICAL FIELD NAME REQUIREMENTS:
	- Use "subLessons" (camelCase), NOT "sub_lessons" (snake_case)
	- Use "learningObjectives" (camelCase), NOT "learning_objectives"
	- Use "estimatedDuration" (camelCase), NOT "estimated_duration_minutes"
	- Use "keyTakeaways" (camelCase), NOT "key_takeaways"
	- Use "grammarFocus" (camelCase), NOT "grammar_focus"
	- Use "culturalNotes" (camelCase), NOT "cultural_notes"
	- Use "pronunciationTips" (camelCase), NOT "pronunciation_tips"
	- Use "commonMistakes" (camelCase), NOT "common_mistakes"
	- Use "relatedLessons" (camelCase), NOT "related_lessons"
	- Use "difficultyTags" (camelCase), NOT "difficulty_tags"
	- Use "audioPractice" (camelCase), NOT "audio_practice"
	
	CRITICAL VALIDATION REQUIREMENTS:
	- difficultyTags: ONLY use these exact values: "vocabulary-heavy", "grammar-focused", "conversation-focused", "reading-focused", "writing-focused", "listening-focused", "speaking-focused", "beginner-friendly", "challenging", "interactive"
	- grammarFocus examples: If you include examples, each MUST be an object with "arabic", "english", "transliteration" fields. DO NOT use strings like "Male: Kwayyes (Good)"
	- pronunciationTips examples: If you include examples, each MUST be an object with "arabic", "transliteration", "english" fields. DO NOT use strings like "Kheir (Goodness)"
	- commonMistakes examples: If you include examples, each example MUST have both "incorrect" and "correct" objects, each with "arabic", "english", and "transliteration" fields
	- If examples don't have the correct structure, omit the examples array entirely (it's optional)
	
	Generate the lesson in JSON format matching this exact schema structure.
	`;

	try {
		const lessonSchema = createLessonSchema();
		
		// Log request parameters
		writeDebugLog(lessonId, {
			stage: 'request',
			requestData: {
				topic,
				dialect,
				level,
				learningTopics,
				vocabularyWords,
				subLessonCount
			},
			prompt: question.substring(0, 5000) // First 5000 chars of prompt
		});
		
		const response = await generateContentWithRetry(ai, {
			model: 'gemini-2.5-flash',
			contents: question,
			// @ts-expect-error - generationConfig is valid but types may be outdated
			generationConfig: {
				temperature: 0.9,
				maxOutputTokens: 16000, // Higher token limit for comprehensive lessons
				responseMimeType: 'application/json',
				responseJsonSchema: lessonSchema.jsonSchema
			}
		});

		const lessonContent = response.text;
		
		// Log raw response
		writeDebugLog(lessonId, {
			stage: 'raw_response',
			responseLength: lessonContent?.length || 0,
			rawResponse: lessonContent || 'NO RESPONSE',
			responsePreview: lessonContent?.substring(0, 1000) || 'NO PREVIEW'
		});

		try {
			// Parse and validate the lesson content
			if (!lessonContent) {
				const error = new Error('No lesson content generated');
				writeDebugLog(lessonId, {
					stage: 'error',
					error: 'No lesson content generated',
					errorMessage: error.message,
					stack: error.stack
				});
				throw error;
			}
			
			// Check if response is wrapped in a "lesson" object and unwrap it
			let parsedContent: unknown;
			try {
				parsedContent = JSON.parse(lessonContent);
				writeDebugLog(lessonId, {
					stage: 'parse_attempt',
					method: 'direct_json_parse',
					success: true,
					parsedContentPreview: JSON.stringify(parsedContent).substring(0, 2000)
				});
			} catch (parseErr) {
				writeDebugLog(lessonId, {
					stage: 'parse_attempt',
					method: 'direct_json_parse',
					success: false,
					error: parseErr instanceof Error ? parseErr.message : String(parseErr),
					stack: parseErr instanceof Error ? parseErr.stack : undefined
				});
				// If direct parse fails, try the parser utility
				try {
					parsedContent = parseJsonFromGeminiResponse(lessonContent, lessonSchema.zodSchema);
					writeDebugLog(lessonId, {
						stage: 'parse_attempt',
						method: 'parseJsonFromGeminiResponse',
						success: true,
						parsedContentPreview: JSON.stringify(parsedContent).substring(0, 2000)
					});
				} catch (parserErr) {
					writeDebugLog(lessonId, {
						stage: 'parse_attempt',
						method: 'parseJsonFromGeminiResponse',
						success: false,
						error: parserErr instanceof Error ? parserErr.message : String(parserErr),
						stack: parserErr instanceof Error ? parserErr.stack : undefined,
						fullError: JSON.stringify(parserErr, Object.getOwnPropertyNames(parserErr))
					});
					throw parserErr;
				}
			}
			
			// Unwrap if wrapped in "lesson" object
			const normalizationSteps: string[] = [];
			if (parsedContent && typeof parsedContent === 'object' && parsedContent !== null) {
				const content = parsedContent as Record<string, unknown>;
				if (content.lesson && typeof content.lesson === 'object') {
					console.warn('⚠️ Response wrapped in "lesson" object, unwrapping...');
					normalizationSteps.push('Unwrapped "lesson" object');
					parsedContent = content.lesson;
				}
			}
			
			// Normalize common schema mismatches
			if (parsedContent && typeof parsedContent === 'object' && parsedContent !== null) {
				const content = parsedContent as Record<string, unknown>;
				const beforeNormalization = JSON.stringify(content).substring(0, 2000);
				// Normalize level to lowercase
				if (content.level && typeof content.level === 'string') {
					const oldLevel = content.level;
					content.level = content.level.toLowerCase();
					if (oldLevel !== content.level) {
						normalizationSteps.push(`Normalized level: "${oldLevel}" -> "${content.level}"`);
					}
				}
				
				// Normalize description from string to object if needed
				if (typeof content.description === 'string') {
					normalizationSteps.push('Converted description from string to object');
					content.description = {
						english: content.description
						// arabic is optional, so we don't include it if not provided
					};
				}
				
				// Normalize snake_case field names to camelCase
				const fieldMappings: Record<string, string> = {
					'sub_lessons': 'subLessons',
					'learning_objectives': 'learningObjectives',
					'estimated_duration': 'estimatedDuration',
					'estimated_duration_minutes': 'estimatedDuration',
					'key_takeaways': 'keyTakeaways',
					'grammar_focus': 'grammarFocus',
					'cultural_notes': 'culturalNotes',
					'pronunciation_tips': 'pronunciationTips',
					'common_mistakes': 'commonMistakes',
					'related_lessons': 'relatedLessons',
					'difficulty_tags': 'difficultyTags',
					'audio_practice': 'audioPractice'
				};
				
				for (const [snakeCase, camelCase] of Object.entries(fieldMappings)) {
					if (content[snakeCase] !== undefined && content[camelCase] === undefined) {
						normalizationSteps.push(`Renamed field: "${snakeCase}" -> "${camelCase}"`);
						content[camelCase] = content[snakeCase];
						delete content[snakeCase];
					}
				}
				
				// Normalize subLessons array if it's named differently
				if (content.sub_lessons && !content.subLessons) {
					content.subLessons = content.sub_lessons;
					delete content.sub_lessons;
				}
				
				// Filter invalid difficultyTags enum values
				if (content.difficultyTags && Array.isArray(content.difficultyTags)) {
					const validTags = [
						"vocabulary-heavy",
						"grammar-focused",
						"conversation-focused",
						"reading-focused",
						"writing-focused",
						"listening-focused",
						"speaking-focused",
						"beginner-friendly",
						"challenging",
						"interactive"
					];
					const invalidTags = content.difficultyTags.filter((tag: unknown) => 
						typeof tag !== 'string' || !validTags.includes(tag)
					);
					content.difficultyTags = content.difficultyTags.filter((tag: unknown) => 
						typeof tag === 'string' && validTags.includes(tag)
					);
					if (invalidTags.length > 0) {
						normalizationSteps.push(`Filtered invalid difficultyTags: ${JSON.stringify(invalidTags)}`);
					}
					// If all tags were invalid, set to empty array (optional field)
					if (Array.isArray(content.difficultyTags) && content.difficultyTags.length === 0) {
						normalizationSteps.push('Removed difficultyTags (all invalid)');
						delete content.difficultyTags;
					}
				}
				
				// Fix grammarFocus examples structure
				if (content.grammarFocus && Array.isArray(content.grammarFocus)) {
					content.grammarFocus = content.grammarFocus.map((rule: unknown) => {
						const ruleObj = rule as Record<string, unknown>;
						if (ruleObj.examples && Array.isArray(ruleObj.examples)) {
							// Check if examples are strings (invalid) or objects (valid)
							const hasInvalidExamples = ruleObj.examples.some((ex: unknown) => typeof ex === 'string');
							if (hasInvalidExamples) {
								// Remove invalid string examples (optional field)
								normalizationSteps.push(`Removed invalid grammarFocus examples (were strings, expected objects)`);
								delete ruleObj.examples;
							} else {
								// Filter out invalid object examples
								const validExamples = ruleObj.examples.filter((ex: unknown) => {
									if (!ex || typeof ex !== 'object' || ex === null) return false;
									const exObj = ex as Record<string, unknown>;
									return (
										typeof exObj.arabic === 'string' &&
										typeof exObj.english === 'string' &&
										typeof exObj.transliteration === 'string'
									);
								});
								if (validExamples.length === 0) {
									delete ruleObj.examples;
								} else {
									ruleObj.examples = validExamples;
								}
							}
						}
						return ruleObj;
					});
				}
				
				// Fix pronunciationTips examples structure
				if (content.pronunciationTips && Array.isArray(content.pronunciationTips)) {
					content.pronunciationTips = content.pronunciationTips.map((tip: unknown) => {
						const tipObj = tip as Record<string, unknown>;
						if (tipObj.examples && Array.isArray(tipObj.examples)) {
							// Check if examples are strings (invalid) or objects (valid)
							const hasInvalidExamples = tipObj.examples.some((ex: unknown) => typeof ex === 'string');
							if (hasInvalidExamples) {
								// Remove invalid string examples (optional field)
								normalizationSteps.push(`Removed invalid pronunciationTips examples (were strings, expected objects)`);
								delete tipObj.examples;
							} else {
								// Filter out invalid object examples
								const validExamples = tipObj.examples.filter((ex: unknown) => {
									if (!ex || typeof ex !== 'object' || ex === null) return false;
									const exObj = ex as Record<string, unknown>;
									return (
										typeof exObj.arabic === 'string' &&
										typeof exObj.english === 'string' &&
										typeof exObj.transliteration === 'string'
									);
								});
								if (validExamples.length === 0) {
									delete tipObj.examples;
								} else {
									tipObj.examples = validExamples;
								}
							}
						}
						return tipObj;
					});
				}
				
				// Fix commonMistakes examples structure
				if (content.commonMistakes && Array.isArray(content.commonMistakes)) {
					let examplesFixed = 0;
					let examplesRemoved = 0;
					content.commonMistakes = content.commonMistakes.map((mistake: unknown) => {
						const mistakeObj = mistake as Record<string, unknown>;
						if (mistakeObj.examples && Array.isArray(mistakeObj.examples)) {
							const originalCount = mistakeObj.examples.length;
							// Filter out invalid examples that don't have correct structure
							const validExamples = mistakeObj.examples.filter((ex: unknown) => {
								if (!ex || typeof ex !== 'object' || ex === null) return false;
								const exObj = ex as Record<string, unknown>;
								const incorrect = exObj.incorrect;
								const correct = exObj.correct;
								
								if (!incorrect || typeof incorrect !== 'object' || incorrect === null) return false;
								if (!correct || typeof correct !== 'object' || correct === null) return false;
								
								const incorrectObj = incorrect as Record<string, unknown>;
								const correctObj = correct as Record<string, unknown>;
								
								return (
									typeof incorrectObj.arabic === 'string' &&
									typeof incorrectObj.english === 'string' &&
									typeof incorrectObj.transliteration === 'string' &&
									typeof correctObj.arabic === 'string' &&
									typeof correctObj.english === 'string' &&
									typeof correctObj.transliteration === 'string'
								);
							});
							
							// If no valid examples, remove the examples array (it's optional)
							if (validExamples.length === 0) {
								delete mistakeObj.examples;
								examplesRemoved += originalCount;
							} else {
								mistakeObj.examples = validExamples;
								if (validExamples.length < originalCount) {
									examplesFixed += originalCount - validExamples.length;
								}
							}
						}
						return mistakeObj;
					});
					if (examplesFixed > 0 || examplesRemoved > 0) {
						normalizationSteps.push(`Fixed commonMistakes examples: ${examplesFixed} fixed, ${examplesRemoved} removed`);
					}
				}
				
				parsedContent = content;
				
				// Log normalization steps
				writeDebugLog(lessonId, {
					stage: 'normalization',
					beforeNormalization,
					afterNormalization: JSON.stringify(content).substring(0, 2000),
					normalizationSteps
				});
			}
			
			// Validate the normalized lesson content directly with Zod
			// parsedContent is already a parsed object, so we validate it directly
			let parsedLesson;
			try {
				// Validate the already-parsed and normalized object directly with Zod
				parsedLesson = lessonSchema.zodSchema.parse(parsedContent);
				
				writeDebugLog(lessonId, {
					stage: 'validation',
					success: true,
					parsedLessonPreview: JSON.stringify(parsedLesson).substring(0, 2000),
					subLessonsCount: parsedLesson?.subLessons?.length || 0
				});
			} catch (validationErr) {
				const baseErrorDetails = validationErr instanceof Error ? {
					message: validationErr.message,
					stack: validationErr.stack,
					name: validationErr.name
				} : {
					error: String(validationErr),
					type: typeof validationErr
				};
				
				// Try to extract Zod error details - ZodError has an 'issues' property
				let zodErrors: unknown = null;
				let zodIssues: unknown = null;
				let fullErrorObject: Record<string, unknown> | null = null;
				
				if (validationErr && typeof validationErr === 'object') {
					// Check for ZodError structure (has 'issues' property)
					if ('issues' in validationErr) {
						zodIssues = (validationErr as { issues: unknown }).issues;
					}
					// Also check for 'errors' property (some wrappers use this)
					if ('errors' in validationErr) {
						zodErrors = (validationErr as { errors: unknown }).errors;
					}
					// Try to get all enumerable properties
					try {
						const allProps = Object.getOwnPropertyNames(validationErr);
						fullErrorObject = {};
						for (const prop of allProps) {
							try {
								fullErrorObject[prop] = (validationErr as Record<string, unknown>)[prop];
							} catch {
								// Skip if can't access
							}
						}
					} catch {
						// Ignore if can't extract
					}
				}
				
				const errorDetails = {
					...baseErrorDetails,
					...(fullErrorObject && { fullErrorObject })
				};
				
				writeDebugLog(lessonId, {
					stage: 'validation',
					success: false,
					error: errorDetails,
					zodIssues: zodIssues ? JSON.stringify(zodIssues, null, 2) : null,
					zodErrors: zodErrors ? JSON.stringify(zodErrors, null, 2) : null,
					parsedContentPreview: JSON.stringify(parsedContent).substring(0, 5000),
					fullParsedContent: parsedContent,
					parsedContentString: typeof parsedContent === 'string' ? parsedContent : JSON.stringify(parsedContent, null, 2)
				});
				
				throw validationErr;
			}
			
			if (!parsedLesson || !parsedLesson.subLessons || parsedLesson.subLessons.length === 0) {
				const error = new Error('Invalid lesson structure: missing subLessons');
				writeDebugLog(lessonId, {
					stage: 'structure_validation',
					success: false,
					error: error.message,
					hasSubLessons: !!parsedLesson?.subLessons,
					subLessonsCount: parsedLesson?.subLessons?.length || 0,
					parsedLessonPreview: JSON.stringify(parsedLesson).substring(0, 5000)
				});
				throw error;
			}

			// Ensure lesson has an ID
			if (!parsedLesson.id) {
				parsedLesson.id = lessonId;
			}

			// Log success
			writeDebugLog(lessonId, {
				stage: 'success',
				lessonId: parsedLesson.id,
				title: parsedLesson.title,
				level: parsedLesson.level,
				subLessonsCount: parsedLesson.subLessons.length,
				hasReview: !!parsedLesson.review,
				reviewWordsCount: parsedLesson.review?.words?.length || 0,
				reviewSentencesCount: parsedLesson.review?.sentences?.length || 0
			});

			// Upload lesson JSON to Supabase Storage
			const storageResult = await uploadLessonToStorage(lessonId, parsedLesson);
			
			if (!storageResult.success) {
				console.error('Storage upload failed:', storageResult.error);
				writeDebugLog(lessonId, {
					stage: 'storage_error',
					error: storageResult.error
				});
				throw new Error(`Failed to upload lesson to storage: ${storageResult.error}`);
			}

			// Save lesson metadata to database
			const { error: insertError } = await supabase
				.from('generated_lesson')
				.insert({
					id: lessonId,
					user_id: userId,
					title: parsedLesson.title?.english || null,
					title_arabic: parsedLesson.title?.arabic || null,
					description: parsedLesson.description?.english || null,
					level: parsedLesson.level,
					dialect: dialect,
					lesson_body: storageResult.fileKey!, // Store file key instead of JSON
					sub_lesson_count: parsedLesson.subLessons?.length || null,
					estimated_duration: parsedLesson.estimatedDuration || null,
					created_at: new Date().toISOString()
				});

			if (insertError) {
				console.error('Database insert error:', insertError);
				writeDebugLog(lessonId, {
					stage: 'database_error',
					error: insertError.message,
					errorDetails: insertError
				});
				throw insertError;
			}

			console.log('✅ Lesson saved to database:', lessonId);

			// Extract and save all words and sentences from the lesson
			try {
				await saveLessonWordsAndSentences(parsedLesson, userId, dialect);
			} catch (saveError) {
				// Log error but don't fail the lesson creation
				console.error('Error saving lesson words/sentences:', saveError);
				writeDebugLog(lessonId, {
					stage: 'save_words_error',
					error: saveError instanceof Error ? saveError.message : String(saveError)
				});
			}

			// Return the lesson ID (client can fetch full lesson from database)
			return json({ 
				lessonId: lessonId,
				success: true
			});
		} catch (e) {
			const errorDetails = e instanceof Error ? {
				message: e.message,
				stack: e.stack,
				name: e.name
			} : {
				error: String(e),
				type: typeof e
			};
			
			writeDebugLog(lessonId, {
				stage: 'error',
				errorType: 'JSON parsing/validation error',
				error: errorDetails,
				fullError: JSON.stringify(e, Object.getOwnPropertyNames(e)),
				lessonContent: lessonContent?.substring(0, 10000) || 'NO CONTENT'
			});
			
			console.error('JSON parsing error:', e);
			return error(500, { message: 'Something went wrong while processing the lesson' });
		}
	} catch (e) {
		const errorDetails = e instanceof Error ? {
			message: e.message,
			stack: e.stack,
			name: e.name
		} : {
			error: String(e),
			type: typeof e
		};
		
		writeDebugLog(lessonId, {
			stage: 'error',
			errorType: 'Lesson generation error',
			error: errorDetails,
			fullError: JSON.stringify(e, Object.getOwnPropertyNames(e))
		});
		
		console.error('Lesson generation error:', e);
		return error(500, { message: 'Failed to generate lesson' });
	}
};

