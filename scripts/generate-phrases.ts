#!/usr/bin/env node
/**
 * Generate phrasebook data using Gemini.
 *
 * Search Console shows queries like "hello in levantine arabic",
 * "how are you in levantine arabic" and "happy birthday in egyptian arabic"
 * ranking on page one with zero clicks, because nothing on the site answers
 * them. This builds a page per phrase per dialect to do that.
 *
 * Output is one file per phrase:
 *   src/lib/data/phrases/<dialect>/<slug>.json
 *
 * There is no index file — src/lib/data/phrases/manifest.ts globs these
 * directly, so an interrupted run leaves a correct partial phrasebook rather
 * than a stale index.
 *
 * Usage:
 *   npm run generate:phrases -- --dry-run
 *   npm run generate:phrases -- --dialect=levantine
 *   npm run generate:phrases -- --dialect=levantine --phrase=hello
 *   npm run generate:phrases -- --all
 *   npm run generate:phrases -- --all --force   (regenerate existing files)
 */

import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { PHRASE_SEEDS, PHRASE_DIALECTS } from '../src/lib/constants/phrase-seeds.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
	console.error('❌ GEMINI_API_KEY is required');
	process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const DATA_DIR = join(__dirname, '..', 'src', 'lib', 'data', 'phrases');

const DIALECT_LABELS: Record<string, string> = {
	'egyptian-arabic': 'Egyptian Arabic (Masri, as spoken in Cairo)',
	levantine: 'Levantine Arabic (Shami — Syrian, Lebanese, Jordanian, Palestinian)',
	darija: 'Moroccan Darija',
	fusha: 'Modern Standard Arabic (Fusha)'
};

// Kept deliberately flat. Deeply nested schemas with tight bounds get
// rejected by the API, so arrays are only loosely constrained here and
// checked after parsing instead.
const phraseSchema = z.object({
	arabic: z.string(),
	arabicPlain: z.string(),
	transliteration: z.string(),
	franco: z.string(),
	literal: z.string(),
	usage: z.string(),
	variants: z.array(
		z.object({
			label: z.string(),
			arabic: z.string(),
			transliteration: z.string(),
			english: z.string(),
			note: z.string()
		})
	),
	responses: z.array(
		z.object({ arabic: z.string(), transliteration: z.string(), english: z.string() })
	),
	examples: z.array(
		z.object({ arabic: z.string(), transliteration: z.string(), english: z.string() })
	)
});

const jsonSchema = zodToJsonSchema(phraseSchema);

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonSafe(text: string) {
	const clean = text
		.replace(/^```(?:json)?\n?/i, '')
		.replace(/\n?```$/i, '')
		.trim();
	return JSON.parse(clean);
}

async function generatePhrase(dialect: string, english: string, context?: string) {
	const label = DIALECT_LABELS[dialect];

	const prompt = `You are writing a phrasebook entry for learners of ${label}.

Phrase to cover: "${english}"${context ? `\nWhat is meant: ${context}` : ''}

Give the way a native speaker actually says this in ${label} — not a Modern
Standard Arabic translation dressed up as dialect${
		dialect === 'fusha' ? ' (here MSA IS the target, so use proper Fusha)' : ''
	}.

FIELDS:
- arabic: the phrase in Arabic script WITH full tashkeel (diacritics).
- arabicPlain: the same phrase with no diacritics — how people actually type it.
- transliteration: plain ASCII romanization. Use 3 for ع, 7 for ح, gh for غ,
  kh for خ, sh for ش. No accents, no special Unicode characters.
- franco: the chat-alphabet spelling people use in messages (often the same as
  transliteration, but use the numeral-heavy form people really type).
- literal: the word-for-word gloss, e.g. "feast birthday happy". If the phrase
  is not idiomatic, say so plainly.
- usage: 2-3 sentences on when this is used, how formal it is, who says it to
  whom, and any regional variation inside ${label}. Be concrete and specific.
  Do not pad. Do not say "in Arabic culture".
- variants: 3-5 entries covering the forms a learner needs — addressing a man
  vs a woman vs a group, formal vs casual, and any common alternative wording.
  "label" is a short English tag like "to a man" or "more formal". "note" is
  one short sentence saying when to pick this one over the others.
- responses: 2-3 things a native speaker typically says back.
- examples: 3 full sentences using the phrase in a realistic situation.

Every Arabic field must be in Arabic script. Every transliteration must be
plain ASCII by the rules above. English must read naturally.`;

	const fullPrompt = `${prompt}

Return a valid JSON object exactly matching this schema:
${JSON.stringify(jsonSchema, null, 2)}

Return PURE JSON only. No markdown code blocks. No explanations.`;

	const response = await ai.models.generateContent({
		model: 'gemini-3.1-pro-preview',
		contents: fullPrompt,
		config: {
			temperature: 0.3,
			responseMimeType: 'application/json',
			responseJsonSchema: jsonSchema
		}
	});

	const text = response.text;
	if (!text) throw new Error('No content from Gemini');

	const parsed = phraseSchema.parse(parseJsonSafe(text));

	if (!parsed.variants.length || !parsed.examples.length) {
		throw new Error('Model returned no variants or examples');
	}
	return parsed;
}

async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const force = args.includes('--force');
	const dialectArg = args.find((a) => a.startsWith('--dialect='))?.split('=')[1];
	const phraseArg = args.find((a) => a.startsWith('--phrase='))?.split('=')[1];

	const dialects = dialectArg ? [dialectArg] : [...PHRASE_DIALECTS];
	const seeds = phraseArg ? PHRASE_SEEDS.filter((s) => s.slug === phraseArg) : PHRASE_SEEDS;

	if (!seeds.length) {
		console.error(`❌ No phrase matching --phrase=${phraseArg}`);
		process.exit(1);
	}
	for (const d of dialects) {
		if (!DIALECT_LABELS[d]) {
			console.error(`❌ Unknown dialect "${d}". Expected one of: ${PHRASE_DIALECTS.join(', ')}`);
			process.exit(1);
		}
	}

	console.log(`${dialects.length} dialect(s) x ${seeds.length} phrase(s)`);
	if (dryRun) {
		let pending = 0;
		for (const d of dialects) {
			for (const seed of seeds) {
				// Match what a real run does: existing files are skipped unless --force.
				if (existsSync(join(DATA_DIR, d, `${seed.slug}.json`)) && !force) continue;
				console.log(`  would generate ${d}/${seed.slug}`);
				pending++;
			}
		}
		console.log(
			`${pending} to generate${force ? '' : ' (existing files skipped; use --force to redo)'}`
		);
		return;
	}

	let written = 0;
	let skipped = 0;
	const failed: string[] = [];

	for (const dialect of dialects) {
		const dir = join(DATA_DIR, dialect);
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

		for (const seed of seeds) {
			const file = join(dir, `${seed.slug}.json`);
			if (existsSync(file) && !force) {
				skipped++;
				continue;
			}

			try {
				process.stdout.write(`  ${dialect}/${seed.slug} ... `);
				const generated = await generatePhrase(dialect, seed.english, seed.context);
				writeFileSync(
					file,
					JSON.stringify(
						{ slug: seed.slug, dialect, english: seed.english, ...generated },
						null,
						2
					) + '\n'
				);
				written++;
				console.log('ok');
			} catch (error) {
				console.log(`FAILED: ${(error as Error).message}`);
				failed.push(`${dialect}/${seed.slug}`);
			}
			await sleep(1200);
		}
	}

	console.log(
		`\nwritten: ${written}  skipped (already exist): ${skipped}  failed: ${failed.length}`
	);
	if (failed.length) console.log(`failed: ${failed.join(', ')}`);
	console.log('\nReview the generated Arabic before shipping — this is model output.');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
