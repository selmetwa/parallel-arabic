import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getStoryAudioPath } from '$lib/utils/audio-utils';
import { getVoiceConfig } from '$lib/utils/voice-config';

export const GET: RequestHandler = async ({ url }) => {
	const storyId = url.searchParams.get('storyId');
	const dialect = url.searchParams.get('dialect');

	if (!storyId || !dialect) {
		return json({ exists: false, audioPath: null, playbackRate: 1.0 });
	}

	const audioPath = getStoryAudioPath(storyId, dialect);
	
	if (audioPath) {
		const voiceConfig = getVoiceConfig(dialect);
		return json({
			exists: true,
			audioPath: audioPath,
			playbackRate: voiceConfig.speed
		});
	}
	
	return json({
		exists: false,
		audioPath: null,
		playbackRate: 1.0
	});
}; 