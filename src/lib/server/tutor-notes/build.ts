/**
 * Builds one practice lesson from the words a learner kept, saves their words
 * for review, and stores the lesson. Runs inside the build request (~1–2 min).
 */
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '$lib/supabaseClient';
import { getDialectName, getDialectSystemInstruction, getLessonFormatRules } from '$lib/data/dialect-rules-v2';
import { generatedLessonV2Schema, type VocabItem } from '$lib/schemas/lesson-v2-schema';
import { assembleLessonV2, recurrenceHistogram } from '$lib/server/assemble-lesson-v2';
import {
	buildAi,
	generatePassages,
	generatePool,
	generateScenario,
	type GenerationContext
} from '$lib/server/lesson-v2-generation';
import { saveTutorLesson } from '$lib/helpers/lesson-file-helper';
import { trackActivitySimple } from '$lib/helpers/track-activity';
import { generateConceptExamples } from './extract';
import { selectedConcepts, selectedVocab, tutorSentences, wordsUsedIn } from './prepare';
import type { TutorLessonRow } from './store';

export const MIN_WORDS = 4;
// Keeps the build under the 300 s function limit (~3 s of generation per word) and the lesson under an hour.
export const MAX_WORDS = 80;
const MIN_RECURRENCE = 4;
const TARGET_RECURRENCE = 5;

/** Adds the kept words to the learner's review deck as new cards, skipping ones already saved. */
async function saveWords(userId: string, dialect: string, vocab: VocabItem[]) {
	const { data: existing } = await supabase
		.from('saved_word')
		.select('arabic_word')
		.eq('user_id', userId)
		.in('arabic_word', vocab.map((v) => v.arabic));
	const have = new Set((existing ?? []).map((r) => r.arabic_word));
	const now = Date.now();
	const rows = vocab
		.filter((v) => !have.has(v.arabic))
		.map((v) => ({
			id: uuidv4(),
			user_id: userId,
			arabic_word: v.arabic,
			english_word: v.english,
			transliterated_word: v.transliteration,
			dialect,
			created_at: now
		}));
	if (!rows.length) return;
	const { error } = await supabase.from('saved_word').insert(rows);
	if (error) throw new Error(`Failed to save words for review: ${error.message}`);
	trackActivitySimple(userId, 'saved_word', rows.length).catch(() => {});
}

type LessonSource = Pick<TutorLessonRow, 'id' | 'title' | 'dialect' | 'source_text' | 'extraction'>;

/** Generates and assembles the lesson from the kept items. No database or storage writes. */
export async function generateTutorLesson(row: LessonSource, selection: number[]) {
	const { items } = row.extraction;
	const vocab = selectedVocab(items, selection);
	if (vocab.length < MIN_WORDS) throw new Error(`Pick at least ${MIN_WORDS} words to build a lesson.`);
	if (vocab.length > MAX_WORDS) throw new Error(`Pick at most ${MAX_WORDS} words for one lesson.`);
	const concepts = selectedConcepts(items, selection);

	const ai = buildAi();
	const ctx: GenerationContext = {
		ai,
		system: getDialectSystemInstruction(row.dialect),
		rules: getLessonFormatRules(),
		dialectName: getDialectName(row.dialect),
		lessonLabel: `the learner's own tutor notes ("${row.title}")`,
		difficulty: "simple, everyday (match the difficulty of the learner's notes)",
		levelPhrase: "at the level of the learner's notes",
		vocab
	};

	const fromTutor = tutorSentences(row.source_text);
	// The pool is sequential (each batch targets the words still short); the rest runs alongside it.
	const [pool, examples, passages, scenario] = await Promise.all([
		generatePool(ctx, {
			targetPerWord: 3,
			batchSize: 15,
			maxBatches: Math.ceil(vocab.length / 7) + 1,
			extraInstructions: [
				'Besides the lesson vocabulary, use only very common words (pronouns, prepositions, basic verbs).',
				...(fromTutor.length
					? [`The learner's tutor wrote these sentences; include them word for word where they fit: ${fromTutor.join(' / ')}`]
					: [])
			]
		}),
		generateConceptExamples(ai, concepts, vocab, row.dialect).catch((e) => {
			console.warn('[tutor-notes] concept examples failed, using the patterns only:', e);
			return [];
		}),
		generatePassages(ctx, 1, '5 to 7 short, simple sentences'),
		generateScenario(ctx)
	]);
	if (pool.length < 5) throw new Error('Could not write enough practice sentences. Try again.');

	const lesson = generatedLessonV2Schema.parse(
		assembleLessonV2({
			topicId: `tutor-${row.id}`,
			title: row.title,
			dialect: row.dialect,
			level: 'B1',
			objectives: [],
			vocab,
			pool,
			passages,
			scenario,
			writing: true,
			minRecurrence: MIN_RECURRENCE,
			targetRecurrence: TARGET_RECURRENCE,
			introText:
				'These are the words from your tutor notes. Each one comes back about five times: ' +
				'recognising it, writing it, and using it in sentences.',
			concepts: concepts.map((c, i) => {
				const own = examples.filter((e) => e.concept.replace(/\D/g, '') === String(i + 1));
				// The extracted pattern's "english" is the concept label, so it's only a fallback example.
				const shown = own.length ? own : [c];
				return { title: c.english, text: c.explanation, examples: shown, words: wordsUsedIn(vocab, shown) };
			})
		})
	);

	const histogram = recurrenceHistogram(lesson);
	const short = vocab.filter((v) => (histogram[v.english] ?? 0) < MIN_RECURRENCE).map((v) => v.english);
	if (short.length) throw new Error(`Lesson check failed: not enough practice for ${short.join(', ')}`);

	return { lesson, vocab };
}

/** Saves the kept words for review, builds the lesson and stores it. */
export async function buildTutorLesson(row: TutorLessonRow, selection: number[]) {
	const vocab = selectedVocab(row.extraction.items, selection);
	if (vocab.length < MIN_WORDS) throw new Error(`Pick at least ${MIN_WORDS} words to build a lesson.`);
	if (vocab.length > MAX_WORDS) throw new Error(`Pick at most ${MAX_WORDS} words for one lesson.`);
	await saveWords(row.user_id, row.dialect, vocab);

	const { lesson } = await generateTutorLesson(row, selection);
	const storagePath = await saveTutorLesson(row.user_id, row.id, lesson);
	return { storagePath, wordCount: vocab.length, stepCount: lesson.steps.length };
}
