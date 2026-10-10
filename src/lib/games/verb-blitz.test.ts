import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { OPTIONS, QUESTIONS_PER_ROUND, buildRound, type VerbFile } from './verb-blitz';
import { GAME_DIALECTS } from './themes';
import { stripArabicDiacritics } from '$lib/utils/arabic-normalization';

function verbs(dialect: string): VerbFile[] {
	const dir = join('src/lib/data/verb-conjugations', dialect);
	return readdirSync(dir)
		.filter((f) => f.endsWith('.json') && f !== 'index.json')
		.map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}

describe.each(GAME_DIALECTS)('buildRound (%s)', (dialect) => {
	const all = verbs(dialect);

	it('builds ten questions with four options that look different', () => {
		for (let run = 0; run < 10; run++) {
			const round = buildRound(all, dialect, 'mixed');
			expect(round).toHaveLength(QUESTIONS_PER_ROUND);
			for (const q of round) {
				expect(q.options).toHaveLength(OPTIONS);
				const shown = q.options.map((o) =>
					dialect === 'fusha' ? o.arabic : stripArabicDiacritics(o.arabic)
				);
				expect(new Set(shown).size).toBe(OPTIONS);
			}
		}
	});

	it('asks only the chosen tense', () => {
		expect(buildRound(all, dialect, 'future').every((q) => q.tense === 'future')).toBe(true);
	});

	it('puts the right form at the answer index', () => {
		for (const q of buildRound(all, dialect, 'past')) {
			const verb = all.find((v) => v.arabic === q.verb.arabic)!;
			const form = verb.conjugations.past[q.negative ? 'negative' : 'affirmative'].find(
				(f) => f.person === q.person
			)!;
			expect(q.options[q.answer].arabic).toBe(form.arabic);
		}
	});
});
