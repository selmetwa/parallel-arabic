#!/usr/bin/env node
/**
 * Batch-generate v2 (heavy-practice, Egyptian) structured lessons for the
 * whole A1–C2 curriculum by driving the /api/generate-lesson-v2 endpoint.
 *
 * Each lesson is ~8 Gemini calls, so this runs SEQUENTIALLY (one lesson at a
 * time) to stay friendly with rate limits, with retries on transient failures
 * and skip-existing so it is safely resumable.
 *
 * Prerequisite: the app must be running (dev or prod) and reachable at --base.
 *
 * Usage:
 *   # start the app first, e.g. `npm run dev` (defaults to localhost:5173)
 *   npm run generate:lessons -- --levels=A1            # one or more levels
 *   npm run generate:lessons -- --all                  # every level A1–C2
 *   npm run generate:lessons -- --only=eg-a1-u02,eg-a1-u05
 *   npm run generate:lessons -- --all --force          # regenerate existing
 *   npm run generate:lessons -- --all --include-review # include review/test units
 *   npm run generate:lessons -- --all --base=http://localhost:5173
 *
 * Flags:
 *   --levels=A1,B1     Comma-separated CEFR levels to generate (default: A1)
 *   --all              Shorthand for --levels=A1,A2,B1,B2,C1,C2
 *   --only=id1,id2     Explicit topic ids (overrides --levels/--all)
 *   --force            Regenerate lessons that already exist in storage
 *   --include-review   Also generate "review / assessment / test" units
 *   --base=URL         App base URL (default: $LESSON_GEN_BASE or localhost:5173)
 *   --retries=N        Retries per lesson on failure (default: 2)
 *   --delay=MS         Delay between lessons in ms (default: 1500)
 *   --dry-run          List what would be generated, then exit
 */

import { getCurriculumV2 } from '../src/lib/data/curriculum-v2';

const args = process.argv.slice(2);
const has = (name: string) => args.includes(`--${name}`);
const opt = (name: string, def = ''): string => {
	const p = args.find((a) => a.startsWith(`--${name}=`));
	return p ? p.slice(name.length + 3) : def;
};

const ALL_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const BASE = (opt('base') || process.env.LESSON_GEN_BASE || 'http://localhost:5173').replace(/\/$/, '');
const DIALECT = opt('dialect') || process.env.LESSON_GEN_DIALECT || 'egyptian-arabic';
const FORCE = has('force');
const INCLUDE_REVIEW = has('include-review');
const INCLUDE_ALPHABET = has('include-alphabet');
const DRY_RUN = has('dry-run');
const RETRIES = parseInt(opt('retries', '3'), 10);
const DELAY = parseInt(opt('delay', '3000'), 10);
const TIMEOUT = parseInt(opt('timeout', '540000'), 10); // 9 min per lesson

const REVIEW_RE = /\b(review|assessment|test)\b/i;
// The alphabet is covered by the app's dedicated alphabet module, so it is not
// generated as a vocab lesson by default.
const ALPHABET_RE = /alphabet/i;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Resolve the ordered list of {id,title,level} topics to generate. */
function resolveTargets(): { id: string; title: string; level: string }[] {
	const only = opt('only')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

	const levels = has('all')
		? ALL_LEVELS
		: (opt('levels', 'A1')
				.split(',')
				.map((s) => s.trim().toUpperCase())
				.filter(Boolean));

	const curriculum = getCurriculumV2(DIALECT);
	if (!curriculum) {
		console.error(`No v2 curriculum for dialect "${DIALECT}". Add one in src/lib/data/curriculum-v2.ts.`);
		process.exit(1);
	}

	const targets: { id: string; title: string; level: string }[] = [];
	for (const module of curriculum) {
		for (const topic of module.topics) {
			if (only.length) {
				if (only.includes(topic.id)) targets.push({ id: topic.id, title: topic.title, level: module.level });
				continue;
			}
			if (!levels.includes(module.level)) continue;
			if (!INCLUDE_REVIEW && REVIEW_RE.test(topic.title)) continue;
			if (!INCLUDE_ALPHABET && ALPHABET_RE.test(topic.title)) continue;
			targets.push({ id: topic.id, title: topic.title, level: module.level });
		}
	}
	return targets;
}

async function lessonExists(topicId: string): Promise<boolean> {
	try {
		const res = await fetch(`${BASE}/api/lessons-v2/${topicId}?dialect=${encodeURIComponent(DIALECT)}`, {
			method: 'GET'
		});
		return res.ok;
	} catch {
		return false;
	}
}

async function generateOne(topicId: string): Promise<{ ok: boolean; info: string }> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT);
	try {
		const res = await fetch(`${BASE}/api/generate-lesson-v2`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ topicId, dialect: DIALECT }),
			signal: controller.signal
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok || !data.ok) {
			return { ok: false, info: data.error || `HTTP ${res.status}` };
		}
		return {
			ok: true,
			info: `${data.stepCount} steps · min recurrence ${data.minRecurrence} · ${data.vocabCount} words`
		};
	} catch (e) {
		return { ok: false, info: e instanceof Error ? e.message : 'request failed' };
	} finally {
		clearTimeout(timeout);
	}
}

async function main() {
	const targets = resolveTargets();
	if (targets.length === 0) {
		console.error('No matching topics. Check --levels / --only / --all.');
		process.exit(1);
	}

	console.log(`\nBatch lesson generator (v2)`);
	console.log(`  base:    ${BASE}`);
	console.log(`  dialect: ${DIALECT}`);
	console.log(`  targets: ${targets.length} lesson(s)`);
	console.log(`  force:   ${FORCE ? 'yes (regenerate existing)' : 'no (skip existing)'}`);
	console.log(`  review:  ${INCLUDE_REVIEW ? 'included' : 'skipped'}\n`);

	if (DRY_RUN) {
		targets.forEach((t, i) => console.log(`  ${String(i + 1).padStart(3)}. [${t.level}] ${t.id}  ${t.title}`));
		console.log(`\nDry run — nothing generated.`);
		return;
	}

	let generated = 0;
	let skipped = 0;
	const failed: { id: string; info: string }[] = [];

	for (let i = 0; i < targets.length; i++) {
		const t = targets[i];
		const tag = `[${i + 1}/${targets.length}] [${t.level}] ${t.id}`;

		if (!FORCE && (await lessonExists(t.id))) {
			console.log(`${tag}  ⏭  exists — skipping (${t.title})`);
			skipped++;
			continue;
		}

		process.stdout.write(`${tag}  ⏳ generating "${t.title}" … `);
		let result = await generateOne(t.id);
		let attempt = 1;
		while (!result.ok && attempt <= RETRIES) {
			process.stdout.write(`retry ${attempt}/${RETRIES} … `);
			await sleep(2000 * attempt);
			result = await generateOne(t.id);
			attempt++;
		}

		if (result.ok) {
			console.log(`✓  ${result.info}`);
			generated++;
		} else {
			console.log(`✗  ${result.info}`);
			failed.push({ id: t.id, info: result.info });
		}

		if (i < targets.length - 1) await sleep(DELAY);
	}

	console.log(`\n────────────────────────────────────────`);
	console.log(`Done. generated: ${generated} · skipped: ${skipped} · failed: ${failed.length}`);
	if (failed.length) {
		console.log(`Failed lessons (re-run to retry):`);
		failed.forEach((f) => console.log(`  ${f.id} — ${f.info}`));
		process.exitCode = 1;
	}
}

main().catch((e) => {
	console.error('Batch generation crashed:', e);
	process.exit(1);
});
