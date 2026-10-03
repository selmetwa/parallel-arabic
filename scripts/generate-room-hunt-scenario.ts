#!/usr/bin/env node
/**
 * Fill src/lib/games/room-hunt/order-lines.json: the "Order a meal"
 * conversation (src/lib/games/room-hunt/order.ts) in each game dialect.
 *
 * The whole conversation goes to Gemini at once, so the lines read as one
 * scene. Lines already in the file are kept, so hand fixes survive a re-run;
 * pass --regenerate to redo them.
 *
 * Usage:
 *   npm run generate:room-hunt-scenario
 *   npm run generate:room-hunt-scenario -- --regenerate
 */

import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { ORDER_LINES, ORDER_TURNS, WAITER } from '../src/lib/games/room-hunt/order';
import { GAME_DIALECTS, type GameDialect } from '../src/lib/games/themes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const OUT = join(__dirname, '..', 'src', 'lib', 'games', 'room-hunt', 'order-lines.json');

const DIALECT_NAMES: Record<GameDialect, string> = {
	'egyptian-arabic': 'Egyptian Arabic (Masri, as spoken in Cairo)',
	levantine: 'Levantine Arabic (Shami, as spoken in Beirut, Damascus and Amman)',
	darija: 'Moroccan Arabic (Darija, as spoken in Casablanca and Rabat)',
	fusha: 'Modern Standard Arabic (Fusha)'
};

type Entry = { arabic: string; transliteration: string };
type Lines = Record<string, Partial<Record<GameDialect, Entry>>>;

// Flat on purpose: nested or bounded schemas trip Gemini's "too many states" error.
const responseSchema = z.object({
	items: z.array(z.object({ id: z.string(), arabic: z.string(), transliteration: z.string() }))
});
const jsonSchema = zodToJsonSchema(responseSchema);

function parseJsonSafe(text: string) {
	return JSON.parse(
		text
			.replace(/^```(?:json)?\n?/i, '')
			.replace(/\n?```$/i, '')
			.trim()
	);
}

function describeScene() {
	return ORDER_TURNS.map((turn) => {
		const options = turn.choices
			.map((c) => `    ${c.line} — "${ORDER_LINES[c.line].english}"${c.ok ? '' : ' (a wrong answer here)'}`)
			.join('\n');
		return `  WAITER ${turn.waiter} — "${ORDER_LINES[turn.waiter].english}"\n  CUSTOMER answers with one of:\n${options}`;
	}).join('\n');
}

async function translate(ai: GoogleGenAI, dialect: GameDialect, ids: string[]) {
	const waiter = WAITER[dialect].gender === 'f' ? 'a woman' : 'a man';
	const prompt = `You are writing a short restaurant scene for an Arabic learning game, in ${DIALECT_NAMES[dialect]}.

The waiter is ${waiter}; the customer is a man eating alone. Write every line the way people really talk in ${DIALECT_NAMES[dialect]} at a casual neighbourhood restaurant: short, natural, polite.${dialect === 'fusha' ? '' : ' Do NOT use Modern Standard Arabic phrasing.'} Use the right gender agreement for who is speaking to whom (the waiter addresses a man; the customer addresses ${waiter === 'a woman' ? 'a woman' : 'a man'}).

Some customer lines are deliberately wrong answers for the moment they appear (the game teaches which reply fits). Translate them faithfully anyway; do not "fix" them.

THE SCENE (line id — English):
${describeScene()}
  WAITER w_coming — "${ORDER_LINES.w_coming.english}" (said when going to get the order)
  WAITER w_sorry — "${ORDER_LINES.w_sorry.english}" (said after a reply that doesn't fit)

For each of these line ids, give:
- arabic: the line in Arabic script WITH full tashkeel.
- transliteration: plain ASCII romanization, the way learners text it. 3 for ع, 7 for ح, 2 for ء, gh for غ, kh for خ, sh for ش. No accents.
Keep the id exactly as given. One item per id.

IDS: ${ids.join(', ')}`;

	const response = await ai.models.generateContent({
		model: 'gemini-3.1-pro-preview',
		contents: `${prompt}

Return a valid JSON object exactly matching this schema:
${JSON.stringify(jsonSchema, null, 2)}

Return PURE JSON only. No markdown code blocks. No explanations.`,
		config: {
			temperature: 0.3,
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

async function main() {
	const regenerate = process.argv.includes('--regenerate');
	const lines: Lines = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf-8')) : {};
	const ids = Object.keys(ORDER_LINES);

	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) throw new Error('GEMINI_API_KEY is required');
	const ai = new GoogleGenAI({ apiKey });

	await Promise.all(
		GAME_DIALECTS.map(async (dialect) => {
			const todo = ids.filter((id) => regenerate || !lines[id]?.[dialect]);
			if (!todo.length) return console.log(`${dialect}: all ${ids.length} lines done`);
			console.log(`${dialect}: writing ${todo.length} lines...`);
			for (const [id, entry] of await translate(ai, dialect, todo)) {
				lines[id] = { ...lines[id], [dialect]: entry };
			}
		})
	);

	const sorted: Lines = {};
	for (const id of ids) {
		sorted[id] = {};
		for (const d of GAME_DIALECTS) if (lines[id]?.[d]) sorted[id][d] = lines[id][d];
	}
	writeFileSync(OUT, JSON.stringify(sorted, null, '\t') + '\n');
	console.log(`wrote ${OUT}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
