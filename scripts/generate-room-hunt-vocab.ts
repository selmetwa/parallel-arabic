#!/usr/bin/env node
/**
 * Fill src/lib/games/room-hunt/vocab.json: the Arabic for every Room Hunt
 * object, in each game dialect.
 *
 * The objects are fixed by the 3D rooms (src/lib/games/room-hunt/rooms.ts), so
 * this runs once and the output is committed. Entries already in vocab.json
 * are kept, so hand fixes survive a re-run; pass --regenerate to redo them.
 *
 * A second pass adds each word's gender and the question the game asks
 * ("Where's the fridge?"), built on the word already in the file so a hand fix
 * carries through to its question.
 *
 * Usage:
 *   npm run generate:room-hunt
 *   npm run generate:room-hunt -- --regenerate
 *   npm run generate:room-hunt -- --dialect=darija
 */

import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { CONCEPTS, usedConcepts } from '../src/lib/games/room-hunt/rooms';
import { GAME_DIALECTS, type GameDialect } from '../src/lib/games/themes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const OUT = join(__dirname, '..', 'src', 'lib', 'games', 'room-hunt', 'vocab.json');

const DIALECT_NAMES: Record<GameDialect, string> = {
	'egyptian-arabic': 'Egyptian Arabic (Masri, as spoken in Cairo)',
	levantine: 'Levantine Arabic (Shami, as spoken in Beirut, Damascus and Amman)',
	darija: 'Moroccan Arabic (Darija, as spoken in Casablanca and Rabat)',
	fusha: 'Modern Standard Arabic (Fusha)'
};

type Entry = {
	arabic: string;
	transliteration: string;
	gender?: 'm' | 'f';
	question?: string;
	questionTransliteration?: string;
};
type Vocab = Record<string, Partial<Record<GameDialect, Entry>>>;

// Flat on purpose: nested or bounded schemas trip Gemini's "too many states" error.
const responseSchema = z.object({
	items: z.array(
		z.object({
			id: z.string(),
			arabic: z.string(),
			transliteration: z.string()
		})
	)
});
const jsonSchema = zodToJsonSchema(responseSchema);

const enrichSchema = z.object({
	items: z.array(
		z.object({
			id: z.string(),
			gender: z.enum(['m', 'f']),
			question: z.string(),
			question_transliteration: z.string()
		})
	)
});
const enrichJsonSchema = zodToJsonSchema(enrichSchema);

function parseJsonSafe(text: string) {
	return JSON.parse(
		text
			.replace(/^```(?:json)?\n?/i, '')
			.replace(/\n?```$/i, '')
			.trim()
	);
}

async function translate(ai: GoogleGenAI, dialect: GameDialect, ids: string[]) {
	const spoken =
		dialect === 'fusha'
			? 'Use the standard Modern Standard Arabic word.'
			: `Use the word people actually say at home in ${DIALECT_NAMES[dialect]}, even when it is a loanword (French, English, Turkish, Italian). Do NOT give the Modern Standard Arabic word unless it is also the everyday spoken one.`;

	const prompt = `You are writing vocabulary for a language-learning game. The learner sees an object in a 3D room (a kitchen, a bathroom or a restaurant) and must recognise its name in ${DIALECT_NAMES[dialect]}.

For each object below, give its name as a single common noun (no article ال unless the word always carries it), the way a native speaker would name it.
${spoken}

- arabic: Arabic script WITH full tashkeel (diacritics).
- transliteration: plain ASCII romanization, the way learners text it. 3 for ع, 7 for ح, 2 for ء, gh for غ, kh for خ, sh for ش. No accents, no special Unicode.
- Keep the id exactly as given. One item per id.

OBJECTS (id — English — what it is):
${ids.map((id) => `${id} — ${CONCEPTS[id].english} — ${CONCEPTS[id].hint}`).join('\n')}`;

	const response = await ai.models.generateContent({
		model: 'gemini-3.1-pro-preview',
		contents: `${prompt}

Return a valid JSON object exactly matching this schema:
${JSON.stringify(jsonSchema, null, 2)}

Return PURE JSON only. No markdown code blocks. No explanations.`,
		config: {
			temperature: 0.2,
			responseMimeType: 'application/json',
			responseJsonSchema: jsonSchema
		}
	});

	const text = response.text;
	if (!text) throw new Error(`${dialect}: no content from Gemini`);
	const { items } = responseSchema.parse(parseJsonSafe(text));

	const byId = new Map<string, Entry>();
	for (const item of items) {
		if (!ids.includes(item.id)) throw new Error(`${dialect}: unexpected id "${item.id}"`);
		if (byId.has(item.id)) throw new Error(`${dialect}: "${item.id}" returned twice`);
		if (!item.arabic.trim() || !item.transliteration.trim()) {
			throw new Error(`${dialect}: "${item.id}" came back empty`);
		}
		byId.set(item.id, { arabic: item.arabic.trim(), transliteration: item.transliteration.trim() });
	}
	const missing = ids.filter((id) => !byId.has(id));
	if (missing.length) throw new Error(`${dialect}: missing ${missing.join(', ')}`);
	return byId;
}

async function enrich(ai: GoogleGenAI, dialect: GameDialect, words: [string, Entry][]) {
	const prompt = `You are writing a language-learning game in ${DIALECT_NAMES[dialect]}. The game asks the learner to find an object in a room with a short spoken question.

For each word below:
- gender: the grammatical gender of the noun, "m" or "f". For a phrase, the gender of its head noun.
- question: "Where is the <word>?" as a native speaker of ${DIALECT_NAMES[dialect]} would naturally ask it, in Arabic script WITH full tashkeel, ending with ؟. Use the dialect's own word for "where" (for example فين in Egyptian, وين in Levantine, فين in Darija, أين in Fusha) and make the word definite the way the dialect does (ال, or the right form for a phrase such as ماكينة ديال القهوة or سلة مهملات). Use the given word; do not swap it for a synonym.
- question_transliteration: the question in plain ASCII romanization, the way learners text it. 3 for ع, 7 for ح, 2 for ء, gh for غ, kh for خ, sh for ش. No accents.
- Keep the id exactly as given. One item per id.

WORDS (id — Arabic — transliteration — English):
${words.map(([id, e]) => `${id} — ${e.arabic} — ${e.transliteration} — ${CONCEPTS[id].english}`).join('\n')}`;

	const response = await ai.models.generateContent({
		model: 'gemini-3.1-pro-preview',
		contents: `${prompt}

Return a valid JSON object exactly matching this schema:
${JSON.stringify(enrichJsonSchema, null, 2)}

Return PURE JSON only. No markdown code blocks. No explanations.`,
		config: {
			temperature: 0.2,
			responseMimeType: 'application/json',
			responseJsonSchema: enrichJsonSchema
		}
	});

	const text = response.text;
	if (!text) throw new Error(`${dialect}: no content from Gemini`);
	const { items } = enrichSchema.parse(parseJsonSafe(text));
	const ids = words.map(([id]) => id);
	const seen = new Set<string>();
	for (const item of items) {
		if (!ids.includes(item.id)) throw new Error(`${dialect}: unexpected id "${item.id}"`);
		if (seen.has(item.id)) throw new Error(`${dialect}: "${item.id}" returned twice`);
		if (!item.question.trim()) throw new Error(`${dialect}: "${item.id}" has no question`);
		seen.add(item.id);
	}
	const missing = ids.filter((id) => !seen.has(id));
	if (missing.length) throw new Error(`${dialect}: missing ${missing.join(', ')}`);
	return items;
}

async function main() {
	const args = process.argv.slice(2);
	const regenerate = args.includes('--regenerate');
	const only = args.find((a) => a.startsWith('--dialect='))?.split('=')[1];
	const dialects = GAME_DIALECTS.filter((d) => !only || d === only);
	if (!dialects.length) throw new Error(`Unknown dialect "${only}"`);

	const vocab: Vocab = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf-8')) : {};
	const concepts = usedConcepts();

	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) throw new Error('GEMINI_API_KEY is required');
	const ai = new GoogleGenAI({ apiKey });

	await Promise.all(
		dialects.map(async (dialect) => {
			const todo = concepts.filter((id) => regenerate || !vocab[id]?.[dialect]);
			if (!todo.length) {
				console.log(`${dialect}: all ${concepts.length} objects done`);
				return;
			}
			console.log(`${dialect}: translating ${todo.length} objects...`);
			const result = await translate(ai, dialect, todo);
			for (const [id, entry] of result) {
				vocab[id] = { ...vocab[id], [dialect]: entry };
			}
		})
	);

	await Promise.all(
		dialects.map(async (dialect) => {
			const todo = concepts
				.filter((id) => regenerate || !vocab[id]?.[dialect]?.question)
				.map((id) => [id, vocab[id]![dialect]!] as [string, Entry]);
			if (!todo.length) return;
			console.log(`${dialect}: adding gender and questions for ${todo.length} words...`);
			for (const item of await enrich(ai, dialect, todo)) {
				const entry = vocab[item.id]![dialect]!;
				entry.gender = item.gender;
				entry.question = item.question.trim();
				entry.questionTransliteration = item.question_transliteration.trim();
			}
		})
	);

	// Stable order: rooms' concept order, dialects in GAME_DIALECTS order.
	const sorted: Vocab = {};
	for (const id of concepts) {
		sorted[id] = {};
		for (const d of GAME_DIALECTS) if (vocab[id]?.[d]) sorted[id][d] = vocab[id][d];
	}
	writeFileSync(OUT, JSON.stringify(sorted, null, '\t') + '\n');
	console.log(`wrote ${OUT}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
