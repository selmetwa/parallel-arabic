import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { sessionId, user } = await locals?.auth?.validate() || {};
	if (!sessionId || !user) {
		return error(401, { message: 'Unauthorized' });
	}

	const { topicId, storyId } = await request.json();
	if (!topicId || !storyId) {
		return error(400, { message: 'topicId and storyId are required' });
	}

	const id = `${user.id}-${topicId}`;
	const now = Date.now();

	const { error: dbError } = await supabase
		.from('user_topic_story')
		.upsert(
			{ id, user_id: user.id, topic_id: topicId, story_id: storyId, created_at: now },
			{ onConflict: 'user_id,topic_id' }
		);

	if (dbError) {
		console.error('Error saving topic story:', dbError);
		return error(500, { message: 'Failed to save topic story' });
	}

	return json({ success: true });
};
