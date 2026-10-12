/**
 * "The same word in the other dialects", for the word pages.
 *
 * Search Console shows the word pages ranking on page one for lookups like
 * "baba in arabic" and getting almost no clicks, because the results page
 * already answers the question. What it cannot answer is how the other
 * dialects say the same thing, and the word table already holds that: every
 * row is glossed in English, so a gloss shared across dialects is a match.
 *
 * Patches the word files in place rather than rebuilding them, so slugs (and
 * therefore URLs) never move.
 */
import { join } from 'path';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { supabase } from '../../src/lib/supabaseClient';
import { normalise } from './word-corpus';

const DIALECTS = ['egyptian-arabic', 'levantine', 'darija', 'fusha'];

/** How many distinct words to show per dialect. */
const MAX_PER_DIALECT = 2;

interface WordRow {
	dialect: string;
	arabic_word: string | null;
	english_word: string | null;
	transliterated_word: string | null;
}

/** Glosses are matched whole: "to put" must not pick up "to put on". */
function glossKey(english: string | null | undefined): string {
	return (english ?? '').trim().toLowerCase();
}

/**
 * Rows carry their plural in brackets — "مِشْكْلِة (مشاكِل)" — and a few carry
 * slot markers or footnote stars ("كْتير__", "امرأة*"). All noise in a comparison.
 */
function headword(text: string | null | undefined): string {
	return (text ?? '')
		.replace(/\s*[([].*$/, '')
		.replace(/\s*[،,].*$/, '')
		.replace(/[_*]/g, '')
		.trim();
}

/**
 * English glosses with more than one meaning, where matching on the gloss
 * pairs the wrong words: "well" found the Fusha for a water well, "light"
 * mixed the colour, the weight and the lamp. Reviewed by hand against a dry
 * run; a word glossed this way simply gets no comparison.
 */
const AMBIGUOUS_GLOSSES = new Set([
	'light',
	'right',
	'well',
	'dark',
	'straight',
	'field',
	'full',
	'party',
	'parties',
	'hearts',
	'__ enough'
]);

/**
 * Write `otherDialects` into every word file under `wordsRoot`, for the
 * dialects given (default: every dialect that has word files).
 */
export async function addOtherDialects(
	wordsRoot: string,
	{ dryRun = false, only }: { dryRun?: boolean; only?: string[] } = {}
): Promise<void> {
	const rows: WordRow[] = [];
	for (let from = 0; ; from += 1000) {
		const { data, error } = await supabase
			.from('word')
			.select('dialect, arabic_word, english_word, transliterated_word')
			.order('id')
			.range(from, from + 999);
		if (error) throw error;
		if (!data?.length) break;
		rows.push(...(data as WordRow[]));
		if (data.length < 1000) break;
	}
	console.log(`word table: ${rows.length} rows`);

	const byGloss = new Map<string, WordRow[]>();
	for (const row of rows) {
		const key = glossKey(row.english_word);
		if (!key || !headword(row.arabic_word)) continue;
		if (!byGloss.has(key)) byGloss.set(key, []);
		byGloss.get(key)!.push(row);
	}

	for (const pageDialect of only ?? DIALECTS) {
		const dir = join(wordsRoot, pageDialect);
		if (!existsSync(dir)) continue;
		const others = DIALECTS.filter((d) => d !== pageDialect);

		let patched = 0;
		for (const file of readdirSync(dir)) {
			if (!file.endsWith('.json') || file === 'index.json') continue;
			const path = join(dir, file);
			const word = JSON.parse(readFileSync(path, 'utf-8'));

			const gloss = glossKey(word.english);
			const matches = AMBIGUOUS_GLOSSES.has(gloss) ? [] : (byGloss.get(gloss) ?? []);
			const otherDialects = others.flatMap((dialect) => {
				const seen = new Set<string>();
				return matches
					.filter((row) => row.dialect === dialect)
					.filter((row) => {
						const key = normalise(headword(row.arabic_word));
						if (seen.has(key)) return false;
						seen.add(key);
						return true;
					})
					.slice(0, MAX_PER_DIALECT)
					.map((row) => ({
						dialect,
						arabic: headword(row.arabic_word),
						transliteration: headword(row.transliterated_word)
					}));
			});

			if (otherDialects.length) patched++;
			if (dryRun) {
				console.log(
					`${pageDialect.slice(0, 3)} ${word.slug.padEnd(16)} ${word.english.padEnd(28)} ` +
						otherDialects.map((o) => `${o.dialect.slice(0, 3)}:${o.arabic}`).join('  ')
				);
				continue;
			}
			writeFileSync(path, JSON.stringify({ ...word, otherDialects }, null, 2) + '\n');
		}
		console.log(`${pageDialect}: ${patched} word pages have at least one other dialect`);
	}
}
