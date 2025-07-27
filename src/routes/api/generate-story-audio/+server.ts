import { ElevenLabsClient } from 'elevenlabs';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from '@sveltejs/kit';
import { getVoiceConfig } from '$lib/utils/voice-config';
import { db } from '../../../lib/server/db';
import { error, json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
	throw new Error('Missing ELEVENLABS_API_KEY in environment variables');
}

const client = new ElevenLabsClient({
	apiKey: ELEVENLABS_API_KEY
});

interface StorySentence {
	arabic: { text: string };
	english: { text: string };
	transliteration: { text: string };
}

interface ParsedStory {
	title: { arabic: string; english: string };
	description: { arabic: string; english: string };
	sentences: StorySentence[];
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const { storyId, dialect } = data;

		if (!storyId) {
			return error(400, { message: 'Story ID is required' });
		}

		// Fetch the story from the database
		const story = await db
			.selectFrom('generated_story')
			.selectAll()
			.where('id', '=', storyId)
			.executeTakeFirst();

		if (!story) {
			return error(404, { message: 'Story not found' });
		}

		// Parse the story body
		const parsedStory: ParsedStory = JSON.parse(story.story_body);
		
		if (!parsedStory.sentences || !Array.isArray(parsedStory.sentences)) {
			return error(400, { message: 'Invalid story format' });
		}

		// Extract only the Arabic text from all sentences
		const arabicTexts = parsedStory.sentences
			.filter((sentence: StorySentence) => sentence.arabic && sentence.arabic.text)
			.map((sentence: StorySentence) => sentence.arabic.text.trim())
			.filter((text: string) => text.length > 0);

		if (arabicTexts.length === 0) {
			return error(400, { message: 'No Arabic content found in story' });
		}

		// Join all Arabic sentences with a pause between them
		const fullArabicText = arabicTexts.join('. ');

		// Get voice configuration for the dialect
		const voiceConfig = getVoiceConfig(dialect || 'egyptian-arabic');

		// Generate audio using ElevenLabs
		const audioStream = await client.generate({
			voice: voiceConfig.voice,
			model_id: 'eleven_turbo_v2_5',
			text: fullArabicText,
			voice_settings: {
				stability: voiceConfig.stability,
				similarity_boost: voiceConfig.similarity_boost
			}
		});

		// Collect audio chunks
		const chunks: Uint8Array[] = [];
		for await (const chunk of audioStream) {
			chunks.push(chunk);
		}

		const audioBuffer = Buffer.concat(chunks);

		// Create directory structure: static/audio/generated/[dialect]/
		const dialectDir = dialect || 'egyptian-arabic';
		const audioDir = path.join(process.cwd(), 'static', 'audio', 'generated', dialectDir);
		if (!fs.existsSync(audioDir)) {
			fs.mkdirSync(audioDir, { recursive: true });
		}

		// Use only storyId as filename
		const fileName = `${storyId}.mp3`;
		const filePath = path.join(audioDir, fileName);
		fs.writeFileSync(filePath, new Uint8Array(audioBuffer));

		// Return the relative path for use in the frontend
		const relativePath = `/audio/generated/${dialectDir}/${fileName}`;

		return json({ 
			success: true, 
			audioPath: relativePath,
			fileName: fileName,
			playbackRate: voiceConfig.speed,
			duration: 'Generated successfully'
		});

	} catch (err) {
		console.error('Audio generation error:', err);
		return error(500, { message: 'Failed to generate audio' });
	}
}; 