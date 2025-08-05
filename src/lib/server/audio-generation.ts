import { ElevenLabsClient } from 'elevenlabs';
import { env } from '$env/dynamic/private';
import { getVoiceConfig } from '$lib/utils/voice-config';
import { db } from './db';
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

// Helper function to get the base data directory
function getDataDirectory(): string {
	// Check if we're in production (Fly.io) or development
	// return process.env.NODE_ENV === 'production' ? '/data' : 'data';
  return '/data';
  // return 'data' // for local development
}

export async function generateStoryAudio(storyId: string, dialect: string): Promise<{ success: boolean; audioPath?: string; fileName?: string; playbackRate?: number; error?: string }> {
	try {
		// Fetch the story from the database
		const story = await db
			.selectFrom('generated_story')
			.selectAll()
			.where('id', '=', storyId)
			.executeTakeFirst();

		if (!story) {
			return { success: false, error: 'Story not found' };
		}

		// Parse the story body
		const parsedStory: ParsedStory = JSON.parse(story.story_body);
		
		if (!parsedStory.sentences || !Array.isArray(parsedStory.sentences)) {
			return { success: false, error: 'Invalid story format' };
		}

		// Extract only the Arabic text from all sentences
		const arabicTexts = parsedStory.sentences
			.filter((sentence: StorySentence) => sentence.arabic && sentence.arabic.text)
			.map((sentence: StorySentence) => sentence.arabic.text.trim())
			.filter((text: string) => text.length > 0);

		if (arabicTexts.length === 0) {
			return { success: false, error: 'No Arabic content found in story' };
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

		// Create directory structure in the data volume: /data/audio/[dialect]/
		const dialectDir = dialect || 'egyptian-arabic';
		const dataDir = getDataDirectory();
		const audioDir = path.join(dataDir, 'audio', dialectDir);
		
		// Ensure the directory exists
		if (!fs.existsSync(audioDir)) {
			fs.mkdirSync(audioDir, { recursive: true });
		}

		// Use only storyId as filename
		const fileName = `${storyId}.mp3`;
		const filePath = path.join(audioDir, fileName);
		fs.writeFileSync(filePath, new Uint8Array(audioBuffer));

		// For serving the file, we need to create a route that can serve from the data directory
		// Return a path that our audio serving endpoint can handle
		const audioPath = `/api/audio/${dialectDir}/${fileName}`;

		return {
			success: true,
			audioPath: audioPath,
			fileName: fileName,
			playbackRate: voiceConfig.speed
		};

	} catch (err) {
		console.error('Audio generation error:', err);
		return { success: false, error: 'Failed to generate audio' };
	}
} 