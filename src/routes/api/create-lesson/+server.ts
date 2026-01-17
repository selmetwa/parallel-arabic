import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { createLessonSchema, type GeneratedLesson } from '$lib/schemas/curriculum-schema';
import { v4 as uuidv4 } from 'uuid';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import { supabase } from '$lib/supabaseClient';
import { uploadLessonToStorage } from '$lib/helpers/storage-helpers';
import { invalidateLessonCaches } from '$lib/server/redis';
import fs from 'fs';
import path from 'path';

interface LessonGenerationData {
	topic: string;
	dialect: string;
	level: 'beginner' | 'intermediate' | 'advanced';
	learningTopics?: string[];
	vocabularyWords?: string;
	subLessonCount?: number;
	useReviewWordsOnly?: boolean;
	reviewWordsSource?: 'all' | 'due-for-review';
	reviewWords?: Array<{ arabic: string; english: string; transliteration: string }>;
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
 * Extract KEY VOCAB words from lesson content steps and save them to the user's review deck
 */
async function saveLessonWordsAndSentences(
	lesson: GeneratedLesson,
	userId: string,
	dialect: string
): Promise<void> {
	// Extract words from content step examples
	const keyVocabWords: Array<{
		arabic: string;
		english: string;
		transliteration: string;
	}> = [];

	// Extract words from content step examples
	for (const step of lesson.steps) {
		if (step.type === 'content' && step.content.examples) {
			for (const example of step.content.examples) {
				if (example.arabic && example.english && example.transliteration) {
				keyVocabWords.push({
						arabic: example.arabic.trim(),
						english: example.english.trim(),
						transliteration: example.transliteration.trim()
					});
				}
			}
		}
		// Also extract from practice sentences
		if (step.type === 'practice-sentence' && step.sentence) {
			if (step.sentence.arabic && step.sentence.english && step.sentence.transliteration) {
				keyVocabWords.push({
					arabic: step.sentence.arabic.trim(),
					english: step.sentence.english.trim(),
					transliteration: step.sentence.transliteration.trim()
				});
			}
		}
	}

	if (keyVocabWords.length === 0) {
		console.log('No KEY VOCAB words found in lesson content');
		return;
	}

	// Remove duplicates based on Arabic text
	const seen = new Set<string>();
	const uniqueArray = keyVocabWords.filter(word => {
		if (seen.has(word.arabic)) {
			return false;
		}
		seen.add(word.arabic);
		return true;
	});

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
		console.log('All KEY VOCAB words from lesson already exist in review deck');
		return;
	}

	// Insert words into saved_word table
	const { error: insertError } = await supabase
		.from('saved_word')
		.insert(savedWordsToInsert);

	if (insertError) {
		console.error('Error saving KEY VOCAB words:', insertError);
		throw new Error(`Failed to save KEY VOCAB words: ${insertError.message}`);
	}

	console.log(`✅ Saved ${savedWordsToInsert.length} KEY VOCAB words from lesson to review deck`);
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
	const useReviewWordsOnly = data.useReviewWordsOnly || false;
	const reviewWords = data.reviewWords || [];

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

	// Build review words section (highest priority when useReviewWordsOnly is true)
	let reviewWordsSection = '';
	if (useReviewWordsOnly && reviewWords.length > 0) {
		const wordsList = reviewWords.map((word) => 
			`Arabic: ${word.arabic}, English: ${word.english}, Transliteration: ${word.transliteration}`
		).join('\n');
		
		reviewWordsSection = `
		
		CRITICAL: You MUST use ALL of the following words in your lesson. These are words the user is actively learning, and including them reinforces their memory. Use each word at least once. If you cannot naturally include all words, prioritize using as many as possible, but make the content feel natural.
		
		REQUIRED WORDS TO INCLUDE:
		${wordsList}
		
		The user is learning these specific words. Seeing them in context will help reinforce their learning through spaced repetition. Make sure to use these words naturally throughout your lesson, including in the review section.`;
	}

	// Build vocabulary words section (only if not using review words only)
	let vocabularyWordsSection = '';
	if (!useReviewWordsOnly && vocabularyWords.trim()) {
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

	// Calculate step counts based on subLessonCount
	const contentStepsPerSection = 3;
	const totalContentSteps = subLessonCount * contentStepsPerSection;
	const practiceSentencesPerSection = 2;
	const exercisesPerSection = 3;
	const totalPracticeSentences = subLessonCount * practiceSentencesPerSection;
	const totalExercises = subLessonCount * exercisesPerSection;
	const totalSteps = totalContentSteps + totalPracticeSentences + totalExercises;

	const question = `
	You are an expert Arabic language teacher creating comprehensive, step-based lessons for students learning ${config.name}.
	
	CRITICAL REQUIREMENTS:
	- Generate a complete lesson with exactly ${totalSteps} steps (approximately ${totalContentSteps} content steps, ${totalPracticeSentences} practice sentences, and ${totalExercises} exercises)
	- The lesson follows a STEP-BY-STEP format where users progress through one step at a time
	- All content must be in ${config.name}: ${config.description}
	
	LESSON TOPIC: ${topic || 'General Arabic language learning'}
	
	LEVEL: ${levelDescription[level]}
	
	${learningTopicsSection}
	
	${reviewWordsSection}
	
	${vocabularyWordsSection}
	
	LESSON STRUCTURE REQUIREMENTS:
	The lesson must follow this EXACT step-based structure:
	
	1. Create exactly ${totalSteps} instructional steps organized in sections:
	   - Every ${contentStepsPerSection} content steps should be followed by:
	     a. ${practiceSentencesPerSection} practice sentences (type: "practice-sentence") that use vocabulary from the previous content steps
	     b. ${exercisesPerSection} practice exercises (type: "exercise") - Quiz questions
	
	2. CONTENT STEPS (type: "content"):
	   - Each content step teaches a specific concept, phrase, or vocabulary
	   - Must have a title with both English and optional Arabic
	   - Must have explanatory text describing the concept
	   - Must include 2-4 example phrases - EACH example MUST have ALL THREE fields: arabic, english, AND transliteration
	   - Do NOT include "Base verb" or other single-field entries as examples - put those in the text field instead
	
	3. PRACTICE SENTENCE STEPS (type: "practice-sentence"):
	   - Provide a sentence for the student to practice
	   - Must include Arabic, English, and transliteration
	   - Optionally include context explaining the sentence usage
	
	4. EXERCISE STEPS (type: "exercise"):
	   - Types: "multiple-choice", "fill-in-blank", or "matching" (DO NOT use "translation")
	   - CRITICAL: The "question" field MUST be in English ONLY. Do NOT include Arabic text in the question.
	   - CRITICAL: All option texts MUST be in Arabic script (NOT transliteration, NOT English)
	   - Must include an "options" array with 3-4 options (each with id, text in Arabic, isCorrect)
	   - Must include "correctAnswerId" matching one option id
	   - MUST include a "hint" object with "transliteration" (required) and optional "arabic"

	${learningTopics.includes('verb conjugation') ? `
	VERB CONJUGATION REQUIREMENTS:
	- Include conjugation examples for all persons (I, you m/f, he, she, we, you plural, they m/f)
	- Show all tenses: present, past, future
	- Include exercises specifically testing verb conjugation
	` : ''}
	
	IMPORTANT FORMATTING:
	- All transliterations must use only the English alphabet (no special characters)
	- All Arabic text must be in ${config.name}
	- Exercises should be practical and help reinforce the lesson content
	- Use diacritical marks (tashkeel/harakat) SPARINGLY - only when needed for pronunciation clarity
	
	EXACT JSON SCHEMA STRUCTURE (follow this exactly):
	{
		"topicId": "string (required) - unique identifier for this lesson",
		"title": "string (required) - lesson title in English",
		"dialect": "${dialect}" (required),
		"steps": [
			// CONTENT STEP EXAMPLE:
			{
				"type": "content",
				"content": {
		"title": {
			"english": "string (required)",
			"arabic": "string (optional)"
		},
					"text": "string (required) - explanatory text about the lesson content. Include base verbs and grammar notes here.",
					"examples": [
						{
							"arabic": "أنا باحب القهوة",
							"english": "I like coffee",
							"transliteration": "Ana ba7eb el ahwa"
						}
					]
				}
			},
			// PRACTICE SENTENCE STEP EXAMPLE:
			{
				"type": "practice-sentence",
				"sentence": {
					"arabic": "string (required)",
					"english": "string (required)",
					"transliteration": "string (required)"
				},
				"context": "string (optional) - explanation of when to use this sentence"
			},
			// EXERCISE STEP EXAMPLE:
			{
				"type": "exercise",
				"exerciseType": "multiple-choice" | "fill-in-blank" | "matching",
				"question": "string (required) - MUST be in English",
				"options": [
					{
						"id": "string (required) - unique option id like 'opt1', 'opt2'",
						"text": "string (required) - MUST be in Arabic script",
						"isCorrect": boolean (required)
					}
				],
				"correctAnswerId": "string (required) - must match one option's id",
				"hint": {
					"transliteration": "string (required) - phonetic spelling of correct answer",
					"arabic": "string (optional) - Arabic text of correct answer"
				}
			}
		]
	}
	
	CRITICAL REQUIREMENTS:
	- Return the lesson data DIRECTLY at the root level
	- The JSON must start with: { "topicId": "...", "title": "...", "dialect": "...", "steps": [...] }
	- Include exactly ${totalSteps} steps total
	- Alternate between content steps, practice sentences, and exercises as described
	- Output ONLY valid JSON - no markdown code blocks, no extra text, no comments
	- CRITICAL: Every example in content steps MUST have ALL THREE fields: "arabic", "english", AND "transliteration"
	- Do NOT put base verb forms or grammar labels as examples - include those in the "text" field instead
	
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
			model: 'gemini-3-flash-preview',
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
			
			// Strip markdown code blocks if present
			let cleanedContent = lessonContent;
			if (cleanedContent.startsWith('```json')) {
				cleanedContent = cleanedContent.slice(7); // Remove ```json
			} else if (cleanedContent.startsWith('```')) {
				cleanedContent = cleanedContent.slice(3); // Remove ```
			}
			if (cleanedContent.endsWith('```')) {
				cleanedContent = cleanedContent.slice(0, -3); // Remove trailing ```
			}
			cleanedContent = cleanedContent.trim();
			
			// Parse the JSON response
			let parsedContent: unknown;
			try {
				parsedContent = JSON.parse(cleanedContent);
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
					parsedContent = parseJsonFromGeminiResponse(cleanedContent, lessonSchema.zodSchema);
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
			
			// Normalize common schema mismatches for step-based schema
			if (parsedContent && typeof parsedContent === 'object' && parsedContent !== null) {
				const content = parsedContent as Record<string, unknown>;
				const beforeNormalization = JSON.stringify(content).substring(0, 2000);
				
				// Normalize snake_case field names to camelCase
				const fieldMappings: Record<string, string> = {
					'topic_id': 'topicId',
					'exercise_type': 'exerciseType',
					'correct_answer_id': 'correctAnswerId'
				};
				
				for (const [snakeCase, camelCase] of Object.entries(fieldMappings)) {
					if (content[snakeCase] !== undefined && content[camelCase] === undefined) {
						normalizationSteps.push(`Renamed field: "${snakeCase}" -> "${camelCase}"`);
						content[camelCase] = content[snakeCase];
						delete content[snakeCase];
					}
				}
				
				// Normalize steps array if needed
				if (content.steps && Array.isArray(content.steps)) {
					content.steps = content.steps.map((step: unknown) => {
						const stepObj = step as Record<string, unknown>;
						
						// Normalize exercise step fields
						if (stepObj.type === 'exercise') {
							if (stepObj.exercise_type && !stepObj.exerciseType) {
								stepObj.exerciseType = stepObj.exercise_type;
								delete stepObj.exercise_type;
							}
							if (stepObj.correct_answer_id && !stepObj.correctAnswerId) {
								stepObj.correctAnswerId = stepObj.correct_answer_id;
								delete stepObj.correct_answer_id;
							}
						}
						
						// Normalize content step examples - filter out invalid ones
						if (stepObj.type === 'content' && stepObj.content) {
							const contentObj = stepObj.content as Record<string, unknown>;
							if (contentObj.examples && Array.isArray(contentObj.examples)) {
								// Filter out examples that don't have all required fields
								const validExamples = contentObj.examples.filter((ex: unknown) => {
									if (!ex || typeof ex !== 'object' || ex === null) return false;
									const exObj = ex as Record<string, unknown>;
									return (
										typeof exObj.arabic === 'string' &&
										typeof exObj.english === 'string' &&
										typeof exObj.transliteration === 'string'
									);
								});
								
								if (validExamples.length !== contentObj.examples.length) {
									normalizationSteps.push(`Filtered invalid examples in content step: ${contentObj.examples.length - validExamples.length} removed`);
								}
								
								contentObj.examples = validExamples;
							}
						}
						
						return stepObj;
					});
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
			let parsedLesson: GeneratedLesson;
			try {
				// Validate the already-parsed and normalized object directly with Zod
				parsedLesson = lessonSchema.zodSchema.parse(parsedContent);
				
				writeDebugLog(lessonId, {
					stage: 'validation',
					success: true,
					parsedLessonPreview: JSON.stringify(parsedLesson).substring(0, 2000),
					stepsCount: parsedLesson?.steps?.length || 0
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
				
				// Try to extract Zod error details
				let zodIssues: unknown = null;
				if (validationErr && typeof validationErr === 'object' && 'issues' in validationErr) {
						zodIssues = (validationErr as { issues: unknown }).issues;
				}
				
				writeDebugLog(lessonId, {
					stage: 'validation',
					success: false,
					error: baseErrorDetails,
					zodIssues: zodIssues ? JSON.stringify(zodIssues, null, 2) : null,
					parsedContentPreview: JSON.stringify(parsedContent).substring(0, 5000)
				});
				
				throw validationErr;
			}
			
			if (!parsedLesson || !parsedLesson.steps || parsedLesson.steps.length === 0) {
				const error = new Error('Invalid lesson structure: missing steps');
				writeDebugLog(lessonId, {
					stage: 'structure_validation',
					success: false,
					error: error.message,
					hasSteps: !!parsedLesson?.steps,
					stepsCount: parsedLesson?.steps?.length || 0,
					parsedLessonPreview: JSON.stringify(parsedLesson).substring(0, 5000)
				});
				throw error;
			}

			// Ensure lesson has an ID
			if (!parsedLesson.topicId) {
				parsedLesson.topicId = lessonId;
			}

			// Log success
			writeDebugLog(lessonId, {
				stage: 'success',
				lessonId: parsedLesson.topicId,
				title: parsedLesson.title,
				dialect: parsedLesson.dialect,
				stepsCount: parsedLesson.steps.length,
				contentSteps: parsedLesson.steps.filter(s => s.type === 'content').length,
				exerciseSteps: parsedLesson.steps.filter(s => s.type === 'exercise').length,
				practiceSteps: parsedLesson.steps.filter(s => s.type === 'practice-sentence').length
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
					title: parsedLesson.title || null,
					title_arabic: null, // Step-based lessons don't have separate Arabic title
					description: null, // Step-based lessons don't have description at root level
					level: level, // Use the level from the request
					dialect: dialect,
					lesson_body: storageResult.fileKey!, // Store file key instead of JSON
					sub_lesson_count: parsedLesson.steps?.length || null, // Store step count
					estimated_duration: null,
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

			// Invalidate Redis cache for lessons
			await invalidateLessonCaches(lessonId, dialect);

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

