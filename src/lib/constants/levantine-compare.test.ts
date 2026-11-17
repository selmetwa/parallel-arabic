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
