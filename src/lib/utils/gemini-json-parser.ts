/**
 * Helper function to parse JSON from Gemini structured output responses
 * Uses standard approach: zodSchema.parse(JSON.parse(text))
 * With minimal fallback for edge cases where markdown code blocks might appear
 */
import type { z } from 'zod';

/**
 * Cleans the response string to extract a JSON block if it's wrapped in markdown code fences.
 * 
 * This is a known issue with Gemini 2.5 models where they occasionally wrap JSON responses
 * in markdown code blocks (```json ... ```) even when using structured outputs.
 * 
 * Adapted from: https://github.com/googleapis/python-genai/issues/637
 * 
 * @param response - The raw response string potentially containing a JSON block wrapped in markdown
 * @returns The extracted and cleaned JSON string, or the original string if no valid JSON block is found
 */
function cleanJsonResponse(response: string): string {
	console.log('[cleanJsonResponse] Starting cleanup...');
	const startMarker = '```json';
	const endMarker = '```';
	const trimmed = response.trim();
	
	console.log('[cleanJsonResponse] Response length:', response.length);
	console.log('[cleanJsonResponse] Trimmed ends with ```:', trimmed.endsWith(endMarker));
	
	// Only proceed if the string ends with the end marker
	if (!trimmed.endsWith(endMarker)) {
		console.log('[cleanJsonResponse] Response does not end with ```, returning original');
		return response;
	}
	
	try {
		// Find the first occurrence of the start marker (case-insensitive search)
		const lowerResponse = response.toLowerCase();
		const startMarkerLower = startMarker.toLowerCase();
		const startIndex = lowerResponse.indexOf(startMarkerLower);
		
		console.log('[cleanJsonResponse] Start marker index:', startIndex);
		
		if (startIndex === -1) {
			// Start marker "```json" not found, return original
			console.log('[cleanJsonResponse] Start marker "```json" not found, returning original');
			return response;
		}
		
		// Calculate the actual start of the JSON content (after the marker)
		const jsonStart = startIndex + startMarker.length;
		console.log('[cleanJsonResponse] JSON content starts at index:', jsonStart);
		
		// Find the last occurrence of the end marker (to handle multiple ``` in content)
		const endIndex = response.lastIndexOf(endMarker);
		console.log('[cleanJsonResponse] End marker (last) index:', endIndex);
		
		// Ensure the start marker comes before the end marker
		if (jsonStart < endIndex) {
			const contentSlice = response.substring(jsonStart, endIndex);
			const trimmedSlice = contentSlice.trim();
			console.log('[cleanJsonResponse] Extracted content length:', trimmedSlice.length);
			console.log('[cleanJsonResponse] Extracted content first 200 chars:', trimmedSlice.substring(0, 200));
			return trimmedSlice;
		} else {
			// Start marker found after or at the end marker, malformed
			console.warn('[cleanJsonResponse] Start marker found after end marker, malformed. Returning original');
			return response;
		}
	} catch (error) {
		// If anything goes wrong, return the original response
		console.error('[cleanJsonResponse] Error during cleanup:', error);
		return response;
	}
}

/**
 * Normalizes data structure when Gemini returns an array but schema expects an object
 * Handles cases where Gemini returns [{...}] instead of { sentences: [{...}] } or { words: [{...}] }
 * 
 * @param data - The parsed data (should be an array)
 * @param zodSchema - The Zod schema to validate against
 * @returns Normalized data structure, or original data if normalization doesn't help
 */
function normalizeArrayToObject<T>(data: unknown, zodSchema: z.ZodSchema<T>): unknown {
	if (!Array.isArray(data) || data.length === 0) {
		return data;
	}

	// Check if array items match the expected structure (have arabic, english, transliteration)
	const firstItem = data[0];
	if (
		firstItem &&
		typeof firstItem === 'object' &&
		'arabic' in firstItem &&
		'english' in firstItem &&
		'transliteration' in firstItem
	) {
		// Try wrapping as sentences or words
		// Common property names used in our schemas
		const candidates = [
			{ sentences: data },
			{ words: data }
		];
		
		console.log('[normalizeArrayToObject] Array detected, trying to wrap as object...');
		console.log('[normalizeArrayToObject] Array length:', data.length);
		console.log('[normalizeArrayToObject] First item keys:', Object.keys(firstItem));
		
		// Try each candidate and return the first one that validates
		for (const candidate of candidates) {
			const result = zodSchema.safeParse(candidate);
			if (result.success) {
				console.log('[normalizeArrayToObject] Successfully normalized with property:', Object.keys(candidate)[0]);
				return candidate;
			}
		}
		
		// If none validate, default to sentences (most common case)
		console.log('[normalizeArrayToObject] No candidate validated, defaulting to sentences');
		return candidates[0];
	}

	return data;
}

/**
 * Parses JSON from Gemini structured output response with Zod schema validation
 * 
 * Structured outputs with responseMimeType: 'application/json' + responseJsonSchema
 * should guarantee pure JSON, so we use the standard approach from Gemini docs:
 * zodSchema.parse(JSON.parse(text))
 * 
 * Handles known issues:
 * - Markdown code blocks wrapping JSON (Gemini 2.5 models)
 * - Arrays returned instead of objects (e.g., [{...}] instead of { sentences: [{...}] })
 * 
 * @param text - The raw text response from Gemini
 * @param zodSchema - Zod schema to validate against
 * @returns Parsed and validated JSON object
 * @throws Error if parsing fails or validation fails
 */
export function parseJsonFromGeminiResponse<T = unknown>(
	text: string, 
	zodSchema?: z.ZodSchema<T>
): T {
	console.log('[Gemini JSON Parser] Starting parse...');
	console.log('[Gemini JSON Parser] Text length:', text.length);
	console.log('[Gemini JSON Parser] First 500 chars:', text.substring(0, 500));
	console.log('[Gemini JSON Parser] Last 200 chars:', text.substring(Math.max(0, text.length - 200)));
	console.log('[Gemini JSON Parser] Starts with ```:', text.trim().startsWith('```'));
	console.log('[Gemini JSON Parser] Ends with ```:', text.trim().endsWith('```'));
	
	if (!text) {
		console.error('[Gemini JSON Parser] Error: No text provided');
		throw new Error('No text provided');
	}

	if (!zodSchema) {
		console.error('[Gemini JSON Parser] Error: Zod schema is required');
		throw new Error('Zod schema is required for parsing');
	}

	// Strategy 1: Standard approach - direct JSON.parse + zodSchema.parse
	console.log('[Gemini JSON Parser] Attempting direct JSON.parse...');
	try {
		const parsed = JSON.parse(text);
		console.log('[Gemini JSON Parser] Direct parse successful, validating with Zod...');
		console.log('[Gemini JSON Parser] Parsed type:', Array.isArray(parsed) ? 'array' : typeof parsed);
		
		// Try direct validation first
		try {
			const validated = zodSchema.parse(parsed);
			console.log('[Gemini JSON Parser] Zod validation successful!');
			return validated;
		} catch (validationError) {
			// If validation fails and we have an array, try normalizing it
			if (Array.isArray(parsed)) {
				console.log('[Gemini JSON Parser] Validation failed with array, attempting normalization...');
				const normalized = normalizeArrayToObject(parsed, zodSchema);
				if (normalized !== parsed) {
					console.log('[Gemini JSON Parser] Normalized structure, retrying validation...');
					const validated = zodSchema.parse(normalized);
					console.log('[Gemini JSON Parser] Zod validation successful after normalization!');
					return validated;
				}
			}
			throw validationError;
		}
	} catch (e) {
		console.warn('[Gemini JSON Parser] Direct parse/validation failed:', e instanceof Error ? e.message : String(e));
		
		// If direct parse fails, try cleaning markdown code blocks (known issue with Gemini 2.5 models)
		// See: https://github.com/googleapis/python-genai/issues/637
		//      https://github.com/googleapis/js-genai/issues/976
		console.log('[Gemini JSON Parser] Attempting fallback: cleaning markdown code blocks...');
		try {
			const cleaned = cleanJsonResponse(text);
			console.log('[Gemini JSON Parser] Cleaned text length:', cleaned.length);
			console.log('[Gemini JSON Parser] Cleaned text first 500 chars:', cleaned.substring(0, 500));
			console.log('[Gemini JSON Parser] Cleaned text last 200 chars:', cleaned.substring(Math.max(0, cleaned.length - 200)));
			console.log('[Gemini JSON Parser] Text changed after cleaning:', cleaned !== text);
			
			const parsed = JSON.parse(cleaned);
			console.log('[Gemini JSON Parser] Cleaned parse successful, validating with Zod...');
			console.log('[Gemini JSON Parser] Parsed type:', Array.isArray(parsed) ? 'array' : typeof parsed);
			
			// Try validation, with normalization if needed
			try {
				const validated = zodSchema.parse(parsed);
				console.log('[Gemini JSON Parser] Zod validation successful after cleaning!');
				return validated;
			} catch (validationError) {
				// If validation fails and we have an array, try normalizing it
				if (Array.isArray(parsed)) {
					console.log('[Gemini JSON Parser] Validation failed with array, attempting normalization...');
					const normalized = normalizeArrayToObject(parsed, zodSchema);
					if (normalized !== parsed) {
						console.log('[Gemini JSON Parser] Normalized structure, retrying validation...');
						const validated = zodSchema.parse(normalized);
						console.log('[Gemini JSON Parser] Zod validation successful after cleaning + normalization!');
						return validated;
					}
				}
				throw validationError;
			}
		} catch (fallbackError) {
			// If both strategies fail, log error details and throw
			console.error('[Gemini JSON Parser] Both parsing strategies failed!');
			const preview = text.length > 1000 ? text.substring(0, 1000) + '...' : text;
			console.error('[Gemini JSON Parser] Original text preview:', preview);
			console.error('[Gemini JSON Parser] Direct parse error:', e instanceof Error ? e.message : String(e));
			console.error('[Gemini JSON Parser] Fallback parse error:', fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
			
			// Try to show what cleanJsonResponse returned
			try {
				const cleaned = cleanJsonResponse(text);
				console.error('[Gemini JSON Parser] Cleaned text that failed:', cleaned.substring(0, 500));
			} catch (cleanError) {
				console.error('[Gemini JSON Parser] Error during cleaning:', cleanError);
			}
			
			throw new Error(`Failed to parse JSON from Gemini response: ${text.substring(0, 200)}...`);
		}
	}
}
