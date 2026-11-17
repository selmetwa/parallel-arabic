import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { COMPARE_SENTENCES, COMPARE_WORDS, LEVANTINE_VARIETIES, levantineClips } from './levantine-compare';
import { VARIETIES } from './varieties';
import { VARIETY_LANDING } from './variety-landing';

const staticFile = (path: string) => join(process.cwd(), 'static', path);

describe('Levantine comparison audio', () => {
	it('has a recording for every clip the pages play', () => {
		const missing = levantineClips()
			.map((c) => c.path)
			.filter((p) => !existsSync(staticFile(p)));
		expect(missing).toEqual([]);
	});

	it('has a recording for every variety landing phrase', () => {
		const missing = VARIETIES.flatMap((v) =>
			VARIETY_LANDING[v.key].phrases.map((_, i) => `/audio/varieties/${v.key}-${i}.mp3`)
		).filter((p) => !existsSync(staticFile(p)));
		expect(missing).toEqual([]);
	});

	it('gives every sentence and word a form in all four varieties', () => {
		for (const item of [...COMPARE_SENTENCES, ...COMPARE_WORDS]) {
			for (const v of LEVANTINE_VARIETIES) expect(item.forms[v].arabic).toMatch(/[؀-ۿ]/);
		}
	});
});

describe('Arabic dialects comparison audio', async () => {
	const { DIALECT_SENTENCES, DIALECT_WORDS, UNIVERSAL_WORDS, UNIVERSAL_VOICE, COMPARED_DIALECTS } = await import(
		'./dialect-compare'
	);
	const { canSpeak } = await import('$lib/games/game-audio');

	it('gives every sentence and word a form /api/game-audio can speak, in every dialect', () => {
		for (const item of [...DIALECT_SENTENCES, ...DIALECT_WORDS]) {
			for (const d of COMPARED_DIALECTS) {
				expect(item.forms[d].arabic).toMatch(/[\u0600-\u06FF]/);
				expect(canSpeak(item.forms[d].arabic, d)).toBe(true);
			}
		}
		for (const w of UNIVERSAL_WORDS) expect(canSpeak(w.arabic, UNIVERSAL_VOICE)).toBe(true);
	});
});
