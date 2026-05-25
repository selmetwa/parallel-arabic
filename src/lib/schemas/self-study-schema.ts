import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { Dialect } from '$lib/types/index';

// ─── Shared primitives ────────────────────────────────────────────────────────

const vocabWordSchema = z.object({
    arabic: z.string(),
    english: z.string(),
    transliteration: z.string()
});

const conjugationRowSchema = z.object({
    pronoun: z.string(),
    pronounEnglish: z.string(),
    past: z.string(),
    present: z.string(),
    future: z.string(),
    transliteration: z.string()
});

const grammarConceptSchema = z.object({
    verb: z.string(),
    transliteration: z.string(),
    english: z.string(),
    rule: z.string(),
    conjugationTable: z.array(conjugationRowSchema)
});

// ─── Flat step schema (no discriminated union → no anyOf in JSON Schema) ─────
// All type-specific fields are optional; the `type` field drives rendering.

const selfStudyStepSchema = z.object({
    type: z.enum(['reading', 'multiple-choice', 'writing', 'speaking']),

    // ── reading fields ──────────────────────────────────────────────────────
    title: z.string().optional(),
    passageArabic: z.string().optional(),
    passageEnglish: z.string().optional(),
    passageTransliteration: z.string().optional(),
    wordAlignments: z.array(z.object({
        arabic: z.string(),
        english: z.string(),
        transliteration: z.string()
    })).optional(),

    // ── multiple-choice fields ──────────────────────────────────────────────
    focus: z.enum(['vocabulary', 'grammar']).optional(),
    // questionLanguage drives option rendering:
    //   'english' → question in English, options are Arabic + transliteration
    //   'arabic'  → question in Arabic,  options are English text
    questionLanguage: z.enum(['english', 'arabic']).optional(),
    question: z.string().optional(),
    options: z.array(z.object({
        id: z.string(),
        arabic: z.string().optional(),       // populated when questionLanguage = 'english'
        transliteration: z.string().optional(),
        english: z.string().optional(),      // populated when questionLanguage = 'arabic'
        isCorrect: z.boolean()
    })).optional(),
    explanation: z.string().optional(),

    // ── writing fields ──────────────────────────────────────────────────────
    promptEnglish: z.string().optional(),
    targetArabic: z.string().optional(),          // clean Arabic, no diacritics
    targetArabicTashkeel: z.string().optional(),  // same sentence with full tashkeel
    hint: z.string().optional(),                  // transliteration

    // ── speaking fields ─────────────────────────────────────────────────────
    speakingEnglish: z.string().optional(),
    speakingArabic: z.string().optional(),
    speakingTransliteration: z.string().optional(),

    // ── shared optional ─────────────────────────────────────────────────────
    tip: z.string().optional()
});

// ─── Root session schema ──────────────────────────────────────────────────────

const selfStudySessionSchema = z.object({
    title: z.string(),
    dialect: z.string(),
    level: z.string(),
    vocabulary: z.array(vocabWordSchema),
    grammarConcept: grammarConceptSchema,
    steps: z.array(selfStudyStepSchema)
});

// ─── Exports ──────────────────────────────────────────────────────────────────

export function createSelfStudySchema() {
    return {
        zodSchema: selfStudySessionSchema,
        jsonSchema: zodToJsonSchema(selfStudySessionSchema)
    };
}

export type VocabWord = z.infer<typeof vocabWordSchema>;
export type ConjugationRow = z.infer<typeof conjugationRowSchema>;
export type GrammarConcept = z.infer<typeof grammarConceptSchema>;
export type SelfStudyStep = z.infer<typeof selfStudyStepSchema>;
export type SelfStudySession = z.infer<typeof selfStudySessionSchema> & { dialect: Dialect };
