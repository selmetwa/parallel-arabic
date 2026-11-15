import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSubscriber } from '$lib/server/tutor-notes/auth';
import { deleteTutorLessonRow, getTutorLesson } from '$lib/server/tutor-notes/store';
import { deleteTutorLesson } from '$lib/helpers/lesson-file-helper';

/** Status for the page while a build runs. */
export const GET: RequestHandler = async ({ params, locals }) => {
	const auth = await requireSubscriber(locals);
	if ('error' in auth) return auth.error;
	const row = await getTutorLesson(params.id, auth.userId);
	if (!row) return json({ error: 'Not found' }, { status: 404 });
	return json({
		status: row.status,
		error: row.error,
		wordCount: row.word_count,
		stepCount: row.step_count,
		buildStartedAt: row.build_started_at
	});
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const auth = await requireSubscriber(locals);
	if ('error' in auth) return auth.error;
	const row = await getTutorLesson(params.id, auth.userId);
	if (!row) return json({ error: 'Not found' }, { status: 404 });
	if (row.storage_path) await deleteTutorLesson(row.storage_path);
	await deleteTutorLessonRow(row.id, auth.userId);
	return json({ ok: true });
};
