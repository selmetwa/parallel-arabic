import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/tutor-notes/auth';
import { updateTutorLesson } from '$lib/server/tutor-notes/store';

/** Saves the step to reopen this tutor lesson at: `{ step }` (0-based). Called on every step change. */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const auth = await requireUser(locals);
	if ('error' in auth) return auth.error;

	const { step } = await request.json().catch(() => ({}));
	if (!Number.isInteger(step) || step < 0) return json({ error: 'step must be a non-negative integer' }, { status: 400 });

	// Scoped to the owner, so another user's id matches no row.
	await updateTutorLesson(params.id, auth.userId, { last_step: step });
	return json({ ok: true });
};
