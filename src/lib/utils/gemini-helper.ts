/**
 * Helper functions for consistent Gemini API calls with structured outputs
 * Ensures all calls use proper schema validation and error handling
 */

import type { GoogleGenAI } from '@google/genai';
import type { z } from 'zod';
import { parseJsonFromGeminiResponse } from './gemini-json-parser';

interface GeminiCallOptions {
	model?: string;
	temperature?: number;
	topP?: number;
	maxOutputTokens?: number;
}

/**
 * Makes a Gemini API call with structured output and Zod validation
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
		model = 'gemini-2.5-flash',
		temperature = 0.7,
		topP,
		maxOutputTokens
	} = options;

	const response = await ai.models.generateContent({
		model,
		contents: prompt,
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

