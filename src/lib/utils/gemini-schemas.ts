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
 * Includes review words and sentences for spaced repetition learning
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
		type: z.enum(["multiple-choice", "fill-in-blank", "matching"]),
		question: z.object({
			english: z.string(),
			arabic: z.string().optional()
		}),
		options: z.array(exerciseOptionSchema).optional(),
		correctAnswer: z.union([z.string(), z.array(z.string())]),
		hint: hintSchema.optional()
	}).refine(
		(data) => {
			// Fill-in-blank and multiple-choice exercises MUST have options
			if ((data.type === "fill-in-blank" || data.type === "multiple-choice") && (!data.options || data.options.length === 0)) {
				return false;
			}
			return true;
		},
		{
			message: "fill-in-blank and multiple-choice exercises must include an options array"
		}
	);

	const subLessonSchema = z.object({
		id: z.string(),
		title: titleWithTransliterationSchema,
		content: lessonContentSchema,
		exercises: z.array(exerciseSchema).min(1)
	});

	// Review section schema - words and sentences for spaced repetition
	const reviewSectionSchema = z.object({
		words: z.array(textWithTranslationSchema).length(10), // Exactly 10 review words
		sentences: z.array(textWithTranslationSchema).length(5) // Exactly 5 review sentences that include the review words
	});

	// Grammar rule schema
	const grammarRuleSchema = z.object({
		title: z.string(), // Name of the grammar rule
		arabic: z.string().optional(), // Arabic explanation
		english: z.string(), // English explanation
		examples: z.array(textWithTranslationSchema).optional() // Example sentences/phrases
	});

	// Cultural note schema
	const culturalNoteSchema = z.object({
		title: z.string().optional(), // Title of the cultural note
		arabic: z.string().optional(), // Arabic cultural context
		english: z.string() // English cultural context
	});

	// Pronunciation tip schema
	const pronunciationTipSchema = z.object({
		sound: z.string(), // The Arabic sound/letter
		transliteration: z.string().optional(), // How it's written in transliteration
		description: z.string(), // How to pronounce it
		examples: z.array(z.object({
			arabic: z.string(),
			transliteration: z.string(),
			english: z.string()
		})).optional() // Example words
	});

	// Common mistake schema
	const commonMistakeSchema = z.object({
		mistake: z.string(), // The incorrect usage
		correct: z.string(), // The correct usage
		explanation: z.string(), // Why it's wrong and how to fix it
		examples: z.array(z.object({
			incorrect: textWithTranslationSchema,
			correct: textWithTranslationSchema
		})).optional()
	});

	// Related lesson schema
	const relatedLessonSchema = z.object({
		id: z.string().optional(), // Lesson ID if it exists
		title: z.string(), // Title of related lesson
		reason: z.string().optional() // Why it's related (e.g., "builds on", "prerequisite", "similar topic")
	});

	// Quiz schema - comprehensive quiz at the end of the lesson
	const quizSchema = z.object({
		title: z.string().optional(), // Quiz title
		description: z.string().optional(), // Quiz description
		questions: z.array(exerciseSchema).min(3).max(10) // 3-10 quiz questions
	});

	const schema = z.object({
		id: z.string(),
		title: titleWithTransliterationSchema,
		level: z.enum(["beginner", "intermediate", "advanced"]),
		description: z.object({
			arabic: z.string().optional(),
			english: z.string()
		}).optional(),
		learningObjectives: z.array(z.string()).optional(), // What students will learn
		estimatedDuration: z.number().optional(), // Duration in minutes
		prerequisites: z.array(z.string()).optional(), // Required prior knowledge
		subLessons: z.array(subLessonSchema).min(1),
		review: reviewSectionSchema, // Review words and sentences
		summary: z.object({
			arabic: z.string().optional(),
			english: z.string()
		}).optional(), // Lesson summary/key takeaways
		keyTakeaways: z.array(z.string()).optional(), // Main points to remember
		grammarFocus: z.array(grammarRuleSchema).optional(), // Specific grammar rules covered
		culturalNotes: z.array(culturalNoteSchema).optional(), // Cultural context related to the lesson
		pronunciationTips: z.array(pronunciationTipSchema).optional(), // Notes for difficult sounds
		commonMistakes: z.array(commonMistakeSchema).optional(), // Errors to avoid
		relatedLessons: z.array(relatedLessonSchema).optional(), // Links to related lessons
		difficultyTags: z.array(z.enum([
			"vocabulary-heavy",
			"grammar-focused",
			"conversation-focused",
			"reading-focused",
			"writing-focused",
			"listening-focused",
			"speaking-focused",
			"beginner-friendly",
			"challenging",
			"interactive"
		])).optional(), // Tags describing lesson characteristics
		audioPractice: z.object({
			hasSpeakingPractice: z.boolean().optional(), // Whether lesson includes speaking practice
			hasListeningPractice: z.boolean().optional(), // Whether lesson includes listening practice
			audioFilesCount: z.number().optional(), // Number of audio files/examples
			notes: z.string().optional() // Additional notes about audio practice
		}).optional(), // Speaking/listening practice indicators
		quiz: quizSchema.optional() // Comprehensive quiz at the end of the lesson
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
