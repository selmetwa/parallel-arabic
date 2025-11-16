/**
 * Helper function to parse JSON from Gemini response, handling markdown code blocks and malformed JSON
 * Uses jsonrepair library for robust JSON repair and Zod for schema validation
 */
import { jsonrepair } from 'jsonrepair';
import type { z } from 'zod';

/**
 * Normalizes data structure to match common schema patterns
 * Handles cases where Gemini returns an array instead of an object with a property
 */
function normalizeDataStructure(data: unknown, zodSchema?: z.ZodSchema<unknown>): unknown {
	// If data is an array, try to wrap it in common structures
	if (Array.isArray(data) && data.length > 0) {
		const firstItem = data[0];
		
		// Check if it looks like sentences/words (has arabic, english, transliteration)
		if (
			firstItem &&
			typeof firstItem === 'object' &&
			'arabic' in firstItem &&
			'english' in firstItem &&
			'transliteration' in firstItem
		) {
			// Try both common property names
			const candidates = [
				{ sentences: data },
				{ words: data }
			];
			
			// If we have a schema, try each candidate and return the first that validates
			if (zodSchema) {
				for (const candidate of candidates) {
					const result = zodSchema.safeParse(candidate);
					if (result.success) {
						return candidate;
					}
				}
			}
			
			// Default to sentences if no schema or none matched
			return { sentences: data };
		}
		
		// If it's just strings, wrap as sentences
		if (typeof firstItem === 'string') {
			return { sentences: data };
		}
	}
	return data;
}

/**
 * Validates parsed JSON against a Zod schema if provided
 * Attempts to normalize the data structure if initial validation fails
 */
function validateAgainstSchema<T>(data: unknown, zodSchema?: z.ZodSchema<T>): T {
	if (!zodSchema) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return data as T; // No validation if no schema provided
	}

	try {
		// First try direct validation
		let result = zodSchema.safeParse(data);
		
		// If validation fails and data is an array, try normalizing it
		if (!result.success && Array.isArray(data)) {
			const normalized = normalizeDataStructure(data, zodSchema);
			if (normalized !== data) {
				result = zodSchema.safeParse(normalized);
				if (result.success) {
					return result.data;
				}
			}
		}
		
		if (!result.success) {
			const errors = result.error.errors.map(err => 
				`${err.path.join('.') || 'root'}: ${err.message}`
			).join(', ');
			throw new Error(`Schema validation failed: ${errors}`);
		}
		return result.data;
	} catch (error) {
		if (error instanceof Error && error.message.includes('Schema validation failed')) {
			throw error;
		}
		// If Zod parsing fails for other reasons, log warning but don't fail parsing
		console.warn('Schema validation error (non-fatal):', error);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return data as T;
	}
}

/**
 * Cleans text by removing markdown code blocks
 */
function removeMarkdownCodeBlocks(text: string): string {
	let cleaned = text.trim();
	
	// Remove opening ```json or ``` (case insensitive, with optional whitespace)
	cleaned = cleaned.replace(/^```json\s*/i, '');
	cleaned = cleaned.replace(/^```\s*/, '');
	
	// Remove closing ``` (can be on same line or new line)
	cleaned = cleaned.replace(/\s*```\s*$/gm, '');
	cleaned = cleaned.replace(/\n\s*```\s*$/gm, '');
	
	return cleaned.trim();
}

/**
 * Extracts JSON from text by finding JSON object/array boundaries
 */
function extractJsonBoundaries(text: string): string | null {
	// Try to find object boundaries first
	const objectStart = text.indexOf('{');
	const objectEnd = text.lastIndexOf('}');
	
	if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
		return text.substring(objectStart, objectEnd + 1);
	}
	
	// If no object found, try array boundaries
	const arrayStart = text.indexOf('[');
	const arrayEnd = text.lastIndexOf(']');
	
	if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
		return text.substring(arrayStart, arrayEnd + 1);
	}
	
	return null;
}

/**
 * Parses JSON from Gemini response with optional Zod schema validation
 * 
 * @param text - The raw text response from Gemini
 * @param zodSchema - Optional Zod schema to validate against
 * @returns Parsed and validated JSON object
 * @throws Error if parsing fails or validation fails
 */
export function parseJsonFromGeminiResponse<T = unknown>(
	text: string, 
	zodSchema?: z.ZodSchema<T>
): T {
	if (!text) {
		throw new Error('No text provided');
	}

	// Strategy 1: Try direct JSON.parse() first (most common case with structured outputs)
	try {
		const parsed = JSON.parse(text);
		return validateAgainstSchema(parsed, zodSchema);
	} catch (e) {
		// If direct parse fails, continue to repair strategies
	}

	// Strategy 2: Try parsing after removing markdown code blocks
	try {
		const cleaned = removeMarkdownCodeBlocks(text);
		const parsed = JSON.parse(cleaned);
		return validateAgainstSchema(parsed, zodSchema);
	} catch (e) {
		// Continue to repair strategy
	}

	// Strategy 3: Use jsonrepair library to fix malformed JSON
	try {
		const cleaned = removeMarkdownCodeBlocks(text);
		const repaired = jsonrepair(cleaned);
		const parsed = JSON.parse(repaired);
		return validateAgainstSchema(parsed, zodSchema);
	} catch (e) {
		// Continue to boundary extraction
	}

	// Strategy 4: Try extracting JSON boundaries and repairing
	try {
		const cleaned = removeMarkdownCodeBlocks(text);
		const extracted = extractJsonBoundaries(cleaned);
		
		if (extracted) {
			const repaired = jsonrepair(extracted);
			const parsed = JSON.parse(repaired);
			return validateAgainstSchema(parsed, zodSchema);
		}
	} catch (e) {
		// Fall through to final error
	}

	// If all strategies fail, log error details and throw
	const preview = text.length > 1000 ? text.substring(0, 1000) + '...' : text;
	console.error('Failed to parse JSON after all attempts. Preview:', preview);
	throw new Error(`Failed to parse JSON from Gemini response: ${text.substring(0, 200)}...`);
}
