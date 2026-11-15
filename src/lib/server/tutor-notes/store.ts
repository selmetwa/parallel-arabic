/** tutor_lesson table access. Every read is scoped to the owner. */
import { supabase } from '$lib/supabaseClient';
import type { TutorExtraction, TutorLessonStatus } from '$lib/schemas/tutor-notes-schema';

export interface TutorLessonRow {
	id: string;
	user_id: string;
	title: string;
	dialect: string;
	source_text: string;
	extraction: TutorExtraction;
	selection: number[] | null;
	status: TutorLessonStatus;
	error: string | null;
	storage_path: string | null;
	word_count: number | null;
	step_count: number | null;
	build_started_at: number | null;
	created_at: number;
}

/** What the list page needs; leaves out the notes and extraction. */
export type TutorLessonSummary = Pick<
	TutorLessonRow,
	'id' | 'title' | 'dialect' | 'status' | 'word_count' | 'step_count' | 'created_at'
>;

export async function insertTutorLesson(row: Omit<TutorLessonRow, 'selection' | 'error' | 'storage_path' | 'word_count' | 'step_count' | 'build_started_at'>) {
	const { error } = await supabase.from('tutor_lesson').insert(row);
	if (error) throw new Error(`Failed to save tutor notes: ${error.message}`);
}

export async function getTutorLesson(id: string, userId: string): Promise<TutorLessonRow | null> {
	const { data } = await supabase.from('tutor_lesson').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
	return (data as TutorLessonRow | null) ?? null;
}

export async function listTutorLessons(userId: string): Promise<TutorLessonSummary[]> {
	const { data, error } = await supabase
		.from('tutor_lesson')
		.select('id, title, dialect, status, word_count, step_count, created_at')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });
	if (error) console.error('[tutor-notes] list failed:', error);
	return (data as TutorLessonSummary[] | null) ?? [];
}

export async function updateTutorLesson(id: string, userId: string, patch: Partial<TutorLessonRow>) {
	const { error } = await supabase.from('tutor_lesson').update(patch).eq('id', id).eq('user_id', userId);
	if (error) throw new Error(`Failed to update tutor notes: ${error.message}`);
}

export async function deleteTutorLessonRow(id: string, userId: string) {
	await supabase.from('tutor_lesson').delete().eq('id', id).eq('user_id', userId);
}

/** A build that hasn't finished in this long has died (functions stop at 300 s). */
export const BUILD_TIMEOUT_MS = 6 * 60 * 1000;
