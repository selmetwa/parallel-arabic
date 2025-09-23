import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = await locals.auth.validate();
	const videoId = params.id;

  console.log({ videoId });
	if (!session) {
		throw error(401, 'Authentication required');
	}

	try {
		const video = await db
			.selectFrom('video')
			.selectAll()
			.where('id', '=', videoId)
			.executeTakeFirst();

		if (!video) {
			throw error(404, 'Video not found');
		}

		// Parse the video_body JSON
		let parsedVideoBody;
		try {
			parsedVideoBody = JSON.parse(video.video_body);
		} catch (e) {
			console.error('Failed to parse video_body:', e);
			parsedVideoBody = { lines: [], title: { english: video.title, arabic: video.title } };
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
				created_at: video.created_at,
				lines: parsedVideoBody.lines || []
			}
		};
	} catch (e) {
		console.error('Error loading video:', e);
		throw error(500, 'Failed to load video');
	}
};