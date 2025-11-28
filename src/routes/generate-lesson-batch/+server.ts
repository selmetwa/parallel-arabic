import { json } from '@sveltejs/kit';
import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';
import { curriculum } from '$lib/data/curriculum';
import { createLessonSchema } from '$lib/schemas/curriculum-schema';
import { saveLesson, loadLesson } from '$lib/helpers/lesson-file-helper';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import fs from 'fs';
import path from 'path';

/**
 * Write debug log to file in logs/lessons directory
 */
function writeDebugLog(topicId: string, logData: Record<string, unknown>) {
	try {
		const logsDir = path.join(process.cwd(), 'logs', 'lessons');
		if (!fs.existsSync(logsDir)) {
			fs.mkdirSync(logsDir, { recursive: true });
		}
		
		const logFile = path.join(logsDir, `generate_${topicId}_${Date.now()}.json`);
		const logContent = {
			timestamp: new Date().toISOString(),
			topicId,
			...logData
		};
		
		fs.writeFileSync(logFile, JSON.stringify(logContent, null, 2));
		return logFile;
	} catch (error) {
		console.error('Failed to write debug log:', error);
		return null;
	}
}

/**
 * Sleep utility for backoff delays
 */
function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a single lesson
 */
async function generateSingleLesson(
	topicId: string,
	dialect: string,
	ai: GoogleGenAI,
	lessonSchema: ReturnType<typeof createLessonSchema>
): Promise<{ success: boolean; skipped?: boolean; lesson?: any; error?: string; duration: number }> {
	const startTime = Date.now();
	
	try {
		// Check if lesson already exists for this dialect
		const existingLesson = await loadLesson(topicId, dialect);
		if (existingLesson) {
			console.log(`[Batch Generator] Lesson ${topicId} already exists for dialect ${dialect}, skipping...`);
			return {
				success: true,
				skipped: true,
				lesson: existingLesson,
				duration: Date.now() - startTime
			};
		}
		
		// Find topic details
		let topicTitle = '';
		let topicDescription = '';
		
		for (const module of curriculum) {
			const found = module.topics.find(t => t.id === topicId);
			if (found) {
				topicTitle = found.title;
				topicDescription = found.description;
				break;
			}
		}

		if (!topicTitle) {
			return {
				success: false,
				error: `Invalid Topic ID: ${topicId}`,
				duration: Date.now() - startTime
			};
		}

		const schemaString = JSON.stringify(lessonSchema.jsonSchema, null, 2);

		const prompt = `
    Create a structured Arabic lesson for the topic: "${topicTitle}".
    Description: "${topicDescription}"
    Dialect: "${dialect}" (e.g., Egyptian Arabic, Levantine, MSA).
    
    The lesson must follow this EXACT structure:
    1.  It must have exactly 15 instructional/content steps.
    2.  After every 3 content steps, insert:
        a. 2-3 practice sentences (type: "practice-sentence") that use vocabulary from the previous 3 content steps
        b. 3 practice exercises (type: "exercise") - Quiz questions
    3.  Total steps should be roughly 15 content + 10-15 practice sentences + 15 exercises = 40-45 steps.
    
    CRITICAL: You MUST follow this JSON Schema exactly:
    
    ${schemaString}
    
    IMPORTANT RULES:
    - Content steps MUST have type: "content" and a "content" object with "title" (object with "english" and optional "arabic"), "text" (string), and optional "examples" (array)
    - CRITICAL: Use diacritical marks (tashkeel/harakat) SPARINGLY in Arabic text - only when needed for pronunciation clarity. Include marks when: distinguishing gender (male vs female), clarifying ambiguous words, or teaching specific pronunciation patterns. Do NOT add marks to every word - use them strategically.
    - When teaching gender distinctions (male vs female) or other pronunciation differences, include diacritical marks ONLY on the distinguishing letters. DO NOT explain what the marks mean - students can reference the diacritics guide modal.
    - Example: When teaching "إزيك؟" (to male) vs "إزيك؟" (to female), include diacritical marks ONLY on the last letter: "إزيكَ؟" (male - with فتحة) vs "إزيكِ؟" (female - with كسرة). Don't mark every letter.
    - Practice sentence steps MUST have type: "practice-sentence" and a "sentence" object with "arabic", "english", and "transliteration" strings. Include an optional "context" field to explain the sentence.
    - Practice sentences should use vocabulary and phrases taught in the previous 3 content steps. Make them practical and contextual.
    - Exercise steps MUST have type: "exercise", "exerciseType" (one of: "multiple-choice", "fill-in-blank", "matching"), "question" (string), "options" (array of objects with "id", "text", "isCorrect"), "correctAnswerId" (string matching one of the option IDs), and a REQUIRED "hint" object
    - CRITICAL: The "question" field MUST be in English ONLY. Do NOT include Arabic text in the question. Students read the question in English and select the correct Arabic answer from the options.
    - CRITICAL: All option texts in exercises MUST be in Arabic script (NOT transliteration, NOT English). Students practice reading and recognizing Arabic.
    - Example CORRECT format: Question: "What is the Arabic phrase for 'Hello'?" (English) → Options: ["السلام عليكم", "صباح الخير", "مساء الخير"] (Arabic)
    - Example INCORRECT format: Question: "What is the meaning of 'السلام عليكم'?" → This is wrong because it includes Arabic in the question.
    - For fill-in-blank: The question should be in English describing what to fill in. The blank can be represented as "___" or "[blank]". Example: "Complete the sentence: I am going ___ school" where options are Arabic prepositions like ["إلى", "في", "من"].
    - CRITICAL: Each option text in multiple-choice exercises MUST be UNIQUE - no duplicate options. Ensure all options are distinct from each other.
    - CRITICAL: Arabic text fields (arabic, options.text, etc.) should use diacritical marks SPARINGLY - only when needed for pronunciation clarity. Be clean Arabic text ONLY - no grammatical markers in parentheses like "(لمذكر)", "(لمؤنث)", "(للذكر)", "(للأنثى)", or any similar annotations.
    - ALL exercises MUST include a "hint" object with "transliteration" (required string) and optional "arabic" field. The "transliteration" field provides the phonetic spelling of the CORRECT Arabic answer. The "arabic" field should use diacritical marks sparingly. DO NOT include "diacriticalExplanation" - students can reference the diacritics guide modal.
    - Example: If the correct answer is "السلام عليكم" (Arabic), the hint.transliteration should be "As-salamu alaykum" (phonetic spelling), and hint.arabic should be "السلام عليكم" (with marks only if needed for clarity).
    - For fill-in-blank exercises: If the question contains a predicate like "il" (إل) or similar particles in the non-blank part, DO NOT include that predicate in any of the answer options. Only provide the word/phrase that fills the blank, without repeating the predicate.
    - Example: If the question is "أنا ذاهب __ المدرسة" (I am going __ school), and "il" (إل) appears before the blank, the options should be words like "إلى", "في", "من" - NOT "إلى إل", "في إل", etc.
    - The root object MUST have "topicId" (string), "title" (string), "dialect" (string), and "steps" (array)
    - Output ONLY valid JSON - no markdown code blocks, no extra text, no comments
    - Ensure all required fields are present and match the schema types exactly
    `;

		const response = await generateContentWithRetry(ai, {
			model: "gemini-2.5-flash",
			contents: prompt,
			// @ts-expect-error - generationConfig is valid but types may be outdated
			generationConfig: {
				temperature: 0.7,
				maxOutputTokens: 16000,
				responseMimeType: 'application/json',
				responseJsonSchema: lessonSchema.jsonSchema
			}
		});

		const responseText = response.text;
		if (!responseText) {
			return {
				success: false,
				error: 'No content generated from API',
				duration: Date.now() - startTime
			};
		}

		let lessonData = parseJsonFromGeminiResponse(responseText, lessonSchema.zodSchema);
		
		if (!lessonData) {
			return {
				success: false,
				error: 'Parsed lesson data is null or undefined',
				duration: Date.now() - startTime
			};
		}

		// Inject the ID and Dialect to be safe
		lessonData.topicId = topicId;
		lessonData.dialect = dialect;

		await saveLesson(lessonData);

		return {
			success: true,
			lesson: lessonData,
			duration: Date.now() - startTime
		};

	} catch (error) {
		writeDebugLog(topicId, {
			stage: 'error',
			errorType: error instanceof Error ? error.constructor.name : typeof error,
			errorMessage: error instanceof Error ? error.message : String(error),
			errorStack: error instanceof Error ? error.stack : 'No stack trace',
			duration: Date.now() - startTime
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
			duration: Date.now() - startTime
		};
	}
}

export const POST = async ({ request }) => {
	const startTime = Date.now();
	const { dialect, moduleIds, generateAll } = await request.json();

	if (!dialect) {
		return json({ error: 'Dialect is required' }, { status: 400 });
	}

	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) {
		return json({ error: 'API key not configured' }, { status: 500 });
	}

	const ai = new GoogleGenAI({ apiKey });
	const lessonSchema = createLessonSchema();

	// Collect all topics to generate
	const topicsToGenerate: Array<{ topicId: string; moduleId: string; title: string }> = [];

	if (generateAll) {
		// Generate all topics from all modules
		for (const module of curriculum) {
			for (const topic of module.topics) {
				topicsToGenerate.push({
					topicId: topic.id,
					moduleId: module.id,
					title: topic.title
				});
			}
		}
	} else if (moduleIds && Array.isArray(moduleIds) && moduleIds.length > 0) {
		// Generate topics from specified modules
		for (const moduleId of moduleIds) {
			const module = curriculum.find(m => m.id === moduleId);
			if (module) {
				for (const topic of module.topics) {
					topicsToGenerate.push({
						topicId: topic.id,
						moduleId: module.id,
						title: topic.title
					});
				}
			}
		}
	} else {
		return json({ error: 'Either generateAll or moduleIds array must be provided' }, { status: 400 });
	}

	console.log(`[Batch Generator] Starting generation of ${topicsToGenerate.length} lessons for dialect: ${dialect}`);

	const results: Array<{
		topicId: string;
		moduleId: string;
		title: string;
		success: boolean;
		skipped?: boolean;
		error?: string;
		duration: number;
	}> = [];

	// Configuration for exponential backoff
	const BASE_DELAY_MS = 2000; // Start with 2 seconds
	const MAX_DELAY_MS = 30000; // Max 30 seconds
	const BACKOFF_MULTIPLIER = 1.5; // Multiply delay by this on each retry
	let currentDelay = BASE_DELAY_MS;

	for (let i = 0; i < topicsToGenerate.length; i++) {
		const { topicId, moduleId, title } = topicsToGenerate[i];
		
		console.log(`[Batch Generator] [${i + 1}/${topicsToGenerate.length}] Generating lesson: ${title} (${topicId})`);

		// Apply backoff delay (except for first request)
		if (i > 0) {
			console.log(`[Batch Generator] Waiting ${currentDelay}ms before next request...`);
			await sleep(currentDelay);
		}

		const result = await generateSingleLesson(topicId, dialect, ai, lessonSchema);
		
		results.push({
			topicId,
			moduleId,
			title,
			...result
		});

		// Update delay based on result
		if (result.success) {
			if (result.skipped) {
				// Skipped (already exists): keep current delay, no API call was made
				console.log(`[Batch Generator] Lesson ${topicId} was skipped (already exists)`);
			} else {
				// Successfully generated: reduce delay slightly (but not below base)
				currentDelay = Math.max(BASE_DELAY_MS, currentDelay * 0.9);
			}
		} else {
			// Failure: increase delay exponentially
			currentDelay = Math.min(MAX_DELAY_MS, currentDelay * BACKOFF_MULTIPLIER);
			console.log(`[Batch Generator] Generation failed for ${topicId}, increasing delay to ${currentDelay}ms`);
		}
	}

	const totalDuration = Date.now() - startTime;
	const successCount = results.filter(r => r.success && !r.skipped).length;
	const skippedCount = results.filter(r => r.skipped).length;
	const failureCount = results.filter(r => !r.success).length;

	console.log(`[Batch Generator] Completed! Generated: ${successCount}, Skipped: ${skippedCount}, Failed: ${failureCount}, Total time: ${totalDuration}ms`);

	return json({
		success: true,
		summary: {
			total: topicsToGenerate.length,
			generated: successCount,
			skipped: skippedCount,
			failed: failureCount,
			totalDuration
		},
		results
	});
};

