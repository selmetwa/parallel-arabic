#!/usr/bin/env node
/**
 * Generate the cumulative end-of-level ASSESSMENTS (v2) for A1–C2 by driving
 * /api/generate-assessment-v2. Each assessment harvests the vocabulary and
 * practice sentences from that level's already-generated lessons, so a level
 * must be generated first (returns 409 otherwise — just re-run later).
 *
 * Prerequisite: the app must be running and reachable at --base.
 *
 * Usage:
 *   npm run generate:assessments                 # all levels A1–C2
 *   npm run generate:assessments -- --levels=A1,A2
 *   npm run generate:assessments -- --base=http://localhost:5173
 */

const args = process.argv.slice(2);
const opt = (name: string, def = ''): string => {
	const p = args.find((a) => a.startsWith(`--${name}=`));
	return p ? p.slice(name.length + 3) : def;
};

const ALL_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const BASE = (opt('base') || process.env.LESSON_GEN_BASE || 'http://localhost:5173').replace(/\/$/, '');
const DIALECT = opt('dialect') || process.env.LESSON_GEN_DIALECT || 'egyptian-arabic';
const levels = (opt('levels') ? opt('levels').split(',') : ALL_LEVELS).map((s) => s.trim().toUpperCase());

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function run() {
	console.log(`\nAssessment generator (v2) · base ${BASE} · dialect ${DIALECT}\n  levels: ${levels.join(', ')}\n`);
	let ok = 0;
	const problems: string[] = [];

	for (const level of levels) {
		process.stdout.write(`[${level}]  ⏳ generating assessment … `);
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 180_000);
			const res = await fetch(`${BASE}/api/generate-assessment-v2`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ level, dialect: DIALECT }),
				signal: controller.signal
			});
			clearTimeout(timeout);
			const data = await res.json().catch(() => ({}));
			if (res.ok && data.ok) {
				console.log(`✓  ${data.topicId} · ${data.stepCount} steps · ${data.vocabTested} words tested · from ${data.lessonsHarvested} lessons`);
				ok++;
			} else {
				console.log(`✗  ${data.error || `HTTP ${res.status}`}`);
				problems.push(`${level}: ${data.error || res.status}`);
			}
		} catch (e) {
			console.log(`✗  ${e instanceof Error ? e.message : 'failed'}`);
			problems.push(`${level}: request failed`);
		}
		await sleep(1000);
	}

	console.log(`\nDone. assessments generated: ${ok}/${levels.length}`);
	if (problems.length) {
		console.log('Not generated (level likely not finished yet — re-run later):');
		problems.forEach((p) => console.log(`  ${p}`));
		process.exitCode = ok > 0 ? 0 : 1;
	}
}

run().catch((e) => {
	console.error('Assessment generation crashed:', e);
	process.exit(1);
});
