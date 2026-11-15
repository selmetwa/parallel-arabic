import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTutorLesson } from '$lib/server/tutor-notes/store';
import { loadTutorLesson } from '$lib/helpers/lesson-file-helper';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { session, user, isSubscribed } = await parent();
	if (!session || !user) throw redirect(302, '/login');
	if (!isSubscribed) throw redirect(302, '/notes');

	const row = await getTutorLesson(params.id, user.id);
	if (!row) throw error(404, 'Not found');

	const lesson = row.status === 'ready' && row.storage_path ? await loadTutorLesson(row.storage_path) : null;
	const topicId = `tutor-${row.id}`;
	const resumeStep =
		user.last_content_type === 'tutor-notes' && user.last_content_id === topicId ? (user.last_content_position ?? 0) : 0;

	return {
		note: {
			id: row.id,
			title: row.title,
			dialect: row.dialect,
			status: row.status,
			error: row.error,
			items: row.extraction.items,
			uncovered: row.extraction.uncovered,
			selection: row.selection,
			wordCount: row.word_count,
			stepCount: row.step_count,
			buildStartedAt: row.build_started_at
		},
		lesson,
		resumeStep
	};
};
