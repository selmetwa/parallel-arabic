import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';
import { getCurriculumV2, hasV2Curriculum } from '$lib/data/curriculum-v2';
import { getDialectName } from '$lib/data/dialect-rules-v2';
import {
	generatedLessonV2Schema,
	createScenarioBriefSchema,
	type VocabItem,
	type SentenceItem,
	type ScenarioBriefResponse
} from '$lib/schemas/lesson-v2-schema';
import {
	assembleAssessmentV2,
	type HarvestedSentence
} from '$lib/server/assemble-assessment-v2';
import { loadLessonV2, saveLessonV2 } from '$lib/helpers/lesson-file-helper';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';

const REVIEW_RE = /\b(review|assessment|test)\b/i;
const ALPHABET_RE = /alphabet/i;
const MAX_ASSESSMENT_VOCAB = 30;
const norm = (s: string) => s.trim().toLowerCase();

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const level = String(body.level || '').toUpperCase();
	const dialect = String(body.dialect || 'egyptian-arabic');

	if (!hasV2Curriculum(dialect)) {
		return json({ error: `No v2 curriculum for dialect: ${dialect}` }, { status: 400 });
	}
	const curriculum = getCurriculumV2(dialect)!;
	const module = curriculum.find((m) => m.level === level);
	if (!module) {
		return json({ error: `Unknown level: ${level}` }, { status: 400 });
	}

	// The review/assessment unit is the level's review-titled topic.
	const reviewTopic = module.topics.find((t) => REVIEW_RE.test(t.title));
	if (!reviewTopic) {
		return json({ error: `No assessment unit found for ${level}` }, { status: 400 });
	}

	// Content units of this level (exclude the review unit itself and alphabet).
	const contentTopics = module.topics.filter(
		(t) => t.id !== reviewTopic.id && !REVIEW_RE.test(t.title) && !ALPHABET_RE.test(t.title)
	);

	// Harvest vocab + practice sentences + reading passages from the lessons.
	const vocabByEng = new Map<string, VocabItem>();
	const poolByArabic = new Map<string, HarvestedSentence>();
	const passages: { title: string; sentences: SentenceItem[] }[] = [];
	let lessonsFound = 0;

	for (const topic of contentTopics) {
		const lesson = await loadLessonV2(topic.id, dialect);
		if (!lesson) continue;
		lessonsFound++;
		for (const v of lesson.vocab) {
			if (!vocabByEng.has(norm(v.english))) vocabByEng.set(norm(v.english), v);
		}
		for (const step of lesson.steps) {
			if (
				(step.type === 'typing' ||
					step.type === 'reorder' ||
					step.type === 'translate' ||
					step.type === 'speaking') &&
				step.sentence
			) {
				const s = step.sentence;
				if (!poolByArabic.has(s.arabic)) {
					poolByArabic.set(s.arabic, { ...s, targetWords: step.targetWords ?? [] });
				}
			}
			if (step.type === 'reading' && step.sentences?.length) {
				passages.push({ title: step.title, sentences: step.sentences });
			}
		}
	}

	if (lessonsFound === 0 || vocabByEng.size < 4) {
		return json(
			{ error: `Not enough generated lessons for ${level} yet (found ${lessonsFound}).` },
			{ status: 409 }
		);
	}

	const fullVocab = [...vocabByEng.values()];
	const pool = [...poolByArabic.values()];

	// Evenly sample the vocab this assessment will actively test.
	let sampled: VocabItem[];
	if (fullVocab.length <= MAX_ASSESSMENT_VOCAB) {
		sampled = fullVocab;
	} else {
		const stride = fullVocab.length / MAX_ASSESSMENT_VOCAB;
		sampled = Array.from({ length: MAX_ASSESSMENT_VOCAB }, (_, i) => fullVocab[Math.floor(i * stride)]);
	}

	// Live-tutor capstone scenario spanning the level (best-effort).
	let scenario: ScenarioBriefResponse | null = null;
	const apiKey = env.GEMINI_API_KEY;
	if (apiKey) {
		try {
			const ai = new GoogleGenAI({ apiKey });
			const { zodSchema, jsonSchema } = createScenarioBriefSchema();
			const vocabList = sampled
				.slice(0, 20)
				.map((v) => `${v.arabic} (${v.english})`)
				.join(', ');
			const resp = await generateContentWithRetry(ai, {
				model: 'gemini-2.5-flash',
				contents: `Design a short capstone roleplay in ${getDialectName(dialect)} that lets a ${level} learner show off the vocabulary of the whole level.
Vocabulary to draw on: ${vocabList}
Return JSON: { "situation", "studentRole", "otherRole", "goalEnglish", "targetWords" }. targetWords = english glosses (from the list) the student should use.`,
				config: {
					temperature: 0.7,
					maxOutputTokens: 2048,
					thinkingConfig: { thinkingBudget: 0 },
					responseMimeType: 'application/json',
					responseJsonSchema: jsonSchema
				}
			});
			if (resp.text) {
				scenario = parseJsonFromGeminiResponse(resp.text, zodSchema);
				scenario = {
					...scenario,
					targetWords: scenario.targetWords
						.map((w) => fullVocab.find((v) => norm(v.english) === norm(w))?.english)
						.filter((g): g is string => Boolean(g))
				};
			}
		} catch (e) {
			console.warn('[generate-assessment-v2] scenario generation failed, continuing:', e);
		}
	}

	const assessment = assembleAssessmentV2({
		topicId: reviewTopic.id,
		title: reviewTopic.title,
		dialect,
		level,
		vocab: sampled,
		fullVocab,
		pool,
		passages,
		scenario
	});

	const parsed = generatedLessonV2Schema.parse(assessment);
	await saveLessonV2(parsed);

	return json({
		ok: true,
		level,
		topicId: reviewTopic.id,
		lessonsHarvested: lessonsFound,
		vocabTested: sampled.length,
		poolSize: pool.length,
		stepCount: parsed.steps.length
	});
};
