import { type Dialect } from '$lib/types/index';

export type DefinitionContext = {
	english: string;
	arabic: string;
	transliteration: string;
};

export type DefinitionResult = {
	success: boolean;
	definition: string;
	error?: string;
};

const dialectNames: Record<Dialect, string> = {
	fusha: 'Modern Standard Arabic',
	levantine: 'Levantine Arabic',
	darija: 'Moroccan Darija',
	'egyptian-arabic': 'Egyptian Arabic',
	iraqi: 'Iraqi Arabic',
	khaleeji: 'Khaleeji Arabic'
};

/**
 * Get a definition for a word or phrase using the AI definition API
 * @param words - The word(s) to define (string or array of strings)
 * @param context - The sentence context (english, arabic, transliteration)
 * @param dialect - The Arabic dialect
 * @returns DefinitionResult with success status and definition or error
 */
export async function getDefinition(
	words: string | string[],
	context: DefinitionContext,
	dialect: Dialect
): Promise<DefinitionResult> {
	const wordsArray = Array.isArray(words) ? words : [words];
	const wordText = wordsArray.length === 1 ? wordsArray[0] : `the phrase "${wordsArray.join(' ')}"`;
	const dialectName = dialectNames[dialect] || dialect;

	const question = `What does ${wordText} mean in ${dialectName}? Considering the following sentences:
		Arabic: "${context.arabic}"
		English: "${context.english}"
		Transliteration: "${context.transliteration}"

		Please provide a definition based on the context.`;

	try {
		const res = await fetch('/api/definition-sentence', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({ question })
		});

		if (!res.ok) {
			const errorData = await res.json().catch(() => ({ message: 'Failed to fetch definition' }));
			return {
				success: false,
				definition: '',
				error: errorData.message || `Error: ${res.status}`
			};
		}

		const data = await res.json();

		// Handle the response - it may be JSON or plain text
		let definitionContent = '';

		if (data.message?.content) {
			definitionContent = data.message.content;
		} else if (data.content) {
			definitionContent = data.content;
		} else if (typeof data === 'string') {
			definitionContent = data;
		}

		// Verify it's valid JSON for structured definitions
		try {
			const parsed = JSON.parse(definitionContent);
			return {
				success: true,
				definition: JSON.stringify(parsed)
			};
		} catch {
			// If not JSON, return as-is (shouldn't happen with structured output)
			return {
				success: true,
				definition: definitionContent || 'No definition available'
			};
		}
	} catch (error) {
		console.error('Error fetching definition:', error);
		return {
			success: false,
			definition: '',
			error: error instanceof Error ? error.message : 'An unexpected error occurred'
		};
	}
}
