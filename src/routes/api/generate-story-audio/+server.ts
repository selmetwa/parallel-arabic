import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { generateStoryAudio, generateStoryAudioFromBody } from '../../../lib/server/audio-generation';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const { storyId, dialect, storyBody } = data;

		if (!storyId) {
			return error(400, { message: 'Story ID is required' });
		}

		// If storyBody is provided, use it directly; otherwise fetch from storage
		let result;
		if (storyBody) {
			result = await generateStoryAudioFromBody(storyId, dialect, storyBody);
		} else {
			result = await generateStoryAudio(storyId, dialect);
		}

		if (result.success) {
			return json({
				success: true,
				audioPath: result.audioPath,
				fileName: result.fileName,
				playbackRate: result.playbackRate,
				duration: 'Generated successfully'
			});
		} else {
			return error(500, { message: result.error || 'Failed to generate audio' });
		}

	} catch (err) {
		console.error('Audio generation API error:', err);
		return error(500, { message: 'Failed to generate audio' });
	}
}; 