import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { v4 as uuidv4 } from 'uuid';
import { trackActivitySimple } from '$lib/helpers/track-activity';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { supabase, safeGetSession } = locals;
	
	const { session, user } = await safeGetSession();
	
	if (!session || !user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { topicId, dialect } = await request.json();

		if (!topicId || !dialect) {
			return json({ success: false, error: 'Missing topicId or dialect' }, { status: 400 });
		}

		// Check if progress record already exists
		const { data: existingProgress, error: checkError } = await supabase
			.from('structured_lesson_progress')
			.select('*')
			.eq('user_id', user.id)
			.eq('topic_id', topicId)
			.eq('dialect', dialect)
			.single();

		const now = Math.floor(Date.now() / 1000);
		const wasAlreadyCompleted = existingProgress && !checkError && existingProgress.status === 'completed';

		if (existingProgress && !checkError) {
			// Update existing record
			const { error: updateError } = await supabase
				.from('structured_lesson_progress')
				.update({
					status: 'completed',
					completed_at: existingProgress.completed_at || now,
					last_accessed_at: now,
					progress_percentage: 100,
					updated_at: now
				})
				.eq('id', existingProgress.id);

			if (updateError) {
				console.error('Error updating lesson progress:', updateError);
				return json({ success: false, error: 'Failed to update progress' }, { status: 500 });
			}
		} else {
			// Create new record
			const { error: insertError } = await supabase
				.from('structured_lesson_progress')
				.insert({
					id: uuidv4(),
					user_id: user.id,
					topic_id: topicId,
					dialect: dialect,
					status: 'completed',
					started_at: now,
					completed_at: now,
					last_accessed_at: now,
					progress_percentage: 100,
					created_at: now,
					updated_at: now
				});

			if (insertError) {
				console.error('Error creating lesson progress:', insertError);
				return json({ success: false, error: 'Failed to create progress' }, { status: 500 });
			}
		}

		// Track activity for streaks and stats (only if this is a new completion)
		if (!wasAlreadyCompleted) {
			trackActivitySimple(user.id, 'lesson', 1).catch(err => {
				console.error('Error tracking lesson activity:', err);
				// Don't fail the request if activity tracking fails
			});
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error in complete lesson endpoint:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

