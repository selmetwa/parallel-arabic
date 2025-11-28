import { json } from '@sveltejs/kit';
import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';
import { curriculum } from '$lib/data/curriculum';
import { createLessonSchema } from '$lib/schemas/curriculum-schema';
import { saveLesson } from '$lib/helpers/lesson-file-helper';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import fs from 'fs';
import path from 'path';

/**
 * Write debug log to file in logs/lessons directory
 */
function writeDebugLog(topicId: string, logData: Record<string, unknown>) {
	try {
		// Create logs directory if it doesn't exist
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
		console.log(`📝 Debug log written to: ${logFile}`);
		return logFile;
	} catch (error) {
		console.error('Failed to write debug log:', error);
		return null;
	}
}

export const POST = async ({ request }) => {
    const startTime = Date.now();
    const { topicId, dialect } = await request.json();
    
    writeDebugLog(topicId || 'unknown', {
        stage: 'request_received',
        topicId,
        dialect,
        timestamp: new Date().toISOString()
    });
    console.log('[Lesson Generator] Request received');

    if (!topicId) {
        writeDebugLog('unknown', {
            stage: 'validation_error',
            error: 'Topic ID is required'
        });
        console.error('[Lesson Generator] Error: Topic ID is required');
        return json({ error: 'Topic ID is required' }, { status: 400 });
    }

    // Find topic details
    let topicTitle = '';
    let topicDescription = '';
    
    for (const module of curriculum) {
        const found = module.topics.find(t => t.id === topicId);
        if (found) {
            topicTitle = found.title;
            topicDescription = found.description;
            writeDebugLog(topicId, {
                stage: 'topic_found',
                module: module.title,
                topicTitle,
                topicDescription
            });
            console.log('[Lesson Generator] Topic found:', { module: module.title, topicTitle, topicDescription });
            break;
        }
    }

    if (!topicTitle) {
        writeDebugLog(topicId, {
            stage: 'validation_error',
            error: 'Invalid Topic ID',
            topicId
        });
        console.error('[Lesson Generator] Error: Invalid Topic ID:', topicId);
        return json({ error: 'Invalid Topic ID' }, { status: 400 });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
        writeDebugLog(topicId, {
            stage: 'config_error',
            error: 'GEMINI_API_KEY not configured'
        });
        console.error('[Lesson Generator] Error: GEMINI_API_KEY not configured');
        return json({ error: 'API key not configured' }, { status: 500 });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    console.log('[Lesson Generator] Gemini AI client initialized');

    // Create schema first so we can include it in the prompt
    const lessonSchema = createLessonSchema();
    const schemaString = JSON.stringify(lessonSchema.jsonSchema, null, 2);
    
    writeDebugLog(topicId, {
        stage: 'schema_created',
        jsonSchemaKeys: Object.keys(lessonSchema.jsonSchema)
    });
    console.log('[Lesson Generator] Schema created');

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

    writeDebugLog(topicId, {
        stage: 'prompt_created',
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 500),
        schemaIncluded: true
    });
    console.log('[Lesson Generator] Prompt created with schema, length:', prompt.length);

    try {
        writeDebugLog(topicId, {
            stage: 'schema_created',
            jsonSchemaKeys: Object.keys(lessonSchema.jsonSchema)
        });
        console.log('[Lesson Generator] Schema created');
        
        const apiCallStart = Date.now();
        writeDebugLog(topicId, {
            stage: 'api_call_start',
            model: 'gemini-2.5-flash',
            temperature: 0.7,
            maxOutputTokens: 16000
        });
        console.log('[Lesson Generator] Calling Gemini API with structured output...');
        
        const response = await generateContentWithRetry(ai, {
            model: "gemini-2.5-flash",
            contents: prompt,
            // @ts-expect-error - generationConfig is valid but types may be outdated
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 16000, // Large token limit for comprehensive lessons
                responseMimeType: 'application/json',
                responseJsonSchema: lessonSchema.jsonSchema
            }
        });
        const apiCallDuration = Date.now() - apiCallStart;
        
        const responseText = response.text;
        writeDebugLog(topicId, {
            stage: 'api_response_received',
            duration: apiCallDuration,
            responseLength: responseText?.length || 0,
            responsePreview: responseText?.substring(0, 1000) || 'No response',
            responseEnd: responseText?.substring(Math.max(0, (responseText?.length || 0) - 500)) || 'No response'
        });
        console.log('[Lesson Generator] API call completed in', apiCallDuration, 'ms');
        console.log('[Lesson Generator] Response received, length:', responseText?.length || 0);
        
        if (!responseText) {
            writeDebugLog(topicId, {
                stage: 'api_error',
                error: 'No content generated from API'
            });
            console.error('[Lesson Generator] Error: No content generated from API');
            throw new Error('No content generated');
        }

        const parseStart = Date.now();
        writeDebugLog(topicId, {
            stage: 'parsing_start',
            responseTextLength: responseText.length,
            responseTextStart: responseText.substring(0, 200),
            responseTextEnd: responseText.substring(Math.max(0, responseText.length - 200))
        });
        console.log('[Lesson Generator] Parsing and validating response...');
        
        let lessonData;
        try {
            lessonData = parseJsonFromGeminiResponse(responseText, lessonSchema.zodSchema);
            
            // Log successful parse
            if (!lessonData) {
                writeDebugLog(topicId, {
                    stage: 'parsing_error',
                    error: 'parseJsonFromGeminiResponse returned null/undefined without throwing',
                    responseTextLength: responseText.length,
                    responseTextPreview: responseText.substring(0, 1000),
                    responseTextEnd: responseText.substring(Math.max(0, responseText.length - 500))
                });
                throw new Error('Parsed lesson data is null or undefined - parser returned null without throwing');
            }
        } catch (parseError) {
            writeDebugLog(topicId, {
                stage: 'parsing_error',
                error: parseError instanceof Error ? parseError.message : String(parseError),
                errorStack: parseError instanceof Error ? parseError.stack : undefined,
                responseTextLength: responseText.length,
                responseTextStart: responseText.substring(0, 1000),
                responseTextEnd: responseText.substring(Math.max(0, responseText.length - 500)),
                responseTextMiddle: responseText.length > 2000 ? responseText.substring(1000, 2000) : undefined
            });
            console.error('[Lesson Generator] Parsing failed:', parseError);
            throw parseError;
        }
        
        const parseDuration = Date.now() - parseStart;
        
        writeDebugLog(topicId, {
            stage: 'parsing_complete',
            duration: parseDuration,
            parsedData: {
                topicId: lessonData.topicId,
                title: lessonData.title,
                dialect: lessonData.dialect,
                stepsCount: lessonData.steps?.length || 0
            }
        });
        console.log('[Lesson Generator] Parsing completed in', parseDuration, 'ms');
        
        // Inject the ID and Dialect to be safe
        lessonData.topicId = topicId;
        lessonData.dialect = dialect;

        const saveStart = Date.now();
        writeDebugLog(topicId, {
            stage: 'saving_start'
        });
        console.log('[Lesson Generator] Saving lesson to file...');
        
        await saveLesson(lessonData);
        const saveDuration = Date.now() - saveStart;
        
        const totalDuration = Date.now() - startTime;
        const summary = {
            topicId: lessonData.topicId,
            title: lessonData.title,
            stepsCount: lessonData.steps?.length || 0,
            contentSteps: lessonData.steps?.filter(s => s.type === 'content').length || 0,
            exerciseSteps: lessonData.steps?.filter(s => s.type === 'exercise').length || 0
        };
        
        writeDebugLog(topicId, {
            stage: 'success',
            totalDuration,
            saveDuration,
            summary
        });
        console.log('[Lesson Generator] Success! Total time:', totalDuration, 'ms');
        console.log('[Lesson Generator] Lesson summary:', summary);

        return json({ success: true, lesson: lessonData });

    } catch (error) {
        const totalDuration = Date.now() - startTime;
        const errorDetails = {
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : 'No stack trace',
            errorCause: error instanceof Error && 'cause' in error ? error.cause : undefined,
            totalDuration
        };
        
        writeDebugLog(topicId, {
            stage: 'error',
            ...errorDetails
        });
        
        console.error('[Lesson Generator] Error after', totalDuration, 'ms');
        console.error('[Lesson Generator] Error details:', errorDetails);
        
        return json({ 
            error: 'Failed to generate lesson', 
            details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 });
    }
};
