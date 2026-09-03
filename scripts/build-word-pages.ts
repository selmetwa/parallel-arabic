#!/usr/bin/env node
/**
 * Build word pages from the existing story corpus.
 *
 * Search Console shows single-word Arabic lookups (ممطر, اخد, جه, جرى) and
 * "X in egyptian arabic" queries ranking on page one with zero clicks, because
 * the only thing on the site for them is a story that happens to contain the
 * word.
 *
 * Rather than generate definitions with an LLM, this indexes the sentences we
 * already have — every generated story body — and keeps only words that appear
 * in at least MIN_EXAMPLES real sentences. A word without real examples does
 * not get a page, which is the whole point: no thin pages.
 *
 * Usage:
 *   npm run build:words -- --dry-run
 *   npm run build:words
 *   npm run build:words -- --limit=200
 *   npm run build:words -- --refresh-corpus   (re-download story bodies)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, readFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { supabase } from '../src/lib/supabaseClient';
import { commonWords } from '../src/lib/constants/common-words';
import verbIndex from '../src/lib/data/verb-conjugations/egyptian-arabic/index.json';
import {
	buildCorpusIndex,
	exampleMatchesSense,
	glossTokens,
	normalise,
	toSlug,
	type CorpusSentence
} from './lib/word-corpus';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIALECT = 'egyptian-arabic';
const OUT_DIR = join(__dirname, '..', 'src', 'lib', 'data', 'words', DIALECT);
const CORPUS_CACHE = join(__dirname, '..', '.word-corpus-cache.json');

/** A word needs this many real example sentences to earn a page. */
const MIN_EXAMPLES = 2;
/** How many words to build pages for. */
const DEFAULT_LIMIT = 500;

/** Categories that hold function words rather than vocabulary worth a page. */
const EXCLUDED_CATEGORIES = new Set(['most_common']);

/**
 * Prepositions, pronouns and particles. A few of these are duplicated into
 * topical categories with misleading glosses — من filed under numbers as
 * "minus" — so they need excluding by form as well as by category.
 */
const STOPWORDS = new Set(
	[
		'من',
		'في',
		'على',
		'مع',
		'عن',
		'الى',
		'او',
		'ثم',
		'حتى',
		'لكن',
		'يا',
		'ما',
		'مش',
		'بس',
		'اللي',
		'ده',
		'دي',
		'دول',
		'هو',
		'هي',
		'هم',
		'انت',
		'انتي',
		'انا',
		'احنا',
		'انتو',
		'لا',
		'ولا',
		'ان',
		'الله',
		'ربنا',
		'حد',
		'ايه',
		'ازاي',
		'ليه',
		'فين',
		'امتى',
		'كده',
		'اي',
		'كل',
		'زي',
		'عشان',
		'علشان',
		'برضه',
		'بردو',
		'قوي',
		'خالص',
		'يعني',
		'طبعا',
		'اه',
		'ايوه'
	].map((w) =>
		w
			.replace(/[أإآٱ]/g, 'ا')
			.replace(/ى/g, 'ي')
			.replace(/ة/g, 'ه')
	)
);

/**
 * Audio hosts we don't own. The word table's `audio_url` column is mostly
 * hotlinks to a third-party publisher, served over plain http — which browsers
 * block as mixed content on our https pages, so the audio button silently does
 * nothing. Dropping the URL lets InlineAudioButton fall back to our own TTS,
 * which actually plays.
 */
const FOREIGN_AUDIO_HOSTS = ['lingualism.com'];

function ownAudioUrl(url: string | null | undefined): string | null {
	if (!url) return null;
	if (url.startsWith('http://')) return null;
	if (FOREIGN_AUDIO_HOSTS.some((host) => url.includes(host))) return null;
	return url;
}

async function loadCorpus(refresh: boolean): Promise<CorpusSentence[]> {
	if (!refresh && existsSync(CORPUS_CACHE)) {
		const cached = JSON.parse(readFileSync(CORPUS_CACHE, 'utf-8')) as CorpusSentence[];
		console.log(`corpus: ${cached.length} sentences (cached)`);
		return cached;
	}

	const rows: { id: string; story_body: string }[] = [];
	for (let from = 0; ; from += 1000) {
		const { data, error } = await supabase
			.from('generated_story')
			.select('id, story_body')
			.eq('dialect', DIALECT)
			.range(from, from + 999);
		if (error) throw error;
		if (!data?.length) break;
		rows.push(...(data as typeof rows));
		if (data.length < 1000) break;
	}

	console.log(`downloading ${rows.length} story bodies...`);
	const sentences: CorpusSentence[] = [];
	let done = 0;

	for (const row of rows) {
		try {
			const { data, error } = await supabase.storage
				.from('generated_story')
				.download(row.story_body);
			if (error || !data) continue;

			const body = JSON.parse(await data.text());
			const title = body?.title?.english ?? '';
			for (const sentence of body?.sentences ?? []) {
				const arabic = sentence?.arabic?.text ?? sentence?.arabic;
				const english = sentence?.english?.text ?? sentence?.english;
				const translit = sentence?.transliteration?.text ?? sentence?.transliteration ?? '';
				if (typeof arabic !== 'string' || typeof english !== 'string') continue;
				if (!arabic.trim() || !english.trim()) continue;
				sentences.push({
					arabic: arabic.trim(),
					english: english.trim(),
					transliteration: typeof translit === 'string' ? translit.trim() : '',
					storyId: row.id,
					storyTitle: title
				});
			}
		} catch {
			// A story that fails to parse just contributes nothing.
		}
		if (++done % 100 === 0) console.log(`  ${done}/${rows.length}`);
	}

	writeFileSync(CORPUS_CACHE, JSON.stringify(sentences));
	console.log(`corpus: ${sentences.length} sentences from ${rows.length} stories`);
	return sentences;
}

async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const refresh = args.includes('--refresh-corpus');
	const limit = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? DEFAULT_LIMIT);

	const corpus = await loadCorpus(refresh);

	const byWord = buildCorpusIndex(corpus);
	console.log(`indexed ${byWord.size} distinct word forms`);

	// Candidates come from the curated word table, not raw corpus frequency.
	// The most frequent words in any Arabic text are particles and pronouns —
	// من, في, بس — and nobody searches for those. The word table is the
	// vocabulary the app actually teaches, and every row carries a topic
	// category, which keeps function words and proper nouns out by construction.
	interface WordRow {
		arabic_word: string;
		english_word: string;
		transliterated_word: string | null;
		category: string | null;
		audio_url: string | null;
	}

	const wordRows: WordRow[] = [];
	for (let from = 0; ; from += 1000) {
		const { data, error } = await supabase
			.from('word')
			.select('arabic_word, english_word, transliterated_word, category, audio_url')
			.eq('dialect', DIALECT)
			.range(from, from + 999);
		if (error) throw error;
		if (!data?.length) break;
		wordRows.push(...(data as WordRow[]));
		if (data.length < 1000) break;
	}
	console.log(`word table: ${wordRows.length} ${DIALECT} entries`);

	// Story text is stored without diacritics, so a headword can only be matched
	// against it by its consonant skeleton. That means غيّر ("to change") and
	// غير ("other than") are indistinguishable, and picking examples for one
	// would illustrate the other. Any skeleton claimed by two different senses is
	// therefore dropped rather than guessed at.
	const bySkeleton = new Map<string, WordRow[]>();
	for (const row of wordRows) {
		if (!row.category) continue;
		// "most_common" is where the particles and pronouns live — من, في, بس, ده.
		// They dominate any frequency count and nobody searches for them.
		if (EXCLUDED_CATEGORIES.has(row.category)) continue;
		const key = normalise(row.arabic_word ?? '');
		if (!key || key.length < 2 || STOPWORDS.has(key)) continue;
		if (!bySkeleton.has(key)) bySkeleton.set(key, []);
		bySkeleton.get(key)!.push(row);
	}

	const wordTable = new Map<string, WordRow>();
	let skippedAmbiguous = 0;
	for (const [key, rows] of bySkeleton) {
		const senses = new Set(rows.map((r) => (r.english_word ?? '').trim().toLowerCase()));
		if (senses.size > 1) {
			skippedAmbiguous++;
			continue;
		}
		wordTable.set(key, rows[0]);
	}
	console.log(`${wordTable.size} unambiguous headwords; ${skippedAmbiguous} skipped as ambiguous`);

	// Franco spellings, where the frequency list has one for the same word.
	const francoByWord = new Map<string, string>();
	const occurrencesByWord = new Map<string, number>();
	for (const word of commonWords) {
		const key = normalise(word.word);
		if (!francoByWord.has(key)) francoByWord.set(key, word.franco ?? '');
		occurrencesByWord.set(key, Math.max(occurrencesByWord.get(key) ?? 0, word.appeared ?? 0));
	}

	const verbBySlugSource = new Map<string, string>();
	for (const verb of verbIndex.verbs) {
		verbBySlugSource.set(normalise(verb.arabic), verb.slug);
	}

	// Rank the curated vocabulary by how well the corpus can illustrate it.
	let skippedThin = 0;
	const scored = [];

	let skippedOffSense = 0;

	for (const [key, row] of wordTable) {
		const tokens = glossTokens(row.english_word ?? '');
		const candidateExamples = (byWord.get(key) ?? [])
			// One example per story, so a page is never five lines of the same text.
			.filter((s, i, all) => all.findIndex((o) => o.storyId === s.storyId) === i);

		const examples = candidateExamples
			.filter((s) => exampleMatchesSense(s.english, tokens))
			.slice(0, 6);

		if (examples.length < MIN_EXAMPLES) {
			if (candidateExamples.length >= MIN_EXAMPLES) skippedOffSense++;
			else skippedThin++;
			continue;
		}
		scored.push({ key, row, examples });
	}
	console.log(`${skippedOffSense} skipped: examples did not illustrate the gloss`);

	scored.sort(
		(a, b) =>
			b.examples.length - a.examples.length ||
			(occurrencesByWord.get(b.key) ?? 0) - (occurrencesByWord.get(a.key) ?? 0)
	);

	const candidates = scored.slice(0, limit);
	const taken = new Set<string>();
	const built: { slug: string; arabic: string; english: string; examples: number }[] = [];

	for (const [rank, { key, row, examples }] of candidates.entries()) {
		const franco = francoByWord.get(key) ?? '';
		const tableRow = row;
		const word = {
			word: row.arabic_word,
			en: row.english_word,
			franco,
			appeared: occurrencesByWord.get(key) ?? null
		};
		const slug = toSlug(franco || (row.transliterated_word ?? ''), row.arabic_word, taken);

		built.push({ slug, arabic: word.word, english: word.en, examples: examples.length });

		if (dryRun) continue;

		if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
		writeFileSync(
			join(OUT_DIR, `${slug}.json`),
			JSON.stringify(
				{
					slug,
					dialect: DIALECT,
					arabic: word.word,
					english: word.en,
					franco: word.franco ?? '',
					transliteration: tableRow?.transliterated_word ?? word.franco ?? '',
					category: tableRow?.category ?? null,
					audioUrl: ownAudioUrl(tableRow?.audio_url),
					frequencyRank: rank + 1,
					occurrences: word.appeared ?? null,
					conjugationSlug: verbBySlugSource.get(key) ?? null,
					examples
				},
				null,
				2
			) + '\n'
		);
	}

	console.log(
		`\n${built.length} words have >= ${MIN_EXAMPLES} real examples; ` +
			`${skippedThin} skipped as too thin, ${skippedAmbiguous} as ambiguous`
	);

	if (dryRun) {
		for (const w of built.slice(0, 20)) {
			console.log(`  ${w.slug.padEnd(16)} ${w.arabic.padEnd(12)} ${w.english} (${w.examples} ex)`);
		}
		return;
	}

	// Drop stale files from earlier runs so the index never lies.
	const wanted = new Set(built.map((w) => `${w.slug}.json`));
	for (const file of readdirSync(OUT_DIR)) {
		if (file !== 'index.json' && !wanted.has(file)) rmSync(join(OUT_DIR, file));
	}

	writeFileSync(
		join(OUT_DIR, 'index.json'),
		JSON.stringify(
			{
				dialect: DIALECT,
				generatedAt: new Date().toISOString(),
				words: built.map((w) => ({ slug: w.slug, arabic: w.arabic, english: w.english }))
			},
			null,
			2
		) + '\n'
	);
	console.log(`wrote ${built.length} files to ${OUT_DIR}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
