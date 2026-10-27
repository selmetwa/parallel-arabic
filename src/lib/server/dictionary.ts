/**
 * The dictionary: search over the `word` table, plus per-word grammar details
 * (gender, plural, root, examples) that are generated the first time an entry
 * is opened and cached in `word_details` (docs/sql/2026-10-26-dictionary.sql).
 */
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { supabase } from '$lib/supabaseClient';
import { stripArabicDiacritics } from '$lib/utils/arabic-normalization';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { getDialectSystemInstruction } from '$lib/data/dialect-rules-v2';
import { formatDialectName } from '$lib/utils/seo';
import { verbIndexFor } from '$lib/data/verb-conjugations/manifest';
import { getWord, wordSlugsFor } from '$lib/data/words/manifest';
import {
	categoryLabel,
	type DictionaryDetails,
	type DictionaryExample,
	type DictionaryWord
} from '$lib/data/dictionary';

export { categoryLabel };
export type { DictionaryDetails, DictionaryExample, DictionaryWord };

// Writes to word_details need the service role: the table is read-only to anon.
const admin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/** Arabic as stored in word.arabic_plain: no harakat or tatweel, plain alif. */
export function plainArabic(text: string): string {
	return stripArabicDiacritics(text).replace(/[أإآ]/g, 'ا').trim();
}

const COLUMNS = 'id, arabic_word, english_word, transliterated_word, category, audio_url, frequency';

interface WordRow {
	id: string;
	arabic_word: string;
	english_word: string;
	transliterated_word: string | null;
	category: string | null;
	audio_url: string | null;
	frequency: number | null;
}

function toWord(row: WordRow): DictionaryWord {
	return {
		id: row.id,
		arabic: row.arabic_word,
		english: row.english_word,
		transliteration: asciiTranslit(row.transliterated_word ?? ''),
		category: row.category,
		audioUrl: row.audio_url
	};
}

// The word table also holds notes and whole example sentences; the dictionary
// lists words and short phrases only.
function isDictionaryWord(row: WordRow): boolean {
	const arabic = row.arabic_word?.trim();
	const english = row.english_word?.trim();
	if (!arabic || !english || english.length > 80) return false;
	if (/[?؟.!]$/.test(arabic) || arabic.split(/\s+/).length > 3) return false;
	return /[؀-ۿ]/.test(arabic);
}

function cleanEnglish(english: string): string {
	return english
		.toLowerCase()
		.replace(/\(.*?\)/g, '')
		.replace(/^to\s+/, '')
		.trim();
}

function rank(row: WordRow, q: string, qArabic: string): number {
	const english = cleanEnglish(row.english_word);
	const senses = english.split(/[,;/]/).map((s) => s.trim());
	const arabic = plainArabic(row.arabic_word);
	const translit = (row.transliterated_word ?? '').toLowerCase();
	if (senses.includes(q) || (qArabic && arabic === qArabic) || translit === q) return 0;
	if (senses.some((s) => s.startsWith(q)) || (qArabic && arabic.startsWith(qArabic))) return 1;
	if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(english)) return 2;
	return 3;
}

// PostgREST `or` filters treat these as syntax.
function sanitize(q: string): string {
	return q.replace(/[,()%*\\:"']/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function searchDictionary(
	dialect: string,
	query: string,
	limit = 40
): Promise<DictionaryWord[]> {
	const q = sanitize(query).toLowerCase();
	if (!q) return [];
	const qArabic = /[؀-ۿ]/.test(q) ? plainArabic(q) : '';

	const filter = qArabic
		? `arabic_plain.ilike.%${qArabic}%`
		: `english_word.ilike.%${q}%,transliterated_word.ilike.%${q}%`;

	let { data, error } = await supabase
		.from('word')
		.select(COLUMNS)
		.eq('dialect', dialect)
		.or(filter)
		.limit(300);

	// Before the migration adds arabic_plain, fall back to the raw column.
	if (error && qArabic) {
		({ data, error } = await supabase
			.from('word')
			.select(COLUMNS)
			.eq('dialect', dialect)
			.ilike('arabic_word', `%${qArabic}%`)
			.limit(300));
	}
	if (error) throw error;

	const seen = new Set<string>();
	return ((data ?? []) as WordRow[])
		.filter(isDictionaryWord)
		.sort(
			(a, b) =>
				rank(a, q, qArabic) - rank(b, q, qArabic) ||
				(b.frequency ?? 0) - (a.frequency ?? 0) ||
				Number(!!b.audio_url) - Number(!!a.audio_url) ||
				a.english_word.length - b.english_word.length
		)
		.filter((row) => {
			const key = `${plainArabic(row.arabic_word)}|${cleanEnglish(row.english_word)}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		})
		.slice(0, limit)
		.map(toWord);
}

const categoryCache = new Map<string, { at: number; categories: string[] }>();

/** The word-list categories a dialect has, for browsing without a search. */
export async function dictionaryCategories(dialect: string): Promise<string[]> {
	const cached = categoryCache.get(dialect);
	if (cached && Date.now() - cached.at < 60 * 60 * 1000) return cached.categories;

	const { data, error } = await supabase.from('word').select('category').eq('dialect', dialect).limit(10000);
	if (error) throw error;
	const counts = new Map<string, number>();
	for (const row of data ?? []) {
		if (row.category) counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
	}
	const categories = [...counts.entries()]
		.filter(([, n]) => n >= 8)
		.map(([c]) => c)
		.sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b)));
	categoryCache.set(dialect, { at: Date.now(), categories });
	return categories;
}

export async function wordsInCategory(dialect: string, category: string): Promise<DictionaryWord[]> {
	const { data, error } = await supabase
		.from('word')
		.select(COLUMNS)
		.eq('dialect', dialect)
		.eq('category', category)
		.order('frequency', { ascending: false, nullsFirst: false })
		.order('english_word')
		.limit(500);
	if (error) throw error;
	return ((data ?? []) as WordRow[]).filter(isDictionaryWord).map(toWord);
}

export async function getDictionaryWord(dialect: string, id: string): Promise<DictionaryWord | null> {
	const { data, error } = await supabase
		.from('word')
		.select(COLUMNS)
		.eq('id', id)
		.eq('dialect', dialect)
		.maybeSingle();
	if (error) throw error;
	return data ? toWord(data as WordRow) : null;
}

// --- details -----------------------------------------------------------------

// The word table's transliterations use IPA-style letters (ɧ, ʔ, ā), and the
// model sometimes copies them. Map them to the app's 3/7/2 style.
const TRANSLIT_MAP: [RegExp, string][] = [
	[/ɧ|ḥ/g, '7'],
	[/ʔ|ʕ/g, '2'],
	[/ɣ/g, 'gh'],
	[/š/g, 'sh'],
	[/[ȿṣ]/g, 's'],
	[/[ʈṭ]/g, 't'],
	[/[ɖḍ]/g, 'd'],
	[/[ʐẓ]/g, 'z'],
	[/ā/g, 'aa'],
	[/ī/g, 'ii'],
	[/ū/g, 'uu'],
	[/ē/g, 'ee'],
	[/ō/g, 'oo'],
	[/[áàâ]/g, 'a'],
	[/[íì]/g, 'i'],
	[/[úù]/g, 'u'],
	[/[éè]/g, 'e'],
	[/[óò]/g, 'o'],
	[/ə/g, 'e'],
	[/x/g, 'kh']
];

function asciiTranslit(text: string): string {
	return TRANSLIT_MAP.reduce((t, [re, to]) => t.replace(re, to), text.replace(/\[[^\]]*\]/g, ''))
		.replace(/\s+/g, ' ')
		.trim();
}

const detailsSchema = z.object({
	pos: z.enum(['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'phrase', 'other']),
	gender: z.enum(['masculine', 'feminine', 'none']),
	pluralArabic: z.string(),
	pluralTransliteration: z.string(),
	root: z.string(),
	presentArabic: z.string(),
	presentTransliteration: z.string(),
	examples: z.array(
		z.object({ arabic: z.string(), transliteration: z.string(), english: z.string() })
	)
});

const detailsJsonSchema = zodToJsonSchema(detailsSchema);

interface DetailsRow {
	pos: string | null;
	gender: string | null;
	plural_arabic: string | null;
	plural_transliteration: string | null;
	root: string | null;
	present_arabic: string | null;
	present_transliteration: string | null;
	examples: DictionaryExample[] | null;
}

/** Story sentences that already illustrate this word, from the word pages. */
function storyExamples(dialect: string, word: DictionaryWord): { examples: DictionaryExample[]; slug: string | null } {
	const target = plainArabic(word.arabic);
	for (const slug of wordSlugsFor(dialect)) {
		const entry = getWord(dialect, slug);
		if (entry && plainArabic(entry.arabic) === target) {
			return {
				slug,
				examples: entry.examples.slice(0, 2).map(({ arabic, transliteration, english }) => ({ arabic, transliteration, english }))
			};
		}
	}
	return { examples: [], slug: null };
}

function conjugationSlugFor(dialect: string, word: DictionaryWord): string | null {
	const target = plainArabic(word.arabic.split(/[،,]/)[0]);
	return verbIndexFor(dialect).find((v) => plainArabic(v.arabic) === target)?.slug ?? null;
}

async function generateDetails(dialect: string, word: DictionaryWord, haveExamples: number) {
	const apiKey = env['GEMINI_API_KEY'];
	if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
	const ai = new GoogleGenAI({ apiKey });
	const dialectName = formatDialectName(dialect);
	const wanted = Math.max(1, 2 - haveExamples);

	const prompt = `You are writing a learner's dictionary entry for a ${dialectName} word.

Word: ${word.arabic}
Transliteration: ${word.transliteration}
Meaning: ${word.english}

Fill in:
- pos: the part of speech.
- gender: "masculine" or "feminine" for nouns (and adjectives in their base form use "masculine"); "none" otherwise.
- pluralArabic / pluralTransliteration: the everyday ${dialectName} plural for nouns and adjectives; "" if there is none.
- root: the Arabic root letters separated by spaces (e.g. "ك ت ب"); "" for loanwords, particles or phrases without a clear root.
- presentArabic / presentTransliteration: for verbs, the ${dialectName} present-tense "he" form; "" otherwise.
- examples: ${wanted} short, natural ${dialectName} example sentence${wanted > 1 ? 's' : ''} using the word, each with transliteration and an English translation.

Transliteration style: 3 for ع, 7 for ح, 2 for ء, gh, kh, sh, double vowels for long vowels, no accent marks.`;

	const response = await generateContentWithRetry(ai, {
		model: 'gemini-2.5-flash',
		contents: prompt,
		config: {
			temperature: 0.2,
			systemInstruction: getDialectSystemInstruction(dialect),
			responseMimeType: 'application/json',
			responseJsonSchema: detailsJsonSchema
		}
	});
	if (!response.text) throw new Error('No content from Gemini');
	return parseJsonFromGeminiResponse(response.text, detailsSchema);
}

/** A word's grammar details, generating and caching them on first request. */
export async function getDictionaryDetails(dialect: string, word: DictionaryWord): Promise<DictionaryDetails> {
	const story = storyExamples(dialect, word);
	const links = { conjugationSlug: conjugationSlugFor(dialect, word), wordPageSlug: story.slug };

	const { data: cached } = await supabase
		.from('word_details')
		.select('pos, gender, plural_arabic, plural_transliteration, root, present_arabic, present_transliteration, examples')
		.eq('word_id', word.id)
		.maybeSingle();

	let row = cached as DetailsRow | null;
	if (!row) {
		const generated = await generateDetails(dialect, word, story.examples.length);
		const orNull = (s: string) => (s.trim() ? s.trim() : null);
		const translit = (s: string) => orNull(asciiTranslit(s));
		row = {
			pos: generated.pos,
			gender: generated.gender === 'none' ? null : generated.gender,
			plural_arabic: orNull(generated.pluralArabic),
			plural_transliteration: translit(generated.pluralTransliteration),
			root: orNull(generated.root),
			present_arabic: orNull(generated.presentArabic),
			present_transliteration: translit(generated.presentTransliteration),
			examples: generated.examples
				.slice(0, 2)
				.map((ex) => ({ ...ex, transliteration: asciiTranslit(ex.transliteration) }))
		};
		const { error } = await admin.from('word_details').upsert({ word_id: word.id, ...row });
		if (error) console.error('[dictionary] could not cache word_details:', error.message);
	}

	return {
		pos: row.pos,
		gender: row.gender,
		pluralArabic: row.plural_arabic,
		pluralTransliteration: row.plural_transliteration,
		root: row.root,
		presentArabic: row.present_arabic,
		presentTransliteration: row.present_transliteration,
		// Real story sentences first, then generated ones to make up two.
		examples: [...story.examples, ...(row.examples ?? [])].slice(0, 2),
		...links
	};
}
