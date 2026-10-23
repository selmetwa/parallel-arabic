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
import {
	createLessonVocabSchema,
	createPracticePoolSchema,
	createLessonPassageSchema,
	createScenarioBriefSchema,
	generatedLessonV2Schema
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

function findTopic(topicId: string) {
	for (const module of baseCurriculumV2A1B2) {
		const topic = module.topics.find((t) => t.id === topicId);
		if (topic) return { module, topic };
	}
	return null;
}

async function main() {
	if (!existsSync(SOURCE_DIR)) {
		console.error(`No source folder ${SOURCE_DIR}`);
		process.exit(1);
	}
	const files = readdirSync(SOURCE_DIR)
		.filter((f) => f.endsWith('.json'))
		.filter((f) => !ONLY.length || ONLY.includes(f.replace(/\.json$/, '')));

	const supabase = UPLOAD
		? createClient(process.env.PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
		: null;

	let failed = 0;
	for (const file of files) {
		const topicId = file.replace(/\.json$/, '');
		const found = findTopic(topicId);
		if (!found) {
			console.error(`✗ ${topicId}: not in the base A1–B2 curriculum`);
			failed++;
			continue;
		}
		const { module, topic } = found;
		const source = JSON.parse(readFileSync(join(SOURCE_DIR, file), 'utf-8'));

		try {
			const vocab = createLessonVocabSchema().zodSchema.parse({ vocab: source.vocab }).vocab;
			const pool = createPracticePoolSchema().zodSchema.parse({ sentences: source.pool }).sentences;
			const passages = source.passages.map((p: unknown) => createLessonPassageSchema().zodSchema.parse(p));
			const scenario = source.scenario ? createScenarioBriefSchema().zodSchema.parse(source.scenario) : null;

			const glosses = vocab.map((v) => v.english);
			const problems = [
				...pool.flatMap((s, i) => checkGlosses(topicId, glosses, s.targetWords, `pool[${i}]`)),
				...(scenario ? checkGlosses(topicId, glosses, scenario.targetWords, 'scenario') : []),
				...checkAlignments(topicId, [...vocab, ...pool, ...passages.flatMap((p: { sentences: never[] }) => p.sentences)])
			];
			if (problems.length) throw new Error(problems.join('\n  '));

			const lesson = generatedLessonV2Schema.parse(
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
			const histogram = recurrenceHistogram(lesson);
			const min = Math.min(...Object.values(histogram));
			console.log(`✓ ${topicId} ${topic.title}: ${vocab.length} words, ${pool.length} sentences, ${lesson.steps.length} steps, min recurrence ${min}`);

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
			console.error(`✗ ${topicId}: ${e instanceof Error ? e.message : e}`);
			failed++;
		}
	}
	console.log(`\n${files.length - failed}/${files.length} lessons OK`);
	if (failed) process.exit(1);
}

main();
