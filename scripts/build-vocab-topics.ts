#!/usr/bin/env node
/**
 * Build Egyptian Arabic vocabulary topic pages from the frequency list.
 *
 * Search Console shows demand for "egyptian arabic vocabulary", "egyptian
 * arabic numbers", "egyptian arabic verbs" and friends. The site has 21k words
 * in Supabase, but only `src/lib/constants/common-words.ts` — the open
 * klam-masry frequency list — is ours to publish; the rest is a third-party
 * vocabulary corpus that stays behind the paywall. See
 * docs/egyptian-arabic-intent-pages-plan.md.
 *
 * That list is frequency-ranked but has no topics, and its head is function
 * words (من, في, يا, مش), so this does two things: asks Gemini to sort each
 * entry into a fixed topic and part of speech, and attaches real example
 * sentences from the story corpus. A word with no real example does not make a
 * page — same gate as build-word-pages.ts.
 *
 * Usage:
 *   npm run build:vocab -- --dry-run
 *   npm run build:vocab -- --limit=300
 *   npm run build:vocab
 *   npm run build:vocab -- --classify   (re-run Gemini; otherwise cached)
 */

import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { commonWords } from '../src/lib/constants/common-words';
import {
	buildCorpusIndex,
	findExamples,
	normalise,
	readCorpusCache,
	toSlug
} from './lib/word-corpus';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const ROOT = join(__dirname, '..');
const DIALECT = 'egyptian-arabic';
const OUT_DIR = join(ROOT, 'src', 'lib', 'data', 'vocab', DIALECT);
const CORPUS_CACHE = join(ROOT, '.word-corpus-cache.json');
/** Gemini output is cached so re-runs are free and reproducible. */
const CLASSIFY_CACHE = join(ROOT, '.vocab-classification-cache.json');

/**
 * Topics written by hand, not derived from the frequency list.
 *
 * "Egyptian Arabic numbers" wants 1-20, the tens and the ordinals as a
 * systematic table, and a frequency list will never produce that — it has
 * واحد and اتنين and then nothing until عشرين. Colors are the same story: the
 * source corpus is song lyrics and social media, which yields four colour words
 * where the query wants twenty. These files are owned by a human; the script
 * neither overwrites nor prunes them.
 */
const HAND_AUTHORED = new Set(['numbers', 'colors']);

/** A topic needs this many usable words before it earns a page. */
const MIN_WORDS_PER_TOPIC = 20;
/**
 * The most-common list is the one page that would otherwise take every word.
 *
 * Each table row costs ~680 bytes of HTML, so a thousand-word list is a ~900 KB
 * page before the data payload. 500 keeps it around 400 KB, which is heavy but
 * defensible for a reference list, and it is still an honest page title. Worth
 * revisiting once there is real Search Console data on it.
 */
const MOST_COMMON_LIMIT = 500;

/**
 * Example sentences are a bonus on a topic page, not a requirement.
 *
 * build-word-pages.ts demands two, because a page about a single word with no
 * context is thin by definition. A topic page is a sixty-row table of Arabic,
 * transliteration, franco and English — that table is the content, and the
 * showcase at the top only needs a handful of illustrated words. Requiring an
 * example per word cost us food-and-drink, colors, animals and the body
 * entirely, which are exactly the lists people search for.
 */
const MIN_EXAMPLES = 0;
const BATCH_SIZE = 30;
/**
 * Batches in flight at once. The whole list is ~80 batches and the model takes
 * several seconds per call, so serial classification is an hour of waiting for
 * no reason. Kept modest to stay well inside the API's rate limit.
 */
const CONCURRENCY = 6;

/**
 * Fixed topic list, chosen to match how people search ("egyptian arabic
 * numbers", "... colors", "... food") rather than to describe the corpus.
 * `function-word` and `other` are escape hatches, not pages.
 */
const TOPICS = [
	'numbers',
	'food-and-drink',
	'family',
	'colors',
	'time-and-dates',
	'the-body',
	'clothes',
	'the-home',
	'travel-and-directions',
	'work-and-money',
	'school-and-learning',
	'weather-and-nature',
	'animals',
	'feelings',
	'greetings-and-manners',
	'people-and-describing',
	'city-and-places',
	'religion',
	'function-word',
	'other'
] as const;

/**
 * Display names. These land straight in the H1 and the <title> after "Egyptian
 * Arabic", so they are written the way people search — "Body Parts", not "The
 * body" — rather than as descriptions of the classifier's categories. None of
 * them end in "Words", because the heading template adds that.
 */
const TOPIC_LABELS: Record<string, string> = {
	numbers: 'Numbers',
	'food-and-drink': 'Food and Drink',
	family: 'Family',
	colors: 'Colors',
	'time-and-dates': 'Time and Dates',
	'the-body': 'Body Parts',
	clothes: 'Clothes',
	'the-home': 'The Home',
	'travel-and-directions': 'Travel and Directions',
	'work-and-money': 'Work and Money',
	'school-and-learning': 'School and Education',
	'weather-and-nature': 'Weather and Nature',
	animals: 'Animals',
	feelings: 'Feelings and Emotions',
	'greetings-and-manners': 'Greetings',
	'people-and-describing': 'Describing People',
	'city-and-places': 'Places and Buildings',
	religion: 'Religion',
	verbs: 'Verbs',
	adjectives: 'Adjectives',
	'most-common': 'Most Common'
};

/**
 * Page headings, where the topic label does not read well in one.
 * "Egyptian Arabic Most common words" is not a sentence anybody would write.
 */
const TOPIC_HEADINGS: Record<string, (count: number) => string> = {
	'most-common': (count) => `The ${count.toLocaleString()} Most Common Egyptian Arabic Words`
};

function headingFor(topic: string, label: string, count: number): string {
	return TOPIC_HEADINGS[topic]?.(count) ?? `Egyptian Arabic ${label} — ${count} Words`;
}

const POS = ['verb', 'noun', 'adjective', 'adverb', 'other'] as const;

// Deliberately flat, with a loose array bound. Tightly bounded nested schemas
// get rejected by the API.
const classificationSchema = z.object({
	items: z.array(
		z.object({
			index: z.number(),
			topic: z.enum(TOPICS),
			pos: z.enum(POS),
			tashkeel: z.string(),
			transliteration: z.string()
		})
	)
});

const jsonSchema = zodToJsonSchema(classificationSchema);

interface Classified {
	topic: string;
	pos: string;
	tashkeel: string;
	transliteration: string;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonSafe(text: string) {
	return JSON.parse(
		text
			.replace(/^```(?:json)?\n?/i, '')
			.replace(/\n?```$/i, '')
			.trim()
	);
}

async function classifyBatch(
	ai: GoogleGenAI,
	batch: { index: number; arabic: string; english: string; franco: string }[]
) {
	const prompt = `You are cataloguing Egyptian Arabic (Masri) vocabulary for learners.

For each numbered word below, return:
- topic: which ONE of these it belongs to — ${TOPICS.join(', ')}.
  Use "function-word" for particles, pronouns, prepositions and conjunctions
  (من, في, اللي, ده) — words that carry grammar rather than meaning.
  Use "other" only when nothing else fits. Do not stretch a word into a topic
  it only loosely relates to; a wrong topic is worse than "other".
- pos: verb, noun, adjective, adverb, or other.
- tashkeel: the same word in Arabic script WITH full diacritics.
- transliteration: plain ASCII romanization. 3 for ع, 7 for ح, gh for غ,
  kh for خ, sh for ش. No accents, no special Unicode.

Do not change the word. Do not translate it. The English gloss is given so you
can pick the right sense — trust it.

WORDS:
${batch.map((w) => `${w.index}. ${w.arabic} — "${w.english}" (${w.franco})`).join('\n')}

Return one item per word, with the matching index.`;

	const response = await ai.models.generateContent({
		model: 'gemini-3.1-pro-preview',
		contents: `${prompt}

Return a valid JSON object exactly matching this schema:
${JSON.stringify(jsonSchema, null, 2)}

Return PURE JSON only. No markdown code blocks. No explanations.`,
		config: {
			temperature: 0.1,
			responseMimeType: 'application/json',
			responseJsonSchema: jsonSchema
		}
	});

	const text = response.text;
	if (!text) throw new Error('No content from Gemini');
	return classificationSchema.parse(parseJsonSafe(text)).items;
}

async function classifyAll(words: typeof commonWords, force: boolean) {
	const cache: Record<string, Classified> = existsSync(CLASSIFY_CACHE)
		? JSON.parse(readFileSync(CLASSIFY_CACHE, 'utf-8'))
		: {};

	const todo = words.filter((w) => force || !cache[w._id]);
	if (!todo.length) {
		console.log(`classification: all ${words.length} words cached`);
		return cache;
	}

	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) throw new Error('GEMINI_API_KEY is required to classify');
	const ai = new GoogleGenAI({ apiKey });

	const slices: (typeof todo)[] = [];
	for (let i = 0; i < todo.length; i += BATCH_SIZE) slices.push(todo.slice(i, i + BATCH_SIZE));

	console.log(
		`classifying ${todo.length} words in ${slices.length} batches, ${CONCURRENCY} at a time...`
	);

	let done = 0;
	let next = 0;

	async function worker() {
		while (next < slices.length) {
			const slice = slices[next++];
			const batch = slice.map((w, n) => ({
				index: n,
				arabic: w.word,
				english: w.en,
				franco: w.franco ?? ''
			}));

			try {
				const items = await classifyBatch(ai, batch);
				for (const item of items) {
					const source = slice[item.index];
					// A bad index would silently mislabel a word, so drop it instead.
					if (!source) continue;
					cache[source._id] = {
						topic: item.topic,
						pos: item.pos,
						tashkeel: item.tashkeel,
						transliteration: item.transliteration
					};
				}
			} catch (e) {
				console.warn(`  a batch failed: ${e instanceof Error ? e.message : e}`);
			}

			// Written after every batch so an interrupted run keeps its work. Safe
			// to do from several workers because they share one `cache` object and
			// Node runs them on one thread — there is no interleaved write.
			writeFileSync(CLASSIFY_CACHE, JSON.stringify(cache, null, 2));
			console.log(`  ${Math.min(++done * BATCH_SIZE, todo.length)}/${todo.length}`);
			await sleep(250);
		}
	}

	await Promise.all(Array.from({ length: CONCURRENCY }, worker));

	return cache;
}

async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const force = args.includes('--classify');
	const limit = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 0);

	const words = limit ? commonWords.slice(0, limit) : commonWords;
	console.log(`${words.length} frequency-list entries`);

	const classification = await classifyAll(words, force);
	const byWord = buildCorpusIndex(readCorpusCache(CORPUS_CACHE));

	interface Entry {
		slug: string;
		arabic: string;
		arabicPlain: string;
		english: string;
		franco: string;
		transliteration: string;
		pos: string;
		occurrences: number;
		frequencyRank: number;
		examples: ReturnType<typeof findExamples>;
	}

	const byTopic = new Map<string, Entry[]>();
	const taken = new Set<string>();
	const seenSkeletons = new Set<string>();
	let noExamples = 0;
	let unclassified = 0;
	let duplicates = 0;

	const ranked = [...words].sort((a, b) => (b.appeared ?? 0) - (a.appeared ?? 0));

	for (const [rank, word] of ranked.entries()) {
		const meta = classification[word._id];
		if (!meta) {
			unclassified++;
			continue;
		}

		const skeleton = normalise(word.word);
		// The list has near-duplicates (صباح / الصباح); the more frequent one wins.
		if (seenSkeletons.has(skeleton)) {
			duplicates++;
			continue;
		}
		seenSkeletons.add(skeleton);

		const examples = findExamples(byWord, skeleton, word.en, 3);
		if (examples.length < MIN_EXAMPLES) {
			noExamples++;
			continue;
		}

		const entry: Entry = {
			slug: toSlug(word.franco ?? '', word.word, taken),
			arabic: meta.tashkeel || word.word,
			arabicPlain: word.word,
			english: word.en,
			franco: word.franco ?? '',
			transliteration: meta.transliteration || word.franco || '',
			pos: meta.pos,
			occurrences: word.appeared ?? 0,
			frequencyRank: rank + 1,
			examples
		};

		// Semantic topic, plus part-of-speech buckets, because "egyptian arabic
		// verbs" is its own query and a verb also belongs to a topic.
		const topics = new Set<string>([meta.topic]);
		if (meta.pos === 'verb') topics.add('verbs');
		if (meta.pos === 'adjective') topics.add('adjectives');

		for (const topic of topics) {
			if (topic === 'other') continue;
			// Function words get no topic page of their own, but they are the
			// headline of the most-common list, so they stay in that one.
			if (topic === 'function-word') continue;
			if (!byTopic.has(topic)) byTopic.set(topic, []);
			byTopic.get(topic)!.push(entry);
		}

		if (!byTopic.has('most-common')) byTopic.set('most-common', []);
		byTopic.get('most-common')!.push(entry);
	}

	console.log(
		`${seenSkeletons.size - duplicates} distinct words; ` +
			`${noExamples} skipped with no real example, ${unclassified} unclassified, ` +
			`${duplicates} duplicate skeletons`
	);

	const shipped = [...byTopic.entries()]
		.filter(
			([topic, entries]) =>
				!HAND_AUTHORED.has(topic) &&
				(topic === 'most-common' || entries.length >= MIN_WORDS_PER_TOPIC)
		)
		.sort((a, b) => b[1].length - a[1].length);

	console.log(`\ntopics (gate: ${MIN_WORDS_PER_TOPIC} words):`);
	for (const [topic, entries] of [...byTopic.entries()].sort((a, b) => b[1].length - a[1].length)) {
		const ship = topic === 'most-common' || entries.length >= MIN_WORDS_PER_TOPIC;
		console.log(`  ${ship ? '✓' : '✗'} ${topic.padEnd(24)} ${entries.length}`);
	}

	if (dryRun) return;

	if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

	for (const [topic, entries] of shipped) {
		if (HAND_AUTHORED.has(topic)) continue;
		const sorted = entries.sort((a, b) => a.frequencyRank - b.frequencyRank);
		const words = topic === 'most-common' ? sorted.slice(0, MOST_COMMON_LIMIT) : sorted;
		writeFileSync(
			join(OUT_DIR, `${topic}.json`),
			JSON.stringify(
				{
					slug: topic,
					dialect: DIALECT,
					label: TOPIC_LABELS[topic] ?? topic,
					heading: headingFor(topic, TOPIC_LABELS[topic] ?? topic, words.length),
					words
				},
				null,
				2
			) + '\n'
		);
	}

	// Drop files from earlier runs so the glob never serves a stale topic.
	const wanted = new Set([
		...shipped.map(([topic]) => `${topic}.json`),
		...[...HAND_AUTHORED].map((topic) => `${topic}.json`)
	]);
	for (const file of readdirSync(OUT_DIR)) {
		if (file.endsWith('.json') && !wanted.has(file)) {
			rmSync(join(OUT_DIR, file));
			console.log(`removed stale ${file}`);
		}
	}

	console.log(`\nwrote ${shipped.length} topic files to ${OUT_DIR}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
