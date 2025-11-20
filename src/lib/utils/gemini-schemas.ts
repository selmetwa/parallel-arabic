/**
 * Zod schemas for Gemini API structured outputs
 * These schemas enforce the exact structure we expect from Gemini responses
 * Using Zod for type safety and validation, then converting to JSON Schema for Gemini API
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Schema for a single sentence/word with Arabic, English, and transliteration
 */
export const textWithTranslationSchema = z.object({
	arabic: z.string(),
	english: z.string(),
	transliteration: z.string()
});

export type TextWithTranslation = z.infer<typeof textWithTranslationSchema>;

/**
 * Schema for a sentence in a story (can include speaker for conversations)
 */
function createSentenceSchema(includeSpeaker: boolean = false) {
	const arabicSchema = z.object({
		text: z.string()
	});

	const englishSchema = z.object({
		text: z.string()
	});

	const transliterationSchema = z.object({
		text: z.string()
	});

	if (includeSpeaker) {
		const speakerSchema = z.object({
			name: z.string()
		});

		return z.object({
			arabic: arabicSchema,
			english: englishSchema,
			transliteration: transliterationSchema,
			speaker: speakerSchema
		});
	}

	return z.object({
		arabic: arabicSchema,
		english: englishSchema,
		transliteration: transliterationSchema
	});
}

/**
 * Schema for story generation (stories and conversations)
 */
export function createStorySchema(isConversation: boolean = false) {
	const titleSchema = z.object({
		arabic: z.string(),
		english: z.string()
	});

	const descriptionSchema = z.object({
		arabic: z.string(),
		english: z.string()
	});

	const schema = z.object({
		title: titleSchema,
		description: descriptionSchema,
		sentences: z.array(createSentenceSchema(isConversation)).min(1)
	});

	return {
		zodSchema: schema,
		jsonSchema: zodToJsonSchema(schema)
	};
}

export type StorySchema = z.infer<ReturnType<typeof createStorySchema>['zodSchema']>;

/**
 * Schema for sentence generation endpoints
 */
export function createSentencesSchema() {
	const schema = z.object({
		sentences: z.array(textWithTranslationSchema).min(1)
	});

	return {
		zodSchema: schema,
		jsonSchema: zodToJsonSchema(schema)
	};
}

export type SentencesSchema = z.infer<ReturnType<typeof createSentencesSchema>['zodSchema']>;

/**
 * Schema for word generation endpoint
 */
export function createWordsSchema() {
	const schema = z.object({
		words: z.array(textWithTranslationSchema).min(1)
	});

	return {
		zodSchema: schema,
		jsonSchema: zodToJsonSchema(schema)
	};
}

export type WordsSchema = z.infer<ReturnType<typeof createWordsSchema>['zodSchema']>;

/**
 * Schema for tutor chat / translation responses
 */
export function createTranslationResponseSchema() {
	const schema = textWithTranslationSchema;

	return {
		zodSchema: schema,
		jsonSchema: zodToJsonSchema(schema)
	};
}

export type TranslationResponseSchema = z.infer<ReturnType<typeof createTranslationResponseSchema>['zodSchema']>;

/**
 * Schema for updating translations (used in generate-words)
 */
export function createTranslationUpdateSchema() {
	const schema = z.object({
		english: z.string(),
		transliteration: z.string()
	});

	return {
		zodSchema: schema,
		jsonSchema: zodToJsonSchema(schema)
	};
}

export type TranslationUpdateSchema = z.infer<ReturnType<typeof createTranslationUpdateSchema>['zodSchema']>;

/**
 * Schema for translate-user-message endpoint (includes feedback)
 */
export function createTranslationWithFeedbackSchema() {
	const schema = z.object({
		arabic: z.string(),
		english: z.string(),
		transliteration: z.string(),
		feedback: z.string()
	});

	return {
		zodSchema: schema,
		jsonSchema: zodToJsonSchema(schema)
	};
}

export type TranslationWithFeedbackSchema = z.infer<ReturnType<typeof createTranslationWithFeedbackSchema>['zodSchema']>;

/**
 * Schema for YouTube transcript formatting
 */
export function createFormattedVideoSchema() {
	const lineSchema = z.object({
		start: z.string(),
		dur: z.string(),
		arabic: z.object({
			text: z.string()
		}),
		english: z.object({
			text: z.string()
		}),
		transliteration: z.object({
			text: z.string()
		})
	});

	const schema = z.object({
		title: z.object({
			arabic: z.string(),
			english: z.string()
		}),
		description: z.object({
			arabic: z.string(),
			english: z.string()
		}),
		lines: z.array(lineSchema).min(1)
	});

	return {
		zodSchema: schema,
		jsonSchema: zodToJsonSchema(schema)
	};
}

export type FormattedVideoSchema = z.infer<ReturnType<typeof createFormattedVideoSchema>['zodSchema']>;

/**
 * Schema for sentence segmentation (simple array of strings)
 */
export function createSentenceSegmentationSchema() {
	const schema = z.object({
		sentences: z.array(z.string()).min(1)
	});

	return {
		zodSchema: schema,
		jsonSchema: zodToJsonSchema(schema)
	};
}

export type SentenceSegmentationSchema = z.infer<ReturnType<typeof createSentenceSegmentationSchema>['zodSchema']>;

/**
 * Schema for lesson generation (complex nested structure)
 */
export function createLessonSchema() {
	const titleWithTransliterationSchema = z.object({
		arabic: z.string(),
		english: z.string(),
		transliteration: z.string()
	});

	const explanationSchema = z.object({
		english: z.string()
	});

	const lessonContentSchema = z.object({
		title: titleWithTransliterationSchema,
		phrases: z.array(textWithTranslationSchema).min(1),
		explanations: z.array(explanationSchema).optional()
	});

	const exerciseOptionSchema = z.object({
		arabic: z.string(),
		english: z.string(),
		transliteration: z.string(),
		isCorrect: z.boolean()
	});

	const hintSchema = z.object({
		english: z.string(),
		arabic: z.string(),
		transliteration: z.string()
	});

	const exerciseSchema = z.object({
		id: z.string(),
		type: z.enum(["multiple-choice", "fill-in-blank", "translation", "matching"]),
		question: z.object({
			english: z.string(),
			arabic: z.string().optional()
		}),
		options: z.array(exerciseOptionSchema).optional(),
		correctAnswer: z.union([z.string(), z.array(z.string())]),
		hint: hintSchema.optional()
	});

	const subLessonSchema = z.object({
		id: z.string(),
		title: titleWithTransliterationSchema,
		content: lessonContentSchema,
		exercises: z.array(exerciseSchema).min(1)
	});

	const schema = z.object({
		id: z.string(),
		title: titleWithTransliterationSchema,
		level: z.enum(["beginner", "intermediate", "advanced"]),
		subLessons: z.array(subLessonSchema).min(1)
	});

	return {
		zodSchema: schema,
		jsonSchema: zodToJsonSchema(schema)
	};
}

export type LessonSchema = z.infer<ReturnType<typeof createLessonSchema>['zodSchema']>;

/**
 * Schema for dialect comparison
 */
export function createDialectComparisonSchema() {
	const dialectSchema = z.object({
		arabic: z.string(),
		transliteration: z.string()
	});

	const schema = z.object({
		egyptian: dialectSchema,
		darija: dialectSchema,
		levantine: dialectSchema,
		fusha: dialectSchema
	});

	return {
		zodSchema: schema,
		jsonSchema: zodToJsonSchema(schema)
	};
}

export type DialectComparisonSchema = z.infer<ReturnType<typeof createDialectComparisonSchema>['zodSchema']>;

/**
 * Schema for word definition
 */
export function createWordDefinitionSchema() {
	const schema = z.object({
		arabic: z.string(),
		transliteration: z.string(),
		definition: z.string(),
		breakdown: z.array(z.object({
			word: z.string(),
			arabic: z.string(),
			transliteration: z.string(),
			meaning: z.string(),
			context: z.string().optional()
		})),
		contextualMeaning: z.string()
	});

	return {
		zodSchema: schema,
		jsonSchema: zodToJsonSchema(schema)
	};
}

export type WordDefinitionSchema = z.infer<ReturnType<typeof createWordDefinitionSchema>['zodSchema']>;
