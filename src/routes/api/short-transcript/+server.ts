import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';

const YOUTUBE_TRANSCRIPT_API_KEY = '68d0d002c95b838ec92e4efb';
const YOUTUBE_TRANSCRIPT_API_URL = 'https://www.youtube-transcript.io/api/transcripts';

interface TranscriptLine {
	start: number;
	dur: number;
	text: string;
}

interface VocabWord {
	arabic: string;
	english: string;
	transliteration: string;
	partOfSpeech: string; // noun, verb, adjective, phrase, etc.
}

interface FormattedTranscript {
	lines: Array<{
		start: number;
		arabic: string;
		english: string;
		transliteration: string;
	}>;
	vocabulary: VocabWord[];
	hasTranscript: boolean;
}

// Simple in-memory cache to avoid repeated API calls
const transcriptCache = new Map<string, FormattedTranscript>();

/**
 * Format transcript using Gemini - optimized for shorts (shorter content)
 * Also extracts key vocabulary words for language learners
 */
async function formatTranscriptWithGemini(
	transcript: TranscriptLine[],
	ai: GoogleGenAI
): Promise<FormattedTranscript> {
	const systemPrompt = `You are an Arabic language expert. Format this YouTube short transcript for language learners.

For each line, provide:
1. Arabic text (Egyptian Arabic dialect if applicable)
2. English translation
3. Transliteration (Latin letters showing pronunciation)

ALSO extract 5-10 key vocabulary words from the transcript that would be useful for a language learner.
For each vocabulary word, include:
- arabic: the word in Arabic script
- english: English meaning
- transliteration: pronunciation in Latin letters
- partOfSpeech: one of "noun", "verb", "adjective", "adverb", "phrase", "expression"

Prioritize:
- Common, useful words
- Words that appear in context in the video
- Verbs in their root/infinitive form
- Interesting colloquial expressions

Return JSON with this exact structure:
{
  "lines": [
    {
      "start": 0,
      "arabic": "النص العربي",
      "english": "English text",
      "transliteration": "transliterated text"
    }
  ],
  "vocabulary": [
    {
      "arabic": "كلمة",
      "english": "word",
      "transliteration": "kelma",
      "partOfSpeech": "noun"
    }
  ]
}

Keep it concise - this is a short video. Combine very short fragments if needed.
Remove filler words like "um", "uh".
If the original is in Arabic, keep it. If in English, translate to Egyptian Arabic.`;

	const userPrompt = `Format this transcript and extract vocabulary:\n${JSON.stringify(transcript)}`;

	try {
		const response = await generateContentWithRetry(ai, {
			model: 'gemini-2.0-flash',
			contents: `${systemPrompt}\n\n${userPrompt}`,
			// @ts-expect-error - generationConfig types may be outdated
			generationConfig: {
				temperature: 0.3,
				maxOutputTokens: 3000,
				responseMimeType: 'application/json'
			}
		});

		const result = response.text;
		if (!result) {
			throw new Error('No response from Gemini');
		}

		const parsed = JSON.parse(result);
		return {
			lines: parsed.lines || [],
			vocabulary: parsed.vocabulary || [],
			hasTranscript: true
		};
	} catch (error) {
		console.error('Gemini formatting error:', error);
		throw error;
	}
}

export const GET: RequestHandler = async ({ url }) => {
	const videoId = url.searchParams.get('videoId');

	if (!videoId) {
		return json({ error: 'Video ID is required' }, { status: 400 });
	}

	// Validate video ID format
	if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
		return json({ error: 'Invalid YouTube video ID format' }, { status: 400 });
	}

	// Check cache first
	if (transcriptCache.has(videoId)) {
		return json(transcriptCache.get(videoId));
	}

	try {
		// Fetch transcript from YouTube Transcript API
		const response = await fetch(YOUTUBE_TRANSCRIPT_API_URL, {
			method: 'POST',
			headers: {
				'Authorization': `Basic ${YOUTUBE_TRANSCRIPT_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ ids: [videoId] })
		});

		if (!response.ok) {
			// No transcript available - cache this result
			const noTranscript: FormattedTranscript = { lines: [], vocabulary: [], hasTranscript: false };
			transcriptCache.set(videoId, noTranscript);
			return json(noTranscript);
		}

		const data = await response.json();

		if (!data || !Array.isArray(data) || data.length === 0) {
			const noTranscript: FormattedTranscript = { lines: [], vocabulary: [], hasTranscript: false };
			transcriptCache.set(videoId, noTranscript);
			return json(noTranscript);
		}

		const videoData = data[0];
		const transcript = videoData?.tracks?.[0]?.transcript;

		if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
			const noTranscript: FormattedTranscript = { lines: [], vocabulary: [], hasTranscript: false };
			transcriptCache.set(videoId, noTranscript);
			return json(noTranscript);
		}

		// Format with Gemini
		const apiKey = env['GEMINI_API_KEY'];
		if (!apiKey) {
			// Return raw transcript if no Gemini key
			const rawTranscript: FormattedTranscript = {
				lines: transcript.map((line: TranscriptLine) => ({
					start: line.start,
					arabic: line.text,
					english: '',
					transliteration: ''
				})),
				vocabulary: [],
				hasTranscript: true
			};
			transcriptCache.set(videoId, rawTranscript);
			return json(rawTranscript);
		}

		const ai = new GoogleGenAI({ apiKey });
		const formattedTranscript = await formatTranscriptWithGemini(transcript, ai);

		// Cache the result
		transcriptCache.set(videoId, formattedTranscript);

		return json(formattedTranscript);
	} catch (error) {
		console.error('Transcript fetch error:', error);
		return json({ error: 'Failed to fetch transcript', hasTranscript: false }, { status: 500 });
	}
};

