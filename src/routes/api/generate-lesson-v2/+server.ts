import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { GoogleGenAI } from '@google/genai';
import { findV2Topic, hasV2Curriculum } from '$lib/data/curriculum-v2';
import { getDialectName, getDialectSystemInstruction, getLessonFormatRules } from '$lib/data/dialect-rules-v2';
import { createLessonVocabSchema, generatedLessonV2Schema, type VocabItem } from '$lib/schemas/lesson-v2-schema';
import { assembleLessonV2, recurrenceHistogram } from '$lib/server/assemble-lesson-v2';
import { saveLessonV2 } from '$lib/helpers/lesson-file-helper';
import {
	buildAi,
	callGemini,
	generatePassages,
	generatePool,
	generateScenario,
	type GenerationContext
} from '$lib/server/lesson-v2-generation';

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
	const rules = getLessonFormatRules();
	const system = getDialectSystemInstruction(dialect);
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
			system,
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
		const ctx: GenerationContext = {
			ai,
			system,
			rules,
			dialectName,
			lessonLabel: `"${topic.title}" (${module.level})`,
			difficulty: `${module.level}-appropriate`,
			levelPhrase: `at the ${module.level} level`,
			vocab
		};

		// --- Phase B: practice pool (coverage-driven batches) -------------
		const pool = await generatePool(ctx, { targetPerWord: 6, batchSize: 12, maxBatches: 9 });

		if (pool.length < 10) {
			return json({ error: 'Practice pool generation returned too few sentences' }, { status: 502 });
		}

		// --- Phase C1: reading-comprehension passages (level-scaled) -----
		const reading = LEVEL_READING[module.level] ?? LEVEL_READING.A1;
		const passages = await generatePassages(ctx, reading.count, reading.spec);

		// --- Phase C2: live-tutor scenario brief -------------------------
		const scenario = await generateScenario(ctx);

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
