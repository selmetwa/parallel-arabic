import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Lesson v2 schemas.
 *
 * Two layers:
 *  (a) Flat GENERATION sub-schemas sent to Gemini as `responseJsonSchema`.
 *      Each is a single object wrapping flat arrays of primitives — structurally
 *      identical to the schemas Gemini already handles reliably
 *      (see createSentencesSchema / createScenarioVocabSchema in
 *      src/lib/utils/gemini-schemas.ts). We never ask one call for the whole
 *      nested lesson, which is what historically triggered Gemini 400s.
 *  (b) The final, richly-nested lesson schema (generatedLessonV2Schema). This is
 *      validated locally on our own assembled output and used to type the player.
 *      It is NEVER passed to Gemini, so nesting is safe.
 */

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

// Per-word interlinear alignment. Matches the existing wordAlignmentSchema
// (src/lib/utils/gemini-schemas.ts:24-28) that /api/tutor-chat produces and
// ArabicWordDisplay / Sentence / ConversationMessage consume. Powers the
// per-word English / Arabic / transliteration toggle in-lesson.
export const wordAlignmentSchema = z.object({
	arabic: z.string(), // a single Arabic word/token
	english: z.string(), // its English gloss
	transliteration: z.string() // its Latin-letter transliteration
});

// Shared sentence shape consumed by the existing practice components.
// `arabic` is the clean answer-key (no diacritics); `arabicTashkeel` is the
// display form with diacritics; `wordAlignments` drives the interlinear toggle.
export const sentenceItemSchema = z.object({
	arabic: z.string(),
	arabicTashkeel: z.string(),
	english: z.string(),
	transliteration: z.string(),
	wordAlignments: z.array(wordAlignmentSchema)
});

// A single vocabulary item — a sentence-shaped entry plus grammatical metadata.
export const vocabItemSchema = sentenceItemSchema.extend({
	partOfSpeech: z.string(), // "noun" | "verb" | "phrase" | "adjective" | ...
	gender: z.string().optional() // "m" | "f" | "" — only where it is meaningful
});

// A practice-pool sentence, tagged with the lesson vocab it drills. The
// assembler uses `targetWords` to hit the per-word recurrence quota.
export const practiceItemSchema = sentenceItemSchema.extend({
	targetWords: z.array(z.string()) // english glosses of the vocab reused here
});

// ---------------------------------------------------------------------------
// (a) Generation sub-schemas (sent to Gemini — keep FLAT)
// ---------------------------------------------------------------------------

/** Phase A — lesson vocabulary (12–15 items; count enforced in the PROMPT). */
export function createLessonVocabSchema() {
	const schema = z.object({ vocab: z.array(vocabItemSchema) });
	return { zodSchema: schema, jsonSchema: zodToJsonSchema(schema) };
}

/** Phase B — a batch of practice sentences that reuse the lesson vocab. */
export function createPracticePoolSchema() {
	const schema = z.object({ sentences: z.array(practiceItemSchema) });
	return { zodSchema: schema, jsonSchema: zodToJsonSchema(schema) };
}

/** Phase C1 — a short reading passage as an array of sentences. */
export function createLessonPassageSchema() {
	const schema = z.object({
		title: z.string(),
		sentences: z.array(sentenceItemSchema)
	});
	return { zodSchema: schema, jsonSchema: zodToJsonSchema(schema) };
}

/** Phase C2 — a live-tutor scenario brief (drives /api/scenario-intro + /api/tutor-chat). */
export function createScenarioBriefSchema() {
	const schema = z.object({
		situation: z.string(),
		studentRole: z.string(),
		otherRole: z.string(),
		goalEnglish: z.string(),
		targetWords: z.array(z.string())
	});
	return { zodSchema: schema, jsonSchema: zodToJsonSchema(schema) };
}

// ---------------------------------------------------------------------------
// (b) Final assembled lesson schema (validated locally; NOT sent to Gemini)
// ---------------------------------------------------------------------------

const mcqOptionSchema = sentenceItemSchema.extend({ isCorrect: z.boolean() });

export const lessonStepV2Schema = z.discriminatedUnion('type', [
	// Teaching card
	z.object({
		type: z.literal('content'),
		title: z.string(),
		text: z.string(),
		examples: z.array(sentenceItemSchema).optional()
	}),
	// Flashcard-style vocabulary introduction (a small chunk of new words)
	z.object({
		type: z.literal('vocab-intro'),
		items: z.array(vocabItemSchema)
	}),
	// Recognition: pick the correct Arabic for an English prompt (or vice-versa)
	z.object({
		type: z.literal('multiple-choice'),
		prompt: z.string(),
		options: z.array(mcqOptionSchema),
		correctIndex: z.number(),
		targetWords: z.array(z.string())
	}),
	// Production EN→AR: learner types the Arabic for the English sentence
	z.object({
		type: z.literal('typing'),
		sentence: sentenceItemSchema,
		targetWords: z.array(z.string())
	}),
	// Sentence building: reorder shuffled Arabic word tiles
	z.object({
		type: z.literal('reorder'),
		sentence: sentenceItemSchema,
		targetWords: z.array(z.string())
	}),
	// Reverse AR→EN: learner picks/recalls the English meaning
	z.object({
		type: z.literal('translate'),
		sentence: sentenceItemSchema,
		options: z.array(mcqOptionSchema),
		correctIndex: z.number(),
		targetWords: z.array(z.string())
	}),
	// Speaking: record and score against the target sentence
	z.object({
		type: z.literal('speaking'),
		sentence: sentenceItemSchema,
		targetWords: z.array(z.string())
	}),
	// Interactive reading passage
	z.object({
		type: z.literal('reading'),
		title: z.string(),
		sentences: z.array(sentenceItemSchema)
	}),
	// Live AI mini-conversation scoped to the lesson vocab
	z.object({
		type: z.literal('tutor-conversation'),
		situation: z.string(),
		studentRole: z.string(),
		otherRole: z.string(),
		goalEnglish: z.string(),
		targetWords: z.array(z.string())
	})
]);

export const generatedLessonV2Schema = z.object({
	schemaVersion: z.literal(2),
	topicId: z.string(),
	title: z.string(),
	dialect: z.string(),
	level: z.string(), // CEFR level, e.g. "A1"
	objectives: z.array(z.string()),
	vocab: z.array(vocabItemSchema),
	steps: z.array(lessonStepV2Schema)
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WordAlignment = z.infer<typeof wordAlignmentSchema>;
export type SentenceItem = z.infer<typeof sentenceItemSchema>;
export type VocabItem = z.infer<typeof vocabItemSchema>;
export type PracticeItem = z.infer<typeof practiceItemSchema>;
export type LessonStepV2 = z.infer<typeof lessonStepV2Schema>;
export type GeneratedLessonV2 = z.infer<typeof generatedLessonV2Schema>;

export type LessonVocabResponse = z.infer<ReturnType<typeof createLessonVocabSchema>['zodSchema']>;
export type PracticePoolResponse = z.infer<ReturnType<typeof createPracticePoolSchema>['zodSchema']>;
export type LessonPassageResponse = z.infer<ReturnType<typeof createLessonPassageSchema>['zodSchema']>;
export type ScenarioBriefResponse = z.infer<ReturnType<typeof createScenarioBriefSchema>['zodSchema']>;
