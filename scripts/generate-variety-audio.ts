#!/usr/bin/env node
/**
 * Record the sample phrases on each variety landing page in that variety's Nur
 * voice, as static mp3s. The first phrase doubles as the onboarding preview.
 * Also records the Levantine comparison clips (/levantine-dialects and its blog
 * post), each in its variety's voice.
 *
 * Writes static/audio/varieties/<variety>-<index>.mp3 and
 * static/audio/levantine/*.mp3. Existing files are kept unless --regenerate.
 *
 * Usage:
 *   npm run generate:variety-audio [-- --regenerate]
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { VARIETIES, getVarietyInfo, nurVoiceFor, type VarietyInfo } from '../src/lib/constants/varieties';
import { levantineClips } from '../src/lib/constants/levantine-compare';
import { VARIETY_LANDING } from '../src/lib/constants/variety-landing';
import { spellForSpeech } from '../src/lib/utils/speech-spelling';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: join(root, '.env.local') });
dotenv.config({ path: join(root, '.env') });

const key = process.env.EESI_API_KEY;
if (!key) throw new Error('Missing EESI_API_KEY');

const regenerate = process.argv.includes('--regenerate');
const outDir = join(root, 'static/audio/varieties');
mkdirSync(outDir, { recursive: true });

async function record(file: string, arabic: string, variety: VarietyInfo, label: string) {
	if (existsSync(file) && !regenerate) return;
	const { voice, language } = nurVoiceFor(variety.dialect, variety);
	const res = await fetch('https://api.eesi.ai/v1/audio/speech', {
		method: 'POST',
		headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: 'nur-v1',
			voice,
			input: spellForSpeech(arabic.replace(/[؟?!]+$/, ''), variety.dialect),
			speed: 0.9,
			...(language && { language })
		})
	});
	if (!res.ok) throw new Error(`${label}: ${res.status} ${await res.text()}`);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, Buffer.from(await res.arrayBuffer()));
	console.log(`✓ ${label} ${arabic}`);
}

for (const variety of VARIETIES) {
	for (const [i, phrase] of VARIETY_LANDING[variety.key].phrases.entries()) {
		await record(join(outDir, `${variety.key}-${i}.mp3`), phrase.arabic, variety, `${variety.key}-${i}`);
	}
}

for (const clip of levantineClips()) {
	await record(join(root, 'static', clip.path), clip.arabic, getVarietyInfo(clip.variety)!, clip.path);
}
