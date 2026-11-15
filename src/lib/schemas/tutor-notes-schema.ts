import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { sentenceItemSchema, type SentenceItem } from './lesson-v2-schema';

/**
 * Tutor-notes schemas. Same rule as lesson-v2-schema: everything sent to Gemini
 * is one object wrapping a flat array, so the response schema stays small.
 */

// One line of the learner's notes, resolved to a vocab word or a grammar concept.
// Concepts use the sentence fields for the pattern itself (e.g. "بـ + tool").
export const extractedItemSchema = sentenceItemSchema.extend({
	kind: z.enum(['vocab', 'concept']),
	partOfSpeech: z.string(), // "" for concepts
	explanation: z.string(), // concept: how the pattern works; vocab: usage note or ""
	sourceLine: z.string(), // the raw line it came from
	group: z.string() // short topic label, used to keep related words together
});

export function createExtractionSchema() {
	const schema = z.object({ items: z.array(extractedItemSchema) });
	return { zodSchema: schema, jsonSchema: zodToJsonSchema(schema) };
}

// Example sentences for grammar concepts; `concept` is the concept's english label.
export const conceptExampleSchema = sentenceItemSchema.extend({
	concept: z.string()
});

export function createConceptExamplesSchema() {
	const schema = z.object({ examples: z.array(conceptExampleSchema) });
	return { zodSchema: schema, jsonSchema: zodToJsonSchema(schema) };
}

export type ExtractedItem = z.infer<typeof extractedItemSchema>;
export type ConceptExample = z.infer<typeof conceptExampleSchema>;

/** What tutor_lesson.extraction holds. */
export interface TutorExtraction {
	items: ExtractedItem[];
	/** Arabic words in the notes that no extracted item covers. */
	uncovered: string[];
}

export type TutorLessonStatus = 'extracted' | 'building' | 'ready' | 'failed';

export type { SentenceItem };
