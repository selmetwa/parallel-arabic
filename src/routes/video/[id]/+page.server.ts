import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';
import { error } from '@sveltejs/kit';
import { downloadVideoFromStorage } from '$lib/helpers/storage-helpers';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { session } = await parent();
	const videoId = params.id;

	try {
		const { data: video, error: selectError } = await supabase
			.from('video')
			.select('*')
			.eq('id', videoId)
			.single();

		if (selectError || !video) {
			if (selectError?.code === 'PGRST116') {
				throw error(404, 'Video not found');
			}
			console.error('Error fetching video:', selectError);
			throw error(404, 'Video not found');
		}

		// Download video content from storage
		const storageResult = await downloadVideoFromStorage(video.video_body);
		
		let parsedVideoBody;
		if (!storageResult.success || !storageResult.data) {
			console.error('Failed to download video from storage:', storageResult.error);
			// Fallback: try to parse as JSON if it's old format
			try {
				parsedVideoBody = JSON.parse(video.video_body);
				console.log('Fallback: Parsed video_body as JSON (old format)');
			} catch (e) {
				console.error('Failed to parse video_body as fallback:', e);
				parsedVideoBody = { lines: [], title: { english: video.title, arabic: video.title } };
			}
		} else {
			parsedVideoBody = storageResult.data;
			console.log('✅ Video content loaded from storage');
		}

		// Helper function to get dialect display name
		function getDialectDisplayName(dialect: string) {
			const dialectNames = {
				'egyptian-arabic': 'Egyptian Arabic',
				'darija': 'Moroccan Darija',
				'fusha': 'Modern Standard Arabic',
			};
			return dialectNames[dialect as keyof typeof dialectNames] || dialect;
		}

		return {
			session,
			video: {
				id: video.id,
				title: parsedVideoBody.title || { english: video.title, arabic: video.title },
				description: parsedVideoBody.description || { english: video.description, arabic: video.description },
				url: video.url,
				thumbnail_url: video.thumbnail_url,
				dialect: video.dialect,
				dialect_name: getDialectDisplayName(video.dialect),
				created_at: video.created_at,
				lines: parsedVideoBody.lines || []
			}
		};
	} catch (e) {
		console.error('Error loading video:', e);
		throw error(500, 'Failed to load video');
	}
};
