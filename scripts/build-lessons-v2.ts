#!/usr/bin/env node
/**
 * Build v2 structured lessons from hand-written source files, without Gemini.
 *
 * Each source file holds the same building blocks /api/generate-lesson-v2 asks
 * the model for (vocab, practice pool, reading passages, tutor scenario). This
 * runs them through the same deterministic assembler and schema, so the result
 * is identical in shape to a generated lesson.
 *
 *   content/lessons-v2/<dialect>/<topicId>.json   (source, committed)
 *
 * A level's review unit (e.g. base-a1-u21) is { "assessment": true, "scenario": {...} }
 * and is harvested from that level's lessons like /api/generate-assessment-v2.
 *
 * Usage:
 *   npm run build:lessons-v2 -- --dialect=iraqi                 # validate all
 *   npm run build:lessons-v2 -- --dialect=iraqi --only=base-a1-u02
 *   npm run build:lessons-v2 -- --dialect=iraqi --upload        # save to storage
 *
 * Uploading writes {dialect}-v2/{topicId}.json to the structured_lesson bucket,
 * the same path saveLessonV2() uses.
 */
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { baseCurriculumV2A1B2 } from '../src/lib/data/curriculum-base-v2';
import { assembleLessonV2, recurrenceHistogram } from '../src/lib/server/assemble-lesson-v2';
import { assembleAssessmentV2, type HarvestedSentence } from '../src/lib/server/assemble-assessment-v2';
import {
	createLessonVocabSchema,
	createPracticePoolSchema,
	createLessonPassageSchema,
	createScenarioBriefSchema,
	generatedLessonV2Schema,
	type SentenceItem,
	type VocabItem
} from '../src/lib/schemas/lesson-v2-schema';

dotenv.config({ path: '.env.local' });

const args = process.argv.slice(2);
const opt = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? '';
const DIALECT = opt('dialect');
const ONLY = opt('only').split(',').filter(Boolean);
const UPLOAD = args.includes('--upload');

if (!DIALECT) {
	console.error('Pass --dialect=<dialect>');
	process.exit(1);
}

const SOURCE_DIR = join('content', 'lessons-v2', DIALECT);
const norm = (s: string) => s.trim().toLowerCase();
// Same rules as /api/generate-assessment-v2.
const REVIEW_RE = /\b(review|assessment|test)\b/i;
const ALPHABET_RE = /alphabet/i;
const MAX_ASSESSMENT_VOCAB = 30;

/** Every gloss used in a sentence's targetWords must be a lesson vocab gloss. */
function checkGlosses(topicId: string, glosses: string[], used: string[], where: string): string[] {
	const known = new Set(glosses.map(norm));
	return used.filter((g) => !known.has(norm(g))).map((g) => `${topicId}: ${where} uses unknown gloss "${g}"`);
}

/** Each word alignment must match a word of the sentence, in order. */
function checkAlignments(topicId: string, items: { arabic: string; wordAlignments: { arabic: string }[] }[]): string[] {
	const strip = (s: string) => s.replace(/[ً-ْٰ؟?!.,،:"«»]/g, '');
	const problems: string[] = [];
	for (const item of items) {
		const words = item.arabic.split(/\s+/).map(strip).filter(Boolean);
		const aligned = item.wordAlignments.flatMap((a) => a.arabic.split(/\s+/)).map(strip).filter(Boolean);
		if (words.join(' ') !== aligned.join(' ')) {
			problems.push(`${topicId}: alignments don't match "${item.arabic}"`);
		}
	}
	return problems;
}

/** Content uses standard letters only: normalizeArabicText strips چ گ پ ڤ, so typing checks would fail. */
function checkLetters(topicId: string, source: unknown): string[] {
	const found = JSON.stringify(source).match(/[چگپڤ]/g);
	return found ? [`${topicId}: uses ${[...new Set(found)].join(' ')}; write the standard letter instead`] : [];
}

function findTopic(topicId: string) {
	for (const module of baseCurriculumV2A1B2) {
		const topic = module.topics.find((t) => t.id === topicId);
		if (topic) return { module, topic };
	}
	return null;
}

type Lesson = ReturnType<typeof generatedLessonV2Schema.parse>;

function buildLesson(topicId: string, source: any): Lesson {
	const { module, topic } = findTopic(topicId)!;
	const vocab = createLessonVocabSchema().zodSchema.parse({ vocab: source.vocab }).vocab;
	const pool = createPracticePoolSchema().zodSchema.parse({ sentences: source.pool }).sentences;
	const passages = source.passages.map((p: unknown) => createLessonPassageSchema().zodSchema.parse(p));
	const scenario = source.scenario ? createScenarioBriefSchema().zodSchema.parse(source.scenario) : null;

	const glosses = vocab.map((v) => v.english);
	const problems = [
		...checkLetters(topicId, source),
		...pool.flatMap((s, i) => checkGlosses(topicId, glosses, s.targetWords, `pool[${i}]`)),
		...(scenario ? checkGlosses(topicId, glosses, scenario.targetWords, 'scenario') : []),
		...checkAlignments(topicId, [...vocab, ...pool, ...passages.flatMap((p: { sentences: never[] }) => p.sentences)])
	];
	if (problems.length) throw new Error(problems.join('\n  '));

	return generatedLessonV2Schema.parse(
		assembleLessonV2({
			topicId,
			title: topic.title,
			dialect: DIALECT,
			level: module.level,
			objectives: module.objectives,
			vocab,
			pool,
			passages,
			scenario
		})
	);
}

/**
 * A level's review unit, harvested from that level's built lessons exactly as
 * /api/generate-assessment-v2 does; the source file only holds the capstone
 * roleplay brief: { "assessment": true, "scenario": { ... } }.
 */
function buildAssessment(topicId: string, source: any, built: Map<string, Lesson>): Lesson {
	const { module, topic } = findTopic(topicId)!;
	const contentTopics = module.topics.filter((t) => t.id !== topicId && !REVIEW_RE.test(t.title) && !ALPHABET_RE.test(t.title));
	const missing = contentTopics.filter((t) => !built.has(t.id)).map((t) => t.id);
	if (missing.length) throw new Error(`lessons not built yet: ${missing.join(', ')}`);

	const vocabByEng = new Map<string, VocabItem>();
	const poolByArabic = new Map<string, HarvestedSentence>();
	const passages: { title: string; sentences: SentenceItem[] }[] = [];
	for (const t of contentTopics) {
		const lesson = built.get(t.id)!;
		for (const v of lesson.vocab) if (!vocabByEng.has(norm(v.english))) vocabByEng.set(norm(v.english), v);
		for (const step of lesson.steps) {
			if ((step.type === 'typing' || step.type === 'reorder' || step.type === 'translate' || step.type === 'speaking') && step.sentence) {
				if (!poolByArabic.has(step.sentence.arabic)) poolByArabic.set(step.sentence.arabic, { ...step.sentence, targetWords: step.targetWords ?? [] });
			}
			if (step.type === 'reading' && step.sentences?.length) passages.push({ title: step.title, sentences: step.sentences });
		}
	}
	const fullVocab = [...vocabByEng.values()];
	const stride = fullVocab.length / MAX_ASSESSMENT_VOCAB;
	const sampled = fullVocab.length <= MAX_ASSESSMENT_VOCAB
		? fullVocab
		: Array.from({ length: MAX_ASSESSMENT_VOCAB }, (_, i) => fullVocab[Math.floor(i * stride)]);

	const scenario = createScenarioBriefSchema().zodSchema.parse(source.scenario);
	const problems = [...checkLetters(topicId, source), ...checkGlosses(topicId, fullVocab.map((v) => v.english), scenario.targetWords, 'scenario')];
	if (problems.length) throw new Error(problems.join('\n  '));

	return generatedLessonV2Schema.parse(
		assembleAssessmentV2({
			topicId,
			title: topic.title,
			dialect: DIALECT,
			level: module.level,
			vocab: sampled,
			fullVocab,
			pool: [...poolByArabic.values()],
			passages,
			scenario
		})
	);
}

async function main() {
	if (!existsSync(SOURCE_DIR)) {
		console.error(`No source folder ${SOURCE_DIR}`);
		process.exit(1);
	}
	// Every source is built (assessments need the whole level); --only limits what is reported and uploaded.
	const sources = readdirSync(SOURCE_DIR)
		.filter((f) => f.endsWith('.json'))
		.map((f) => ({ topicId: f.replace(/\.json$/, ''), source: JSON.parse(readFileSync(join(SOURCE_DIR, f), 'utf-8')) }))
		.sort((a, b) => Number(Boolean(a.source.assessment)) - Number(Boolean(b.source.assessment)));
	const selected = (id: string) => !ONLY.length || ONLY.includes(id);

	const supabase = UPLOAD
		? createClient(process.env.PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
		: null;

	const built = new Map<string, Lesson>();
	let failed = 0;
	let reported = 0;
	for (const { topicId, source } of sources) {
		const found = findTopic(topicId);
		try {
			if (!found) throw new Error('not in the base A1–B2 curriculum');
			const lesson = source.assessment ? buildAssessment(topicId, source, built) : buildLesson(topicId, source);
			built.set(topicId, lesson);
			if (!selected(topicId)) continue;
			reported++;

			const histogram = recurrenceHistogram(lesson);
			const min = Math.min(...Object.values(histogram));
			console.log(`✓ ${topicId} ${found.topic.title}: ${lesson.vocab.length} words, ${lesson.steps.length} steps, min recurrence ${min}`);

			if (supabase) {
				const { error } = await supabase.storage
					.from('structured_lesson')
					.upload(`${DIALECT}-v2/${topicId}.json`, JSON.stringify(lesson, null, 2), {
						contentType: 'application/json',
						upsert: true
					});
				if (error) throw new Error(`upload failed: ${error.message}`);
				console.log(`  ↑ uploaded ${DIALECT}-v2/${topicId}.json`);
			}
		} catch (e) {
			if (!selected(topicId)) continue;
			reported++;
			console.error(`✗ ${topicId}: ${e instanceof Error ? e.message : e}`);
			failed++;
		}
	}
	console.log(`\n${reported - failed}/${reported} lessons OK`);
	if (failed) process.exit(1);
}

main();
