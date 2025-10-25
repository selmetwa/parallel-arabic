import { ElevenLabsClient } from 'elevenlabs';
import { env } from '$env/dynamic/private';
import { getVoiceConfig } from '$lib/utils/voice-config';
import { uploadAudioToStorage, getAudioUrl } from '$lib/helpers/storage-helpers';
import { downloadStoryFromStorage } from '$lib/helpers/storage-helpers';
import { supabase } from '$lib/supabaseClient';

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

// No longer need local directory helper - using Supabase storage

export async function generateStoryAudio(storyId: string, dialect: string): Promise<{ success: boolean; audioPath?: string; fileName?: string; playbackRate?: number; error?: string }> {
	try {
		// Fetch the story from the database (metadata)
		const { data: story, error: storyError } = await supabase
			.from('generated_story')
			.select('*')
			.eq('id', storyId)
			.single();

		if (storyError || !story) {
			console.error('Story fetch error:', storyError);
			return { success: false, error: 'Story not found' };
		}

		// Download the story content from storage
		const storyContentResult = await downloadStoryFromStorage(story.story_body);
		
		if (!storyContentResult.success || !storyContentResult.data) {
			console.error('Failed to download story from storage:', storyContentResult.error);
			return { success: false, error: 'Failed to load story content' };
		}

		// Parse the story content
		const parsedStory: ParsedStory = storyContentResult.data as ParsedStory;
		
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

		// Upload audio to Supabase storage
		const dialectDir = dialect || 'egyptian-arabic';
		const audioUploadResult = await uploadAudioToStorage(storyId, dialectDir, audioBuffer);
		
		if (!audioUploadResult.success) {
			console.error('Failed to upload audio to storage:', audioUploadResult.error);
			return { success: false, error: `Failed to save audio: ${audioUploadResult.error}` };
		}

		console.log('✅ Audio uploaded successfully:', audioUploadResult.fileKey);

		// Update the story record with the audio file key
		const { error: updateError } = await supabase
			.from('generated_story')
			.update({ audio_file_key: audioUploadResult.fileKey })
			.eq('id', storyId);

		if (updateError) {
			console.error('Failed to update story with audio file key:', updateError);
			// Don't fail the entire operation - audio is uploaded successfully
		}

		// Get a signed URL for the uploaded audio file
		const audioUrlResult = await getAudioUrl(audioUploadResult.fileKey!);
		
		return {
			success: true,
			audioPath: audioUrlResult.success ? audioUrlResult.url! : audioUploadResult.publicUrl!, // Use signed URL if available, fallback to public
			fileName: audioUploadResult.fileKey!,
		};

	} catch (err) {
		console.error('Audio generation error:', err);
		return { success: false, error: 'Failed to generate audio' };
	}
} 