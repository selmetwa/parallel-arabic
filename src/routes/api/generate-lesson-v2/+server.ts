import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';
import { findV2Topic, hasV2Curriculum } from '$lib/data/curriculum-v2';
import { getDialectRules, getDialectName } from '$lib/data/dialect-rules-v2';
import {
	createLessonVocabSchema,
	createPracticePoolSchema,
	createLessonPassageSchema,
	createScenarioBriefSchema,
	generatedLessonV2Schema,
	type VocabItem,
	type PracticeItem,
	type LessonPassageResponse,
	type ScenarioBriefResponse
} from '$lib/schemas/lesson-v2-schema';
import { assembleLessonV2, recurrenceHistogram } from '$lib/server/assemble-lesson-v2';
import { saveLessonV2 } from '$lib/helpers/lesson-file-helper';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import type { ZodType } from 'zod';

const MODEL = 'gemini-2.5-flash';

// Per-level reading-comprehension calibration. Lower levels get more, shorter,
// very simple passages; higher levels get fewer, longer, richer ones.
const LEVEL_READING: Record<string, { count: number; spec: string }> = {
	A1: { count: 2, spec: '3 to 4 VERY short and simple sentences (about 4-7 words each), using only the most basic everyday vocabulary' },
	A2: { count: 2, spec: '4 to 5 short, simple sentences' },
	B1: { count: 2, spec: 'a short paragraph of 5 to 7 sentences' },
	B2: { count: 2, spec: 'a paragraph of 6 to 8 sentences with some richer vocabulary' },
	C1: { count: 2, spec: 'a rich paragraph of 7 to 9 sentences' },
	C2: { count: 2, spec: 'a nuanced paragraph of 8 to 10 sentences' }
};

function buildAi() {
	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
	return new GoogleGenAI({ apiKey });
}

async function callGemini<T>(
	ai: GoogleGenAI,
	prompt: string,
	zodSchema: ZodType<T>,
	jsonSchema: object,
	maxOutputTokens: number
): Promise<T> {
	const response = await generateContentWithRetry(ai, {
		model: MODEL,
		contents: prompt,
		config: {
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
const norm = (s: string) => s.trim().toLowerCase();

export const POST: RequestHandler = async ({ request }) => {
	const { topicId, dialect = 'egyptian-arabic' } = await request.json();

	if (!topicId) {
		return json({ error: 'topicId is required' }, { status: 400 });
	}
	if (!hasV2Curriculum(dialect)) {
		return json({ error: `No v2 curriculum for dialect: ${dialect}` }, { status: 400 });
	}

	const found = findV2Topic(dialect, topicId);
	if (!found) {
		return json({ error: `Unknown topicId: ${topicId}` }, { status: 400 });
	}
	const { module, topic } = found;
	const rules = getDialectRules(dialect);
	const dialectName = getDialectName(dialect);

	let ai: GoogleGenAI;
	try {
		ai = buildAi();
	} catch {
		return json({ error: 'API key not configured' }, { status: 500 });
	}

	try {
		const topicContext = `
Lesson topic: "${topic.title}"
What the student studies: ${topic.description}
CEFR level: ${module.level}
Level objectives:
${module.objectives.map((o) => `- ${o}`).join('\n')}
`.trim();

		// --- Phase A: vocabulary -----------------------------------------
		const vocabSchema = createLessonVocabSchema();
		const vocabResp = await callGemini(
			ai,
			`${rules}

You are a professional ${dialectName} curriculum designer.
${topicContext}

Produce the 12 to 15 MOST useful vocabulary words/phrases for this lesson, appropriate for ${module.level}.
For each: arabic (clean), arabicTashkeel (with diacritics), english, transliteration, partOfSpeech, gender (only if meaningful), and wordAlignments (one entry per word).
Return JSON: { "vocab": [ ... ] }`,
			vocabSchema.zodSchema,
			vocabSchema.jsonSchema,
			12288
		);

		const vocab: VocabItem[] = vocabResp.vocab.slice(0, 15);
		if (vocab.length < 4) {
			return json({ error: 'Vocabulary generation returned too few items' }, { status: 502 });
		}
		const vocabGlosses = vocab.map((v) => v.english);
		const vocabList = vocab.map((v) => `${v.arabic} — ${v.english} (${v.transliteration})`).join('\n');

		// --- Phase B: practice pool (coverage-driven batches) -------------
		const poolSchema = createPracticePoolSchema();
		const pool: PracticeItem[] = [];
		const perWordCount = new Map<string, number>();
		vocabGlosses.forEach((g) => perWordCount.set(norm(g), 0));
		const TARGET_PER_WORD = 6;
		const MAX_BATCHES = 9;

		for (let b = 0; b < MAX_BATCHES; b++) {
			const under = vocabGlosses.filter((g) => (perWordCount.get(norm(g)) ?? 0) < TARGET_PER_WORD);
			if (under.length === 0) break;

			const batch = await callGemini(
				ai,
				`${rules}

You are writing practice sentences for a ${dialectName} lesson on "${topic.title}" (${module.level}).

Lesson vocabulary (reuse ONLY these words):
${vocabList}

Write 12 short, natural, ${module.level}-appropriate sentences. Requirements:
- Each sentence MUST reuse 1 to 3 of the lesson vocabulary words.
- Prioritize these words that still need more practice: ${under.join(', ')}.
- Vary the sentences (statements, questions, different subjects). No duplicates.
- Keep each sentence concise (avoid very long sentences).
- "targetWords": the exact english glosses (from the list above) that the sentence uses.
- Provide arabic, arabicTashkeel, english, transliteration, wordAlignments, targetWords.
Return JSON: { "sentences": [ ... ] }`,
				poolSchema.zodSchema,
				poolSchema.jsonSchema,
				12288
			);

			for (const s of batch.sentences) {
				// Keep only target words that match the lesson vocab (normalized).
				const matched = s.targetWords
					.map((w) => vocabGlosses.find((g) => norm(g) === norm(w)))
					.filter((g): g is string => Boolean(g));
				if (matched.length === 0) continue;
				const clean: PracticeItem = { ...s, targetWords: Array.from(new Set(matched)) };
				pool.push(clean);
				clean.targetWords.forEach((g) =>
					perWordCount.set(norm(g), (perWordCount.get(norm(g)) ?? 0) + 1)
				);
			}
		}

		if (pool.length < 10) {
			return json({ error: 'Practice pool generation returned too few sentences' }, { status: 502 });
		}

		// --- Phase C1: reading-comprehension passages (level-scaled) -----
		const passageSchema = createLessonPassageSchema();
		const reading = LEVEL_READING[module.level] ?? LEVEL_READING.A1;
		const passages: LessonPassageResponse[] = [];
		for (let p = 0; p < reading.count; p++) {
			try {
				const passage = await callGemini(
					ai,
					`${rules}

Write a reading-comprehension passage for a ${dialectName} lesson on "${topic.title}" (${module.level}).
Length and difficulty for this level: ${reading.spec}.
Keep it strictly at the ${module.level} level — simple and natural. It should reuse the lesson vocabulary:
${vocabList}
${p > 0 ? 'Make this passage DIFFERENT from a typical first example (a different little scene or speaker).' : ''}
Provide a short english "title" and "sentences" (each with arabic, arabicTashkeel, english, transliteration, wordAlignments).
Return JSON: { "title": "...", "sentences": [ ... ] }`,
					passageSchema.zodSchema,
					passageSchema.jsonSchema,
					8192
				);
				if (passage?.sentences?.length) passages.push(passage);
			} catch (e) {
				console.warn('[generate-lesson-v2] passage generation failed, continuing:', e);
			}
		}

		// --- Phase C2: live-tutor scenario brief -------------------------
		const scenarioSchema = createScenarioBriefSchema();
		let scenario: ScenarioBriefResponse | null = null;
		try {
			scenario = await callGemini(
				ai,
				`You are designing a short roleplay for a ${dialectName} lesson on "${topic.title}" (${module.level}).
Lesson vocabulary the student should use:
${vocabList}

Describe a simple, realistic scenario where the student practices this vocabulary in conversation.
Return JSON: { "situation", "studentRole", "otherRole", "goalEnglish", "targetWords" }.
"targetWords" = the english glosses (from the list) the student should use. Keep it ${module.level}-appropriate.`,
				scenarioSchema.zodSchema,
				scenarioSchema.jsonSchema,
				2048
			);
			if (scenario) {
				scenario = {
					...scenario,
					targetWords: scenario.targetWords
						.map((w) => vocabGlosses.find((g) => norm(g) === norm(w)))
						.filter((g): g is string => Boolean(g))
				};
			}
		} catch (e) {
			console.warn('[generate-lesson-v2] scenario generation failed, continuing without it:', e);
		}

		// --- Phase D: deterministic assembly -----------------------------
		const lesson = assembleLessonV2({
			topicId,
			title: topic.title,
			dialect,
			level: module.level,
			objectives: module.objectives,
			vocab,
			pool,
			passages,
			scenario
		});

		// Validate our own assembled output before saving.
		const parsed = generatedLessonV2Schema.parse(lesson);
		await saveLessonV2(parsed);

		const histogram = recurrenceHistogram(parsed);
		const minRecurrence = Math.min(...Object.values(histogram));

		return json({
			ok: true,
			topicId,
			title: parsed.title,
			level: parsed.level,
			vocabCount: parsed.vocab.length,
			poolSize: pool.length,
			stepCount: parsed.steps.length,
			minRecurrence,
			histogram
		});
	} catch (e) {
		console.error('[generate-lesson-v2] error:', e);
		const message = e instanceof Error ? e.message : 'Generation failed';
		return json({ error: message }, { status: 500 });
	}
};
