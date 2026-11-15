import { json } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';
import type { RequestHandler } from './$types';
import { requireSubscriber } from '$lib/server/tutor-notes/auth';
import { isSelectableDialect } from '$lib/constants/dialects';
import { buildAi } from '$lib/server/lesson-v2-generation';
import { readSource, SourceError } from '$lib/server/tutor-notes/read-source';
import { extractNotes } from '$lib/server/tutor-notes/extract';
import { lessonTitle } from '$lib/server/tutor-notes/prepare';
import { insertTutorLesson, listTutorLessons } from '$lib/server/tutor-notes/store';

/** The learner's tutor lessons, newest first. */
export const GET: RequestHandler = async ({ locals }) => {
	const auth = await requireSubscriber(locals);
	if ('error' in auth) return auth.error;
	return json({ lessons: await listTutorLessons(auth.userId) });
};

/**
 * Extracts words and concepts from pasted text (JSON `{ text, dialect }`) or an
 * uploaded file (multipart `file`, `dialect`), saves them, and returns the new id.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = await requireSubscriber(locals);
	if ('error' in auth) return auth.error;

	let dialect: string;
	let input: Parameters<typeof readSource>[1];
	if (request.headers.get('content-type')?.includes('multipart/form-data')) {
		const form = await request.formData();
		const file = form.get('file');
		dialect = String(form.get('dialect') ?? '');
		if (!(file instanceof File)) return json({ error: 'Attach a .docx or .pdf file.' }, { status: 400 });
		input = { name: file.name, type: file.type, bytes: new Uint8Array(await file.arrayBuffer()) };
	} else {
		const body = await request.json().catch(() => ({}));
		dialect = String(body.dialect ?? '');
		input = { text: String(body.text ?? '') };
	}
	if (!isSelectableDialect(dialect)) return json({ error: 'Pick a dialect.' }, { status: 400 });

	try {
		const ai = buildAi();
		const notes = await readSource(ai, input);
		const extraction = await extractNotes(ai, notes, dialect);
		if (!extraction.items.some((i) => i.kind === 'vocab')) {
			return json({ error: "We couldn't find any vocabulary in those notes." }, { status: 422 });
		}

		const id = uuidv4();
		await insertTutorLesson({
			id,
			user_id: auth.userId,
			title: lessonTitle(extraction.items),
			dialect,
			source_text: notes,
			extraction,
			status: 'extracted',
			created_at: Date.now()
		});
		return json({ id });
	} catch (e) {
		if (e instanceof SourceError) return json({ error: e.message }, { status: 400 });
		console.error('[tutor-notes] extraction failed:', e);
		return json({ error: 'Something went wrong reading your notes. Try again.' }, { status: 500 });
	}
};
