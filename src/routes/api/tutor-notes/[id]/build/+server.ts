import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSubscriber } from '$lib/server/tutor-notes/auth';
import { BUILD_TIMEOUT_MS, getTutorLesson, updateTutorLesson } from '$lib/server/tutor-notes/store';
import { buildTutorLesson } from '$lib/server/tutor-notes/build';
import { learnerVariety } from '$lib/server/learner-variety';

/** Builds the lesson from the kept items: `{ selection: number[] }` (indexes into extraction.items). */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const auth = await requireSubscriber(locals);
	if ('error' in auth) return auth.error;
	const row = await getTutorLesson(params.id, auth.userId);
	if (!row) return json({ error: 'Not found' }, { status: 404 });

	const stillBuilding =
		row.status === 'building' && row.build_started_at && Date.now() - row.build_started_at < BUILD_TIMEOUT_MS;
	if (row.status === 'ready' || stillBuilding) return json({ error: 'This lesson is already built.' }, { status: 409 });

	const body = await request.json().catch(() => ({}));
	const count = row.extraction.items.length;
	const selection: number[] = Array.isArray(body.selection)
		? [...new Set<number>(body.selection.filter((i: unknown) => Number.isInteger(i) && (i as number) >= 0 && (i as number) < count))]
		: [];

	await updateTutorLesson(row.id, auth.userId, { status: 'building', selection, error: null, build_started_at: Date.now() });

	try {
		const { storagePath, wordCount, stepCount } = await buildTutorLesson(row, selection, learnerVariety(locals, row.dialect));
		await updateTutorLesson(row.id, auth.userId, {
			status: 'ready',
			storage_path: storagePath,
			word_count: wordCount,
			step_count: stepCount
		});
		return json({ status: 'ready', wordCount, stepCount });
	} catch (e) {
		console.error('[tutor-notes] build failed:', e);
		const message = e instanceof Error ? e.message : 'Building the lesson failed.';
		await updateTutorLesson(row.id, auth.userId, { status: 'failed', error: message });
		return json({ status: 'failed', error: message }, { status: 500 });
	}
};
