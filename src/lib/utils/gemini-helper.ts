/**
 * Helper functions for consistent Gemini API calls with structured outputs
 * Ensures all calls use proper schema validation and error handling
 */

import type { GoogleGenAI } from '@google/genai';
import type { z } from 'zod';
import { parseJsonFromGeminiResponse } from './gemini-json-parser';
import { generateContentWithRetry } from './gemini-api-retry';

interface GeminiCallOptions {
	model?: string;
	temperature?: number;
	topP?: number;
	maxOutputTokens?: number;
}

/**
 * Makes a Gemini API call with structured output and Zod validation
 * Includes automatic retry with exponential backoff for 503 and other 5xx errors
 * 
 * @param ai - GoogleGenAI instance
 * @param prompt - The prompt to send to Gemini
 * @param zodSchema - Zod schema for validation (must have jsonSchema property)
 * @param options - Optional generation config
 * @returns Parsed and validated response
 */
export async function callGeminiWithSchema<T>(
	ai: GoogleGenAI,
	prompt: string,
	zodSchema: { zodSchema: z.ZodSchema<T>; jsonSchema: unknown },
	options: GeminiCallOptions = {}
): Promise<T> {
	const {
		model = 'gemini-3-flash-preview',
		temperature = 0.7,
		topP,
		maxOutputTokens
	} = options;

	// Enhanced prompt with schema and strict formatting instructions
	const schemaString = JSON.stringify(zodSchema.jsonSchema, null, 2);
	const enhancedPrompt = `${prompt}

CRITICAL: You must return a valid JSON object exactly matching this schema:
${schemaString}

IMPORTANT: 
1. Return PURE JSON only.
2. Do NOT wrap the response in markdown code blocks (no \`\`\`json ... \`\`\`).
3. Do NOT include any explanations or other text.
4. Ensure the response is valid JSON that can be parsed by JSON.parse().`;

	// Use retry wrapper for automatic retry on 503/5xx errors
	const response = await generateContentWithRetry(ai, {
		model,
		contents: enhancedPrompt,
		// @ts-expect-error - generationConfig is valid but types may be outdated
		generationConfig: {
			temperature,
			...(topP !== undefined && { topP }),
			...(maxOutputTokens !== undefined && { maxOutputTokens }),
			responseMimeType: 'application/json',
			responseJsonSchema: zodSchema.jsonSchema
		}
	});

	const content = response.text;
	if (!content) {
		throw new Error('No content received from Gemini');
	}

	// Use parseJsonFromGeminiResponse which handles markdown code blocks if present
	return parseJsonFromGeminiResponse(content, zodSchema.zodSchema);
}

