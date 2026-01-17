/**
 * Retry utility for Gemini API calls with exponential backoff
 * Handles 503 (Service Unavailable) and other 5xx errors from Gemini API
 * Model priority: gemini-3-flash-preview → gemini-2.5-flash → gemini-2.0-flash
 */

import type { GoogleGenAI } from '@google/genai';

interface RetryOptions {
	maxRetries?: number;
	initialDelayMs?: number;
	maxDelayMs?: number;
	backoffMultiplier?: number;
	retryableStatusCodes?: number[];
	fallbackModels?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
	maxRetries: 2, // Total attempts = 1 initial + 2 retries = 3 attempts
	initialDelayMs: 1000, // Start with 1 second
	maxDelayMs: 16000, // Max 16 seconds delay
	backoffMultiplier: 2, // Double the delay each time
	retryableStatusCodes: [503, 500, 502, 504, 429], // Service Unavailable, Internal Server Error, Bad Gateway, Gateway Timeout, Too Many Requests
	fallbackModels: ['gemini-2.5-flash', 'gemini-2.0-flash'] // Fallback models to use if all retries fail
};

/**
 * Custom error class for Gemini API errors with status code information
 */
export class GeminiApiError extends Error {
	statusCode: number | null;
	is503: boolean;
	isRetryable: boolean;

	constructor(message: string, statusCode: number | null = null, isRetryable: boolean = false) {
		super(message);
		this.name = 'GeminiApiError';
		this.statusCode = statusCode;
		this.is503 = statusCode === 503;
		this.isRetryable = isRetryable;
	}
}

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
 * Check if an error is retryable based on status code
 */
function isRetryableError(error: unknown, retryableStatusCodes: number[]): boolean {
	if (!error) return false;

	// Check if error has a status code property
	const errorObj = error as Record<string, unknown>;
	
	// Check status property (common in HTTP errors)
	if (typeof errorObj.status === 'number') {
		return retryableStatusCodes.includes(errorObj.status);
	}
	
	// Check statusCode property (alternative naming)
	if (typeof errorObj.statusCode === 'number') {
		return retryableStatusCodes.includes(errorObj.statusCode);
	}
	
	// Check error message for status codes
	if (error instanceof Error) {
		const message = error.message.toLowerCase();
		// Check for specific error messages that indicate retryable errors
		if (message.includes('503') || 
			message.includes('service unavailable') ||
			message.includes('model overloaded') ||
			message.includes('overloaded') ||
			message.includes('500') ||
			message.includes('502') ||
			message.includes('504') ||
			message.includes('429') ||
			message.includes('too many requests')) {
			return true;
		}
		
		// Don't retry on client errors (4xx except 429)
		if (message.includes('400') || 
			message.includes('401') || 
			message.includes('403') || 
			message.includes('404')) {
			return false;
		}
	}
	
	// Check for Google API error structure
	const response = errorObj.response as Record<string, unknown> | undefined;
	if (response && typeof response.status === 'number') {
		return retryableStatusCodes.includes(response.status);
	}
	
	// If we can't determine, err on the side of retrying for 5xx-like errors
	// but not for clear client errors
	return false;
}

/**
 * Extract status code from error if available
 */
function getStatusCode(error: unknown): number | null {
	const errorObj = error as Record<string, unknown>;
	if (typeof errorObj.status === 'number') return errorObj.status;
	if (typeof errorObj.statusCode === 'number') return errorObj.statusCode;
	const response = errorObj.response as Record<string, unknown> | undefined;
	if (response && typeof response.status === 'number') return response.status;
	return null;
}

/**
 * Wraps a Gemini API generateContent call with retry logic for 503 and other 5xx errors
 * 
 * @param ai - GoogleGenAI instance
 * @param generateContentFn - Function that calls ai.models.generateContent and returns the response
 * @param options - Retry configuration options
 * @returns The response from generateContent
 */
export async function retryGeminiApiCall<T>(
	ai: GoogleGenAI,
	generateContentFn: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const retryOptions = { ...DEFAULT_OPTIONS, ...options };
	let lastError: Error | null = null;
	let lastStatusCode: number | null = null;

	for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
		try {
			const response = await generateContentFn();
			return response;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			lastStatusCode = getStatusCode(error);
			
			// Check if this is a retryable error
			const isRetryable = isRetryableError(error, retryOptions.retryableStatusCodes);
			if (!isRetryable) {
				// Not a retryable error, throw immediately with error info
				console.error(`Gemini API error (not retryable):`, {
					statusCode: lastStatusCode,
					message: lastError.message,
					error: error
				});
				throw new GeminiApiError(lastError.message, lastStatusCode, false);
			}

			// If this was the last attempt, throw error with status code info
			if (attempt === retryOptions.maxRetries) {
				console.error(`Gemini API call failed after ${attempt + 1} attempts:`, {
					statusCode: lastStatusCode,
					message: lastError.message,
					error: error
				});
				throw new GeminiApiError(lastError.message, lastStatusCode, true);
			}

			// Wait before retrying with exponential backoff
			const delay = calculateDelay(attempt, retryOptions);
			console.warn(
				`Gemini API error ${lastStatusCode || 'unknown'} (attempt ${attempt + 1}/${retryOptions.maxRetries + 1}), ` +
				`retrying in ${delay}ms...`,
				{ statusCode: lastStatusCode, message: lastError.message }
			);
			await sleep(delay);
		}
	}

	// This should never be reached, but TypeScript needs it
	throw new GeminiApiError(
		lastError?.message || 'Unknown error in retry logic',
		lastStatusCode,
		true
	);
}

/**
 * Helper function to wrap generateContent calls with retry logic
 * Falls back through a chain of models: gemini-3-flash-preview → gemini-2.5-flash → gemini-2.0-flash
 *
 * @param ai - GoogleGenAI instance
 * @param params - Parameters to pass to generateContent
 * @param options - Retry configuration options
 * @returns The response from generateContent
 */
export async function generateContentWithRetry(
	ai: GoogleGenAI,
	params: Parameters<GoogleGenAI['models']['generateContent']>[0],
	options: RetryOptions = {}
) {
	const retryOptions = { ...DEFAULT_OPTIONS, ...options };
	const originalModel = params.model || 'gemini-3-flash-preview';
	const triedModels = new Set<string>([originalModel]);

	try {
		// Try with original model and retries
		return await retryGeminiApiCall(
			ai,
			() => ai.models.generateContent(params),
			options
		);
	} catch (error) {
		// If error is retryable (503, 500, etc.) and we have fallback models, try them
		if (error instanceof GeminiApiError && error.isRetryable && retryOptions.fallbackModels) {
			let lastFallbackError = error;

			// Try each fallback model in sequence
			for (const fallbackModel of retryOptions.fallbackModels) {
				// Skip if we've already tried this model
				if (triedModels.has(fallbackModel)) {
					continue;
				}

				console.warn(
					`All retries failed with ${originalModel}. Falling back to ${fallbackModel}...`,
					{ statusCode: error.statusCode, message: error.message }
				);

				try {
					// Try with fallback model (no retries to avoid infinite loops)
					const fallbackParams = {
						...params,
						model: fallbackModel
					};
					return await ai.models.generateContent(fallbackParams);
				} catch (fallbackError) {
					// Log the failure and try next fallback
					const fallbackStatusCode = getStatusCode(fallbackError);
					console.error(`Fallback model ${fallbackModel} also failed:`, {
						statusCode: fallbackStatusCode,
						error: fallbackError
					});
					
					lastFallbackError = fallbackError instanceof GeminiApiError 
						? fallbackError 
						: new GeminiApiError(
							fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
							fallbackStatusCode,
							true
						);
					
					triedModels.add(fallbackModel);
					// Continue to next fallback model
				}
			}

			// All fallbacks failed, throw the last error
			throw lastFallbackError;
		}

		// Re-throw the error if not retryable or no fallback
		throw error;
	}
}

