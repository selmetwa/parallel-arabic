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
	console.log('[cleanJsonResponse] Trimmed starts with ```:', trimmed.startsWith('```'));
	console.log('[cleanJsonResponse] Trimmed ends with ```:', trimmed.endsWith(endMarker));
	
	// Check if response is wrapped in markdown code blocks
	// Handle both ```json and ``` cases
	const hasStartMarker = trimmed.toLowerCase().startsWith(startMarker.toLowerCase()) || trimmed.startsWith('```');
	const hasEndMarker = trimmed.endsWith(endMarker);
	
	if (!hasStartMarker || !hasEndMarker) {
		console.log('[cleanJsonResponse] Response does not appear to be wrapped in markdown code blocks, returning original');
		return response;
	}
	
	try {
		// Find the first occurrence of the start marker (case-insensitive search)
		const lowerResponse = response.toLowerCase();
		const startMarkerLower = startMarker.toLowerCase();
		let startIndex = lowerResponse.indexOf(startMarkerLower);
		
		// If ```json not found, try just ```
		if (startIndex === -1) {
			startIndex = response.indexOf('```');
		}
		
		console.log('[cleanJsonResponse] Start marker index:', startIndex);
		
		if (startIndex === -1) {
			// No start marker found, return original
			console.log('[cleanJsonResponse] Start marker not found, returning original');
			return response;
		}
		
		// Determine the actual start of JSON content
		// If it's ```json, skip past it; if it's just ```, skip past that
		let jsonStart: number;
		if (lowerResponse.substring(startIndex).startsWith(startMarkerLower)) {
			jsonStart = startIndex + startMarker.length;
		} else {
			jsonStart = startIndex + 3; // Skip past ```
		}
		
		// Skip any whitespace/newlines after the start marker
		while (jsonStart < response.length && /\s/.test(response[jsonStart])) {
			jsonStart++;
		}
		
		console.log('[cleanJsonResponse] JSON content starts at index:', jsonStart);
		
		// Find the last occurrence of the end marker (to handle multiple ``` in content)
		let endIndex = response.lastIndexOf(endMarker);
		console.log('[cleanJsonResponse] End marker (last) index:', endIndex);
		
		// If we found an end marker, make sure we're not including trailing characters after it
		if (endIndex !== -1) {
			// Skip past the ``` marker (3 characters)
			const afterEndMarker = endIndex + 3;
			// Check if there are any non-whitespace characters after the end marker
			const remainingText = response.substring(afterEndMarker);
			const hasTrailingContent = remainingText.trim().length > 0;
			
			if (hasTrailingContent) {
				console.log('[cleanJsonResponse] Found trailing content after end marker, trimming it');
				console.log('[cleanJsonResponse] Trailing content:', remainingText.substring(0, 100));
			}
		}
		
		// Ensure the start marker comes before the end marker
		if (endIndex !== -1 && jsonStart < endIndex) {
			const contentSlice = response.substring(jsonStart, endIndex);
			const trimmedSlice = contentSlice.trim();
			console.log('[cleanJsonResponse] Extracted content length:', trimmedSlice.length);
			console.log('[cleanJsonResponse] Extracted content first 200 chars:', trimmedSlice.substring(0, 200));
			
			// Verify we extracted something meaningful
			if (trimmedSlice.length === 0) {
				console.warn('[cleanJsonResponse] Extracted content is empty, returning original');
				return response;
			}
			
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
	// Handle case where data is an object with a single property containing the array
	// e.g. { translations: [...] } or { dialects: [...] } or { translations: {egyptian_arabic: {...}} }
	let arrayData = data;
	if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
		// Check for specific known array properties first
		const record = data as Record<string, unknown>;
		
		// Handle translations as an object (e.g., {translations: {egyptian_arabic: {...}}})
		if (record.translations && typeof record.translations === 'object' && !Array.isArray(record.translations)) {
			console.log('[normalizeArrayToObject] Found "translations" object property');
			const translationsObj = record.translations as Record<string, unknown>;
			
			// Map Gemini's key names to our expected keys
			const keyMap: Record<string, string> = {
				'egyptian_arabic': 'egyptian',
				'moroccan_darija': 'darija',
				'levantine_arabic': 'levantine',
				'modern_standard_arabic': 'fusha',
				'fusha': 'fusha'
			};
			
			const normalized: Record<string, unknown> = {};
			let hasDialectStructure = false;
			
			for (const [key, val] of Object.entries(translationsObj)) {
				const mappedKey = keyMap[key] || key;
				// Check if this looks like a dialect entry (has arabic_script and transliteration)
				if (val && typeof val === 'object' && 'arabic_script' in val && 'transliteration' in val) {
					hasDialectStructure = true;
					const dialectVal = val as Record<string, unknown>;
					normalized[mappedKey] = {
						arabic: dialectVal.arabic_script,
						transliteration: dialectVal.transliteration
					};
				} else if (val && typeof val === 'object' && 'arabic' in val && 'transliteration' in val) {
					// Already in correct format
					hasDialectStructure = true;
					normalized[mappedKey] = val;
				}
			}
			
			if (hasDialectStructure) {
				console.log('[normalizeArrayToObject] Successfully transformed nested translations object');
				return normalized;
			}
		}
		
		if (Array.isArray(record.translations)) {
			console.log('[normalizeArrayToObject] Found "translations" array property');
			arrayData = record.translations;
		} else if (Array.isArray(record.dialects)) {
			console.log('[normalizeArrayToObject] Found "dialects" array property');
			arrayData = record.dialects;
		} else {
			// Fallback to checking if there's only one property and it's an array
			const keys = Object.keys(data);
			if (keys.length === 1) {
				const value = record[keys[0]];
				if (Array.isArray(value)) {
					console.log('[normalizeArrayToObject] Nested array detected in property:', keys[0]);
					arrayData = value;
				}
			}
		}
	}

	if (!Array.isArray(arrayData) || arrayData.length === 0) {
		return data;
	}

	// Check if array items match the expected structure (have arabic, english, transliteration)
	const firstItem = arrayData[0];
	if (firstItem && typeof firstItem === 'object') {
		// Case 1: Standard sentence/word structure
	if (
		'arabic' in firstItem &&
		'english' in firstItem &&
		'transliteration' in firstItem
	) {
		// Try wrapping as sentences or words
		// Common property names used in our schemas
		const candidates = [
				{ sentences: arrayData },
				{ words: arrayData }
		];
		
		console.log('[normalizeArrayToObject] Array detected, trying to wrap as object...');
			console.log('[normalizeArrayToObject] Array length:', arrayData.length);
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

		// Case 2: Dialect comparison structure
		// Gemini sometimes returns an array of objects with variety_name, dialect, or dialect_name instead of a keyed object
		const hasVarietyName = 'variety_name' in firstItem;
		const hasDialect = 'dialect' in firstItem;
		const hasDialectName = 'dialect_name' in firstItem;
		
		if ((hasVarietyName || hasDialect || hasDialectName) && 'arabic_script' in firstItem && 'transliteration' in firstItem) {
			console.log('[normalizeArrayToObject] Dialect comparison array detected, transforming to object...');
			
			const dialectMap: Record<string, string> = {
				'Modern Standard Arabic (Fusha)': 'fusha',
				'Egyptian Arabic': 'egyptian',
				'Moroccan Darija': 'darija',
				'Levantine Arabic': 'levantine'
			};

			const normalized: Record<string, { arabic: string; transliteration: string }> = {};
			
			// Cast data to array of objects since we checked firstItem
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const items = arrayData as Array<any>;
			
			for (const item of items) {
				const dialectName = item.variety_name || item.dialect || item.dialect_name;
				const key = dialectMap[dialectName];
				if (key) {
					normalized[key] = {
						arabic: item.arabic_script,
						transliteration: item.transliteration
					};
				}
			}
			
			// Check if we have all required keys
			const requiredKeys = ['fusha', 'egyptian', 'darija', 'levantine'];
			const hasAllKeys = requiredKeys.every(k => k in normalized);
			
			if (hasAllKeys) {
				console.log('[normalizeArrayToObject] Successfully transformed dialect array to object');
				return normalized;
			} else {
				console.warn('[normalizeArrayToObject] Missing keys in transformed dialect object:', 
					requiredKeys.filter(k => !(k in normalized)));
			}
		}
	}

	return data;
}

/**
 * Extracts error context from JSON parsing errors
 * Helps identify the exact location and surrounding content where parsing failed
 */
function getJsonErrorContext(text: string, error: Error): string {
	const errorMessage = error.message;
	// Extract position from error message (e.g., "at position 3054")
	const positionMatch = errorMessage.match(/position (\d+)/);
	const lineMatch = errorMessage.match(/line (\d+)/);
	const columnMatch = errorMessage.match(/column (\d+)/);
	
	let contextInfo = `Error: ${errorMessage}\n`;
	
	if (positionMatch) {
		const position = parseInt(positionMatch[1], 10);
		const start = Math.max(0, position - 100);
		const end = Math.min(text.length, position + 100);
		const before = text.substring(start, position);
		const after = text.substring(position, end);
		
		contextInfo += `\nContext around position ${position}:\n`;
		contextInfo += `BEFORE: ...${before}\n`;
		contextInfo += `AFTER: ${after}...\n`;
	}
	
	if (lineMatch && columnMatch) {
		const lineNum = parseInt(lineMatch[1], 10);
		const colNum = parseInt(columnMatch[1], 10);
		const lines = text.split('\n');
		
		if (lineNum > 0 && lineNum <= lines.length) {
			const problemLine = lines[lineNum - 1];
			contextInfo += `\nLine ${lineNum}: ${problemLine}\n`;
			contextInfo += ' '.repeat(9 + colNum) + '^\n';
			
			// Show surrounding lines for context
			if (lineNum > 1) {
				contextInfo += `Line ${lineNum - 1}: ${lines[lineNum - 2]}\n`;
			}
			if (lineNum < lines.length) {
				contextInfo += `Line ${lineNum + 1}: ${lines[lineNum]}\n`;
			}
		}
	}
	
	return contextInfo;
}

/**
 * Attempts to repair common JSON formatting issues
 * Handles: trailing commas, unescaped newlines, etc.
 */
function attemptJsonRepair(text: string): string {
	console.log('[JSON Repair] Attempting to repair JSON...');
	let repaired = text;
	
	// Remove trailing commas before closing braces/brackets
	// This is a common issue with LLM-generated JSON
	repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
	
	console.log('[JSON Repair] Removed trailing commas');
	
	return repaired;
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
 * - Trailing commas and other common formatting issues
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

	// Strategy 1: Check if response is wrapped in markdown code blocks FIRST
	// This is a known issue with Gemini 2.5 models even with structured outputs
	const trimmed = text.trim();
	const isWrappedInMarkdown = trimmed.startsWith('```') && (trimmed.endsWith('```') || trimmed.includes('```'));
	
	let textToParse = text;
	if (isWrappedInMarkdown) {
		console.log('[Gemini JSON Parser] Detected markdown code blocks, cleaning first...');
		textToParse = cleanJsonResponse(text);
		// Trim again after cleaning to remove any trailing whitespace or characters
		textToParse = textToParse.trim();
		// Remove any trailing backticks or quotes that might have been left behind
		textToParse = textToParse.replace(/[`"]+$/, '');
		console.log('[Gemini JSON Parser] Cleaned text length:', textToParse.length);
		console.log('[Gemini JSON Parser] Text changed after cleaning:', textToParse !== text.trim());
		console.log('[Gemini JSON Parser] Cleaned text ends with:', textToParse.substring(Math.max(0, textToParse.length - 50)));
	}
	
	// Strategy 2: Standard approach - direct JSON.parse + zodSchema.parse
	console.log('[Gemini JSON Parser] Attempting JSON.parse...');
	try {
		const parsed = JSON.parse(textToParse);
		console.log('[Gemini JSON Parser] Parse successful, validating with Zod...');
		console.log('[Gemini JSON Parser] Parsed type:', Array.isArray(parsed) ? 'array' : typeof parsed);
		
		// Try direct validation first
		try {
			const validated = zodSchema.parse(parsed);
			console.log('[Gemini JSON Parser] Zod validation successful!');
			return validated;
		} catch (validationError) {
			// If validation fails, try normalizing it (handles arrays and objects with nested arrays)
			console.log('[Gemini JSON Parser] Validation failed, attempting normalization...');
			const normalized = normalizeArrayToObject(parsed, zodSchema);
			if (normalized !== parsed) {
				console.log('[Gemini JSON Parser] Normalized structure, retrying validation...');
				const validated = zodSchema.parse(normalized);
				console.log('[Gemini JSON Parser] Zod validation successful after normalization!');
				return validated;
			}
			throw validationError;
		}
	} catch (e) {
		console.warn('[Gemini JSON Parser] Parse/validation failed:', e instanceof Error ? e.message : String(e));
		
		// Strategy 3: Try repairing common JSON issues (fallback for all cases)
		console.log('[Gemini JSON Parser] Attempting JSON repair as fallback...');
		try {
			let cleaned = cleanJsonResponse(text);
			// Trim and remove trailing characters before repair
			cleaned = cleaned.trim().replace(/[`"]+$/, '');
			const repaired = attemptJsonRepair(cleaned);
			console.log('[Gemini JSON Parser] Repaired text length:', repaired.length);
			console.log('[Gemini JSON Parser] Text changed after repair:', repaired !== cleaned);
			
			const parsed = JSON.parse(repaired);
			console.log('[Gemini JSON Parser] Repaired parse successful, validating with Zod...');
			console.log('[Gemini JSON Parser] Parsed type:', Array.isArray(parsed) ? 'array' : typeof parsed);
			
			// Try validation, with normalization if needed
			try {
				const validated = zodSchema.parse(parsed);
				console.log('[Gemini JSON Parser] Zod validation successful after repair!');
				return validated;
			} catch (validationError) {
				// If validation fails, try normalizing it (handles arrays and objects with nested arrays)
				console.log('[Gemini JSON Parser] Validation failed, attempting normalization...');
				const normalized = normalizeArrayToObject(parsed, zodSchema);
				if (normalized !== parsed) {
					console.log('[Gemini JSON Parser] Normalized structure, retrying validation...');
					const validated = zodSchema.parse(normalized);
					console.log('[Gemini JSON Parser] Zod validation successful after repair + normalization!');
					return validated;
				}
				throw validationError;
			}
		} catch (repairError) {
			// If all strategies fail, log detailed error context and throw
			console.error('[Gemini JSON Parser] All parsing strategies failed!');
			const preview = text.length > 1000 ? text.substring(0, 1000) + '...' : text;
			console.error('[Gemini JSON Parser] Original text preview:', preview);
			console.error('[Gemini JSON Parser] Direct parse error:', e instanceof Error ? e.message : String(e));
			console.error('[Gemini JSON Parser] Repair parse error:', repairError instanceof Error ? repairError.message : String(repairError));
			
			// Show detailed error context for the repair attempt (most likely to succeed)
			if (repairError instanceof Error) {
				try {
					const cleaned = cleanJsonResponse(text);
					const repaired = attemptJsonRepair(cleaned);
					const errorContext = getJsonErrorContext(repaired, repairError);
					console.error('[Gemini JSON Parser] Detailed error context:\n', errorContext);
					
					// Log the full repaired text for debugging
					console.error('[Gemini JSON Parser] Full repaired text (first 2000 chars):', repaired.substring(0, 2000));
					if (repaired.length > 2000) {
						console.error('[Gemini JSON Parser] Full repaired text (last 1000 chars):', repaired.substring(repaired.length - 1000));
					}
				} catch (contextError) {
					console.error('[Gemini JSON Parser] Error generating context:', contextError);
				}
			}
			
			throw new Error(`Failed to parse JSON from Gemini response: ${text.substring(0, 200)}...`);
		}
	}
}
