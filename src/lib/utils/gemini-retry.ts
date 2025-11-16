/**
 * Retry utility for Gemini API calls with exponential backoff
 * Retries on parse failures to handle transient issues
 */

import type { GoogleGenAI } from '@google/genai';
import type { z } from 'zod';

interface RetryOptions {
	maxRetries?: number;
	initialDelayMs?: number;
	maxDelayMs?: number;
	backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
	maxRetries: 2, // Total attempts = 1 initial + 2 retries = 3 attempts
	initialDelayMs: 500,
	maxDelayMs: 2000,
	backoffMultiplier: 2
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
	const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt);
	return Math.min(delay, options.maxDelayMs);
}

/**
 * Wraps a Gemini API call with retry logic on parse failures
 * 
 * @param ai - GoogleGenAI instance
 * @param generateFn - Function that calls Gemini API and returns response text
 * @param parseFn - Function that parses the response (should throw on parse failure)
 * @param zodSchema - Optional Zod schema for validation
 * @param options - Retry configuration options
 * @returns Parsed response data
 */
export async function retryGeminiCall<T>(
	ai: GoogleGenAI,
	generateFn: () => Promise<string>,
	parseFn: (text: string, zodSchema?: z.ZodSchema<T>) => T,
	zodSchema?: z.ZodSchema<T>,
	options: RetryOptions = {}
): Promise<T> {
	const retryOptions = { ...DEFAULT_OPTIONS, ...options };
	let lastError: Error | null = null;

	for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
		try {
			const responseText = await generateFn();
			
			if (!responseText) {
				throw new Error('Empty response from Gemini');
			}

			const parsed = parseFn(responseText, zodSchema);
			return parsed;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			
			// Don't retry on certain errors (e.g., validation errors that won't be fixed by retry)
			if (error instanceof Error) {
				// If it's a schema validation error, don't retry (structure issue, not transient)
				if (error.message.includes('Schema validation failed')) {
					throw error;
				}
				
				// If it's an API error (not a parse error), don't retry
				if (error.message.includes('API') || error.message.includes('rate limit')) {
					throw error;
				}
			}

			// If this was the last attempt, throw the error
			if (attempt === retryOptions.maxRetries) {
				console.error(`Gemini call failed after ${attempt + 1} attempts:`, lastError);
				throw lastError;
			}

			// Wait before retrying with exponential backoff
			const delay = calculateDelay(attempt, retryOptions);
			console.warn(`Gemini parse failed (attempt ${attempt + 1}/${retryOptions.maxRetries + 1}), retrying in ${delay}ms...`);
			await sleep(delay);
		}
	}

	// This should never be reached, but TypeScript needs it
	throw lastError || new Error('Unknown error in retry logic');
}

