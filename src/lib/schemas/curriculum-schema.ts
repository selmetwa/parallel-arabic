import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Basic types
const textWithTranslationSchema = z.object({
    arabic: z.string(), // Arabic text. Use diacritical marks (tashkeel/harakat) SPARINGLY - only when needed for pronunciation clarity (e.g., gender distinctions, ambiguous words). Clean text ONLY - no grammatical markers like "(لمذكر)" or "(لمؤنث)"
    english: z.string(),
    transliteration: z.string(),
    diacriticalNotes: z.string().optional() // Optional: Deprecated - no longer needed as diacritic guide is available in modal
});

// Content Step Types
const contentStepSchema = z.object({
    type: z.literal('content'),
    content: z.object({
        title: z.object({
            english: z.string(),
            arabic: z.string().optional()
        }),
        text: z.string(), // Explanatory text about the lesson content
        examples: z.array(textWithTranslationSchema).optional(), // Examples should use diacritical marks SPARINGLY - only when needed for pronunciation clarity
        audioText: z.string().optional() // Text to be spoken (if we generate audio later)
    })
});

// Exercise Step Types
const exerciseOptionSchema = z.object({
    id: z.string(),
    text: z.string(), // REQUIRED: Option text MUST be in Arabic. Use diacritical marks SPARINGLY - only when needed for pronunciation clarity. Each option text MUST be unique (no duplicates). Clean text ONLY - no grammatical markers like "(لمذكر)" or "(لمؤنث)"
    isCorrect: z.boolean()
});

const exerciseStepSchema = z.object({
    type: z.literal('exercise'),
    exerciseType: z.enum(['multiple-choice', 'fill-in-blank', 'matching']),
    question: z.string(), // REQUIRED: Question MUST be in English. For fill-in-blank, may contain Arabic text in the blank part, but the question itself should be in English.
    options: z.array(exerciseOptionSchema), // All options MUST be in Arabic text
    correctAnswerId: z.string(), // For matching/multiple choice
    explanation: z.string().optional(), // Explain why this answer is correct
        hint: z.object({
        transliteration: z.string(), // REQUIRED: Transliteration (phonetic spelling) of the correct Arabic answer
        arabic: z.string().optional() // Optional: The Arabic text of the correct answer (use diacritical marks sparingly - only when needed)
    }) // REQUIRED: All exercises must include a transliteration hint to help with pronunciation
});

// Practice Sentence Step Type
const practiceSentenceStepSchema = z.object({
    type: z.literal('practice-sentence'),
    sentence: textWithTranslationSchema, // Arabic, English, Transliteration
    context: z.string().optional() // Optional context or explanation
});

// Union of step types
const lessonStepSchema = z.union([contentStepSchema, exerciseStepSchema, practiceSentenceStepSchema]);

// Main Lesson Schema
const generatedLessonSchema = z.object({
    topicId: z.string(),
    title: z.string(),
    dialect: z.string(),
    steps: z.array(lessonStepSchema)
});

export function createLessonSchema() {
    return {
        zodSchema: generatedLessonSchema,
        jsonSchema: zodToJsonSchema(generatedLessonSchema)
    };
}

// Export the schema directly for backward compatibility
export { generatedLessonSchema };

export type GeneratedLesson = z.infer<typeof generatedLessonSchema>;
export type LessonStep = z.infer<typeof lessonStepSchema>;
export type ContentStep = z.infer<typeof contentStepSchema>;
export type ExerciseStep = z.infer<typeof exerciseStepSchema>;
export type PracticeSentenceStep = z.infer<typeof practiceSentenceStepSchema>;

