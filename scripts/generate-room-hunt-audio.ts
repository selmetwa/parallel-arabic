#!/usr/bin/env node
/**
 * Record every Room Hunt word and question once, as static mp3s, so the game
 * plays audio for everyone without spending text-to-speech calls.
 *
 * Writes static/games/room-hunt/audio/<dialect>/<id>.mp3 (the word),
 * <id>.q.mp3 (the question) and <scenario>/<line>.mp3 for every scenario
 * (the other person in a second voice, matching their gender). Existing files are kept unless --regenerate, so
 * after a hand fix in vocab.json, delete that word's files and run again.
 *
 * The voice reads each line through spellForSpeech, so Egyptian comes out the
 * way Cairo says it (geneh, 2ahwa), while the game shows the normal spelling.
 *
 * Usage:
 *   npm run generate:room-hunt-audio
 *   npm run generate:room-hunt-audio -- --regenerate
 *   npm run generate:room-hunt-audio -- --regenerate --dialect=egyptian-arabic
 */

import { ElevenLabsClient } from 'elevenlabs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { getVoiceConfig } from '../src/lib/utils/voice-config';
import { spellForSpeech } from '../src/lib/utils/speech-spelling';
import { GAME_DIALECTS } from '../src/lib/games/themes';
import vocab from '../src/lib/games/room-hunt/vocab.json';
import { SCENARIOS } from '../src/lib/games/room-hunt/scenarios/index';
import type { GameDialect } from '../src/lib/games/themes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const OUT = join(__dirname, '..', 'static', 'games', 'room-hunt', 'audio');
const CONCURRENCY = 4;

type Entry = { arabic: string; question?: string };

/**
 * The other person's voice: never the player's, and the same gender as the
 * scenario says (npcGender), which its Arabic agrees with. Only the genders a
 * dialect has a second voice for are listed; the tests keep npcGender to them.
 */
const NPC_VOICE: Record<GameDialect, Partial<Record<'m' | 'f', string>>> = {
	'egyptian-arabic': { m: 'Haytham - Conversation', f: 'Hoda' },
	levantine: { f: 'Sara – The Premium Humanlike Arabic Voice | سارة – الصوت العربي الواقعي الفاخر' },
	darija: { m: 'Jawad - Natural and Conversational' },
	fusha: { m: 'Adam - Warm & Classic' }
};

async function main() {
	const regenerate = process.argv.includes('--regenerate');
	const only = process.argv.find((a) => a.startsWith('--dialect='))?.split('=')[1];
	const apiKey = process.env.ELEVENLABS_API_KEY;
	if (!apiKey) throw new Error('ELEVENLABS_API_KEY is required');
	const client = new ElevenLabsClient({ apiKey });

	const jobs: { file: string; text: string; voice: string; stability: number; similarity: number }[] =
		[];
	for (const dialect of GAME_DIALECTS.filter((d) => !only || d === only)) {
		const dir = join(OUT, dialect);
		mkdirSync(dir, { recursive: true });
		const voice = getVoiceConfig(dialect);
		for (const [id, byDialect] of Object.entries(vocab as Record<string, Record<string, Entry>>)) {
			const entry = byDialect[dialect];
			if (!entry) continue;
			const texts: [string, string | undefined][] = [
				[`${id}.mp3`, entry.arabic],
				[`${id}.q.mp3`, entry.question]
			];
			for (const [name, text] of texts) {
				const file = join(dir, name);
				if (!text || (!regenerate && existsSync(file))) continue;
				jobs.push({
					file,
					// The question mark makes some voices trail off; the endpoint strips it too.
					text: spellForSpeech(text.replace(/[؟?]/g, '').trim(), dialect),
					voice: voice.voice,
					stability: voice.stability,
					similarity: voice.similarity_boost
				});
			}
		}

		for (const { scenario } of SCENARIOS) {
			const npcVoice = NPC_VOICE[dialect][scenario.npcGender[dialect]];
			if (!npcVoice) throw new Error(`${scenario.id}: no ${scenario.npcGender[dialect]} voice for ${dialect}`);
			mkdirSync(join(dir, scenario.id), { recursive: true });
			for (const [id, byDialect] of Object.entries(scenario.text)) {
				const entry = byDialect[dialect];
				const file = join(dir, scenario.id, `${id}.mp3`);
				if (!entry || (!regenerate && existsSync(file))) continue;
				jobs.push({
					file,
					// Keep the question mark here: these are whole sentences, and it shapes the intonation.
					text: spellForSpeech(entry.arabic, dialect),
					voice: scenario.lines[id].speaker === 'npc' ? npcVoice : voice.voice,
					stability: voice.stability,
					similarity: voice.similarity_boost
				});
			}
		}
	}

	console.log(`recording ${jobs.length} clips...`);
	let next = 0;
	let done = 0;
	async function worker() {
		while (next < jobs.length) {
			const job = jobs[next++];
			const stream = await client.generate({
				voice: job.voice,
				model_id: 'eleven_turbo_v2_5',
				text: job.text,
				// Short clips; 32 kbps keeps all 312 of them around 3 MB.
				output_format: 'mp3_22050_32',
				voice_settings: { stability: job.stability, similarity_boost: job.similarity }
			});
			const chunks: Uint8Array[] = [];
			for await (const chunk of stream) chunks.push(chunk);
			writeFileSync(job.file, Buffer.concat(chunks));
			if (++done % 20 === 0) console.log(`  ${done}/${jobs.length}`);
		}
	}
	await Promise.all(Array.from({ length: CONCURRENCY }, worker));
	console.log(`done: ${done} clips in ${OUT}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
