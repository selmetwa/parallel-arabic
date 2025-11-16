import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { uploadVideoToStorage } from '$lib/helpers/storage-helpers';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { createFormattedVideoSchema } from '$lib/utils/gemini-schemas';

const YOUTUBE_TRANSCRIPT_API_KEY = '68d0d002c95b838ec92e4efb';
const YOUTUBE_TRANSCRIPT_API_URL = 'https://www.youtube-transcript.io/api/transcripts';

interface FormattedVideo {
	title: { arabic: string; english: string };
	description: { arabic: string; english: string };
	lines: Array<{
		start: string;
		dur: string;
		arabic: { text: string };
		english: { text: string };
		transliteration: { text: string };
	}>;
}

async function formatTranscriptWithGemini(transcript: unknown, ai: GoogleGenAI): Promise<FormattedVideo> {
	const systemPrompt = `You are an expert Arabic linguist specializing in Egyptian Arabic. Your task is to convert raw YouTube transcript lines into a structured format for language learning.

Each transcript line has timing information (start time and duration) and text. You need to:
1. Keep the original start and dur timing values
2. Process the text to provide Arabic, English, and transliteration

For each line in the transcript, you need to provide:
1. Arabic text (in Egyptian Arabic dialect)
2. English translation 
3. Transliteration (using Latin letters to show pronunciation)
4. Keep original start and dur values

IMPORTANT GUIDELINES:
- If the transcript is already in Arabic, keep the original Arabic text
- If the transcript is in English/other languages, translate it to Egyptian Arabic
- Ensure natural, conversational Egyptian Arabic
- Make transliterations clear and phonetic
- Split long sentences into digestible chunks (20-100 characters each)
- Remove filler words, "um", "uh", incomplete fragments
- Maintain the original meaning and context
- PRESERVE the original start and dur timing values exactly as provided

Return your response as a JSON object with this structure:
{
  "title": {
    "arabic": "عنوان الفيديو",
    "english": "Video Title"
  },
  "description": {
    "arabic": "وصف الفيديو",
    "english": "Video description"
  },
  "lines": [
    {
      "start": "451.84",
      "dur": "10.4",
      "arabic": {"text": "النص بالعربية"},
      "english": {"text": "English text"},
      "transliteration": {"text": "transliterated text"}
    }
  ]
}`;

	const userPrompt = `Please format this transcript into Arabic, English, and transliteration:\n\n${JSON.stringify(transcript, null, 2)}`;

	const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

	try {
		const formattedVideoSchema = createFormattedVideoSchema();
		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash',
			contents: fullPrompt,
			// @ts-expect-error - generationConfig is valid but types may be outdated
			generationConfig: {
				temperature: 0.7,
				maxOutputTokens: 10000, // Large token limit for video transcripts
				responseMimeType: 'application/json',
				responseJsonSchema: formattedVideoSchema.jsonSchema
			}
		});

		const result = response.text;
		if (!result) {
			throw new Error('No response from Gemini');
		}

		return parseJsonFromGeminiResponse(result, formattedVideoSchema.zodSchema);
	} catch (error) {
		console.error('Gemini formatting error:', error);
		throw error;
	}
}

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check authentication
		// @ts-expect-error - auth property exists on locals at runtime
		const session = await locals.auth.validate();
		if (!session?.sessionId) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const { videoId, customTitle, dialect } = await request.json();

		if (!videoId) {
			return json({ error: 'Video ID is required' }, { status: 400 });
		}

		// Validate video ID format (YouTube video IDs are 11 characters)
		if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
			return json({ error: 'Invalid YouTube video ID format' }, { status: 400 });
		}

		// Call YouTube transcript API
		const response = await fetch(YOUTUBE_TRANSCRIPT_API_URL, {
			method: 'POST',
			headers: {
				'Authorization': `Basic ${YOUTUBE_TRANSCRIPT_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				ids: [videoId]
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('YouTube Transcript API error:', errorText);
			
			// Handle specific error cases
			if (response.status === 404) {
				return json({ error: 'Video not found or transcript not available' }, { status: 404 });
			} else if (response.status === 401) {
				return json({ error: 'Invalid API credentials' }, { status: 500 });
			} else {
				return json({ error: 'Failed to fetch transcript from YouTube' }, { status: 500 });
			}
		}

		const data = await response.json();
		// Extract transcript data
		if (!data || !Array.isArray(data) || data.length === 0) {
			return json({ error: 'No transcript data found' }, { status: 404 });
		}

	const videoData = data[0];
	
  const TRANSCRIPT = videoData?.tracks[0]?.transcript;

	// Check if we have valid tracks data
	if (
    !videoData || 
    !videoData.tracks || 
    !Array.isArray(videoData.tracks) || 
    videoData.tracks.length === 0 ||
    TRANSCRIPT.length === 0
  ) {
		return json({ error: 'No transcript tracks found for this video' }, { status: 404 });
	}

	if (!TRANSCRIPT) {
		return json({ error: 'Transcript not available for this video' }, { status: 404 });
	}

	// Initialize Gemini
	const apiKey = env['GEMINI_API_KEY'];
	if (!apiKey) {
		return json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
	}
	
	const ai = new GoogleGenAI({ apiKey });
	const userId = session.user.id;
	const videoDbId = uuidv4();

	// Format the transcript using Gemini
	const formattedVideo = await formatTranscriptWithGemini(TRANSCRIPT, ai);
	
	if (!formattedVideo || !formattedVideo.lines || !Array.isArray(formattedVideo.lines)) {
		throw new Error('Invalid formatted video structure from Gemini');
	}

	// Upload video content to Supabase Storage
	const storageResult = await uploadVideoToStorage(videoDbId, formattedVideo);
	
	if (!storageResult.success) {
		console.error('Storage upload failed:', storageResult.error);
		throw new Error(`Failed to upload video to storage: ${storageResult.error}`);
	}
	
	// Save video metadata to database with storage file key
	const { error: insertError } = await supabase
		.from('video')
		.insert({
			id: videoDbId,
			user_id: userId,
			title: customTitle ?? (formattedVideo.title?.english || videoData.title || 'Untitled Video'),
			description: formattedVideo.description?.english || 'Video from YouTube',
			url: `https://www.youtube.com/watch?v=${videoId}`,
			thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
			dialect: dialect ?? 'egyptian-arabic',
			created_at: new Date().toISOString(),
			video_body: storageResult.fileKey! // Store file key instead of JSON
		})
		.select()
		.single();

	if (insertError) {
		console.error('Database insert error:', insertError);
		throw insertError;
	}

	return json({
		success: true,
		videoId: videoId,
		videoDbId: videoDbId,
		title: customTitle || videoData?.title || 'Untitled Video',
		description: formattedVideo.description,
		linesCount: formattedVideo.lines.length,
		formattedVideo: formattedVideo
	});

	} catch (error) {
		console.error('YouTube transcript error:', error);
		return json(
			{ error: 'Internal server error while fetching transcript' },
			{ status: 500 }
		);
	}
};
