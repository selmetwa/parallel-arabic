import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const DIR = 'src/lib/data/verb-conjugations';
const DIALECTS = ['egyptian-arabic', 'levantine', 'darija', 'fusha'];
const PERSONS = ['ana', 'enta', 'enti', 'howa', 'heya', 'ehna', 'entu', 'homma'];
const TENSES = ['past', 'present', 'future'];
const NEW_DIALECTS = ['levantine', 'darija', 'fusha'];

function verbs(dialect: string) {
	return readdirSync(join(DIR, dialect))
		.filter((f) => f.endsWith('.json') && f !== 'index.json')
		.map((f) => JSON.parse(readFileSync(join(DIR, dialect, f), 'utf8')));
}

describe.each(DIALECTS)('%s conjugations', (dialect) => {
	const all = verbs(dialect);

	it('has the same 72 verbs as Egyptian', () => {
		expect(all).toHaveLength(72);
		const slugs = new Set(verbs('egyptian-arabic').map((v) => v.slug));
		for (const v of all) expect(slugs.has(v.slug), v.slug).toBe(true);
	});

	it('fills every tense, polarity and person', () => {
		for (const v of all) {
			for (const t of TENSES) {
				for (const pol of ['affirmative', 'negative']) {
					const forms = v.conjugations[t][pol];
					expect(forms.map((f: { person: string }) => f.person), `${v.slug} ${t} ${pol}`).toEqual(
						PERSONS
					);
					for (const f of forms) {
						expect(f.arabic && f.transliteration && f.english, `${v.slug} ${t} ${pol}`).toBeTruthy();
					}
				}
			}
		}
	});
});

describe.each(NEW_DIALECTS)('%s writing rules', (dialect) => {
	const all = verbs(dialect);
	const forms = all.flatMap((v) =>
		TENSES.flatMap((t) =>
			['affirmative', 'negative'].flatMap((pol) =>
				v.conjugations[t][pol].map((f: Record<string, string>) => ({ ...f, slug: v.slug }))
			)
		)
	);

	it('writes the Arabic in Arabic script only', () => {
		for (const f of forms) {
			expect(f.arabic, `${f.slug} ${f.person}`).toMatch(/^[؀-ۿ ]+$/);
		}
	});

	it('transliterates with 3/7/2 and plain letters, no accents', () => {
		for (const f of forms) {
			expect(f.transliteration, `${f.slug} ${f.person}`).toMatch(/^[a-z0-9 ]+$/);
		}
	});

	it('lists every verb in the index', () => {
		const index = JSON.parse(readFileSync(join(DIR, dialect, 'index.json'), 'utf8'));
		expect(index.dialect).toBe(dialect);
		expect(index.verbs).toHaveLength(72);
	});
});
