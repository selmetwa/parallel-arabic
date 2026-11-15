/**
 * Shared Gemini building blocks for v2 lessons: the practice pool, reading
 * passages and the tutor scenario. Used by the curriculum endpoint
 * (/api/generate-lesson-v2) and by tutor-notes lessons.
 *
 * Every call is flat and schema-constrained; the lesson itself is assembled in
 * code (assemble-lesson-v2.ts).
 */
import { GoogleGenAI, type ContentListUnion } from '@google/genai';
import { env } from '$env/dynamic/private';
import {
	createPracticePoolSchema,
	createLessonPassageSchema,
	createScenarioBriefSchema,
	type VocabItem,
	type PracticeItem,
	type LessonPassageResponse,
	type ScenarioBriefResponse
} from '$lib/schemas/lesson-v2-schema';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import type { ZodType } from 'zod';

export const LESSON_MODEL = 'gemini-2.5-flash';

export function buildAi() {
	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
	return new GoogleGenAI({ apiKey });
}

export async function callGemini<T>(
	ai: GoogleGenAI,
	systemInstruction: string,
	contents: ContentListUnion,
	zodSchema: ZodType<T>,
	jsonSchema: object,
	maxOutputTokens: number
): Promise<T> {
	const response = await generateContentWithRetry(ai, {
		model: LESSON_MODEL,
		contents,
		config: {
			systemInstruction,
			temperature: 0.7,
			maxOutputTokens,
			topP: 0.9,
			thinkingConfig: { thinkingBudget: 0 },
			responseMimeType: 'application/json',
			responseJsonSchema: jsonSchema
		}
	});
	const text = response.text;
	if (!text) throw new Error('Empty response from Gemini');
	return parseJsonFromGeminiResponse(text, zodSchema) as T;
}

/** Normalize an english gloss for matching pool targetWords to vocab. */
export const normGloss = (s: string) => s.trim().toLowerCase();

export function vocabListText(vocab: VocabItem[]) {
	return vocab.map((v) => `${v.arabic} — ${v.english} (${v.transliteration})`).join('\n');
}

export interface GenerationContext {
	ai: GoogleGenAI;
	/** Dialect system instruction (getDialectSystemInstruction). */
	system: string;
	/** Output-format rules (getLessonFormatRules). */
	rules: string;
	dialectName: string;
	/** What the lesson is about, e.g. `"Greetings" (A1)`. */
	lessonLabel: string;
	/** Difficulty wording dropped into prompts, e.g. "A1-appropriate". */
	difficulty: string;
	/** Used in "Keep it strictly …", e.g. "at the A1 level". */
	levelPhrase: string;
	vocab: VocabItem[];
}

export interface PoolOptions {
	targetPerWord: number;
	batchSize: number;
	maxBatches: number;
	/** Extra prompt lines, appended to the requirements list. */
	extraInstructions?: string[];
}

/**
 * Coverage-driven practice pool: keeps asking for sentences that prioritise the
 * words still under `targetPerWord` until every word is covered or the batch cap hits.
 */
export async function generatePool(ctx: GenerationContext, opts: PoolOptions): Promise<PracticeItem[]> {
	const poolSchema = createPracticePoolSchema();
	const glosses = ctx.vocab.map((v) => v.english);
	const list = vocabListText(ctx.vocab);
	const pool: PracticeItem[] = [];
	const perWordCount = new Map<string, number>();
	glosses.forEach((g) => perWordCount.set(normGloss(g), 0));

	for (let b = 0; b < opts.maxBatches; b++) {
		const under = glosses.filter((g) => (perWordCount.get(normGloss(g)) ?? 0) < opts.targetPerWord);
		if (under.length === 0) break;

		const batch = await callGemini(
			ctx.ai,
			ctx.system,
			`${ctx.rules}

You are writing practice sentences for a ${ctx.dialectName} lesson on ${ctx.lessonLabel}.

Lesson vocabulary (reuse ONLY these words):
${list}

Write ${opts.batchSize} short, natural, ${ctx.difficulty} sentences. Requirements:
- Each sentence MUST reuse 1 to 3 of the lesson vocabulary words.
- Prioritize these words that still need more practice: ${under.join(', ')}.
- Vary the sentences (statements, questions, different subjects). No duplicates.
- Keep each sentence concise (avoid very long sentences).
${(opts.extraInstructions ?? []).map((l) => `- ${l}\n`).join('')}- "targetWords": the exact english glosses (from the list above) that the sentence uses.
- Provide arabic, arabicTashkeel, english, transliteration, wordAlignments, targetWords.
Return JSON: { "sentences": [ ... ] }`,
			poolSchema.zodSchema,
			poolSchema.jsonSchema,
			12288
		);

		for (const s of batch.sentences) {
			// Keep only target words that match the lesson vocab (normalized).
			const matched = s.targetWords
				.map((w) => glosses.find((g) => normGloss(g) === normGloss(w)))
				.filter((g): g is string => Boolean(g));
			if (matched.length === 0) continue;
			const clean: PracticeItem = { ...s, targetWords: Array.from(new Set(matched)) };
			pool.push(clean);
			clean.targetWords.forEach((g) => perWordCount.set(normGloss(g), (perWordCount.get(normGloss(g)) ?? 0) + 1));
		}
	}

	return pool;
}

/** Reading passages; a failed passage is skipped rather than failing the lesson. */
export async function generatePassages(
	ctx: GenerationContext,
	count: number,
	spec: string
): Promise<LessonPassageResponse[]> {
	const passageSchema = createLessonPassageSchema();
	const passages: LessonPassageResponse[] = [];
	for (let p = 0; p < count; p++) {
		try {
			const passage = await callGemini(
				ctx.ai,
				ctx.system,
				`${ctx.rules}

Write a reading-comprehension passage for a ${ctx.dialectName} lesson on ${ctx.lessonLabel}.
Length and difficulty for this level: ${spec}.
Keep it strictly ${ctx.levelPhrase} — simple and natural. It should reuse the lesson vocabulary:
${vocabListText(ctx.vocab)}
${p > 0 ? 'Make this passage DIFFERENT from a typical first example (a different little scene or speaker).' : ''}
Provide a short english "title" and "sentences" (each with arabic, arabicTashkeel, english, transliteration, wordAlignments).
Return JSON: { "title": "...", "sentences": [ ... ] }`,
				passageSchema.zodSchema,
				passageSchema.jsonSchema,
				8192
			);
			if (passage?.sentences?.length) passages.push(passage);
		} catch (e) {
			console.warn('[lesson-v2] passage generation failed, continuing:', e);
		}
	}
	return passages;
}

/** Live-tutor scenario brief, with targetWords limited to the lesson vocab. Null on failure. */
export async function generateScenario(ctx: GenerationContext): Promise<ScenarioBriefResponse | null> {
	const scenarioSchema = createScenarioBriefSchema();
	const glosses = ctx.vocab.map((v) => v.english);
	try {
		const scenario = await callGemini(
			ctx.ai,
			ctx.system,
			`You are designing a short roleplay for a ${ctx.dialectName} lesson on ${ctx.lessonLabel}.
Lesson vocabulary the student should use:
${vocabListText(ctx.vocab)}

Describe a simple, realistic scenario where the student practices this vocabulary in conversation.
Return JSON: { "situation", "studentRole", "otherRole", "goalEnglish", "targetWords" }.
"targetWords" = the english glosses (from the list) the student should use. Keep it ${ctx.difficulty}.`,
			scenarioSchema.zodSchema,
			scenarioSchema.jsonSchema,
			2048
		);
		if (!scenario) return null;
		return {
			...scenario,
			targetWords: scenario.targetWords
				.map((w) => glosses.find((g) => normGloss(g) === normGloss(w)))
				.filter((g): g is string => Boolean(g))
		};
	} catch (e) {
		console.warn('[lesson-v2] scenario generation failed, continuing without it:', e);
		return null;
	}
}
