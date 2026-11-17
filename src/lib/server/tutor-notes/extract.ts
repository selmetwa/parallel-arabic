/**
 * Pulls every vocab word and grammar concept out of a learner's tutor notes,
 * then checks coverage in code and makes one follow-up pass for anything missed.
 */
import type { GoogleGenAI } from '@google/genai';
import { getDialectName, getDialectSystemInstruction, getLessonFormatRules } from '$lib/data/dialect-rules-v2';
import type { VarietyInfo } from '$lib/constants/varieties';
import { callGemini } from '$lib/server/lesson-v2-generation';
import {
	createConceptExamplesSchema,
	createExtractionSchema,
	type ConceptExample,
	type ExtractedItem,
	type TutorExtraction
} from '$lib/schemas/tutor-notes-schema';
import type { VocabItem } from '$lib/schemas/lesson-v2-schema';
import { arabicTokens, findUncovered, linesContaining } from './coverage';
import { normalizeArabicText } from '$lib/utils/arabic-normalization';

const TRANSLITERATION_RULE =
	'"transliteration": chat-style Latin letters: 3 = ع, 7 = ح, 2 = ء, gh = غ, kh = خ, sh = ش, doubled vowels for long vowels (aa, ee, oo), no accent marks.';

const NOTES_INTRO = (dialectName: string) =>
	`A learner of ${dialectName} pasted the notes from a lesson with their private tutor. They are messy: tables of English/Arabic pairs, several forms in one cell, slashes, "=" between synonyms, loose example sentences and short grammar notes.`;

function vocabPrompt(dialect: string, notes: string, focus?: { missing: string[]; known: string[] }) {
	const dialectName = getDialectName(dialect);
	return `${getLessonFormatRules()}
- ${TRANSLITERATION_RULE}

${NOTES_INTRO(dialectName)}

${
	focus
		? `An earlier pass missed these Arabic words: ${focus.missing.join('، ')}. Add one item for each (in its dictionary form), using the lines below for context. These are already extracted, so do not repeat them in any spelling: ${focus.known.join('، ')}.`
		: 'Extract EVERY vocabulary word and phrase in the notes. Missing a word is the worst mistake. (Grammar notes are handled separately; skip lines that only explain grammar, like "ب for tools".)'
}

Rules:
- "kind": always "vocab".
- One item per word or fixed phrase. Split cells that hold several forms into separate items: singular and plural, verb and noun, masculine and feminine (معتمد/ة → معتمد, معتمدة), each synonym after "=", each option around "/". Never output the same word twice, even in a different spelling.
- Full example sentences: keep each one as an item (partOfSpeech "sentence"), AND give every content word inside it (nouns, verbs, adjectives, adverbs, question words) its own item too. E.g. "الرسايل هتاخد وقت" also yields رسايل (messages), خد (to take) and وقت (time).
- "english": what the Arabic actually means. Check every gloss against the Arabic instead of trusting the notes; fix typos. When the notes' English is wrong or loose, use the right meaning and say so briefly in "explanation" (e.g. "Notes say 'Chief'; الطباخ means 'the cook'", "Notes say 'to procrastinate'; كسل means 'laziness'").
- Keep the Arabic spelling from the notes, but write it as everyday ${dialectName}; add full tashkeel in "arabicTashkeel".
- "partOfSpeech": noun, verb, adjective, phrase, sentence, etc. "explanation": "" unless a usage note helps (e.g. the singular of a plural, the feminine of an adjective).
- "sourceLine": the line of the notes the item came from, copied as written.
- "group": a 1–3 word topic label (e.g. "Grammar terms", "Work & study", "Cooking", "Everyday phrases"). Use few labels and reuse them, so related words share a group.

Notes:
"""
${notes}
"""

Return JSON: { "items": [ ... ] }`;
}

function conceptPrompt(dialect: string, notes: string, vocab: ExtractedItem[]) {
	const dialectName = getDialectName(dialect);
	return `${getLessonFormatRules()}
- ${TRANSLITERATION_RULE}

${NOTES_INTRO(dialectName)}

List the GRAMMAR POINTS a learner should practise from these notes. Include:
- every grammar note the tutor wrote (e.g. "ب for tools"), and
- patterns the notes show across entries even when not spelled out, e.g. a verb next to its إت- form (بعت → إتبعت = passive), مفيش + noun (there is no …), masculine/feminine pairs (ليه / ليها, معتمد / معتمدة), regular vs broken plurals.
List each grammar point ONCE, even when the notes show it several times (one item for "masculine and feminine forms", not one per pair). Usually 2 to 6 points. Do not list plain vocabulary.

For each point:
- "kind": "concept".
- "english": a short label, e.g. "إت- makes a verb passive".
- "explanation": how it works, in 1–2 plain English sentences.
- The sentence fields (arabic, arabicTashkeel, transliteration, wordAlignments): one short example of the pattern, using a word from the notes.
- "partOfSpeech": "". "sourceLine": the line it came from (or the lines it was inferred from). "group": "Grammar".

Words extracted from the notes:
${vocab.map((v) => `${v.arabic} — ${v.english}`).join('\n')}

Notes:
"""
${notes}
"""

Return JSON: { "items": [ ... ] }`;
}

const keyOf = (item: ExtractedItem) => `${item.kind}:${normalizeArabicText(item.arabic).replace(/\s+/g, ' ').trim()}`;

/** Items short enough to count as a word's own card; a long sentence doesn't cover the words inside it. */
const MAX_COVERING_TOKENS = 3;

/**
 * Vocab pass, then (in parallel) a grammar-points pass and a follow-up vocab pass
 * for any Arabic words the first pass missed.
 */
export async function extractNotes(
	ai: GoogleGenAI,
	notes: string,
	dialect: string,
	variety?: VarietyInfo
): Promise<TutorExtraction> {
	const schema = createExtractionSchema();
	const system = getDialectSystemInstruction(dialect, variety);
	const ask = (prompt: string, maxTokens: number) =>
		callGemini(ai, system, prompt, schema.zodSchema, schema.jsonSchema, maxTokens).then((r) => r.items);

	const items: ExtractedItem[] = [];
	const seen = new Set<string>();
	const add = (list: ExtractedItem[], kind: ExtractedItem['kind']) => {
		for (const raw of list) {
			const item = { ...raw, kind };
			if (!item.arabic.trim() || !item.english.trim() || seen.has(keyOf(item))) continue;
			seen.add(keyOf(item));
			items.push(item);
		}
	};
	const coveredText = () =>
		items
			.filter((i) => i.kind === 'vocab' && arabicTokens(i.arabic).length <= MAX_COVERING_TOKENS)
			.map((i) => i.arabic);

	add(await ask(vocabPrompt(dialect, notes), 32768), 'vocab');
	const firstVocab = [...items];
	const missing = findUncovered(notes, coveredText());

	const [concepts, extra] = await Promise.all([
		ask(conceptPrompt(dialect, notes, firstVocab), 8192).catch((e) => {
			console.warn('[tutor-notes] grammar pass failed, continuing without concepts:', e);
			return [];
		}),
		missing.length
			? ask(
					vocabPrompt(dialect, linesContaining(notes, missing).join('\n'), {
						missing,
						known: firstVocab.map((i) => i.arabic)
					}),
					16384
				).catch((e) => {
					console.warn('[tutor-notes] follow-up extraction failed, keeping first pass:', e);
					return [];
				})
			: Promise.resolve([])
	]);
	add(extra, 'vocab');
	add(concepts, 'concept');

	return { items, uncovered: findUncovered(notes, coveredText()) };
}

/** 3–4 example sentences per concept, built from the lesson's own words where possible. */
export async function generateConceptExamples(
	ai: GoogleGenAI,
	concepts: ExtractedItem[],
	vocab: VocabItem[],
	dialect: string,
	variety?: VarietyInfo
): Promise<ConceptExample[]> {
	if (!concepts.length) return [];
	const schema = createConceptExamplesSchema();
	const dialectName = getDialectName(dialect);
	const result = await callGemini(
		ai,
		getDialectSystemInstruction(dialect, variety),
		`${getLessonFormatRules()}
- ${TRANSLITERATION_RULE}

Write example sentences in ${dialectName} for each numbered grammar concept below. For each concept write 3 or 4 short, natural sentences that show the pattern clearly, using words from the lesson vocabulary wherever they fit. "english" is the sentence's translation.
"concept": the concept's number, e.g. "2".

Concepts:
${concepts.map((c, i) => `${i + 1}. ${c.english}: ${c.explanation} (pattern: ${c.arabic})`).join('\n')}

Lesson vocabulary:
${vocab.map((v) => `${v.arabic} — ${v.english}`).join('\n')}

Return JSON: { "examples": [ ... ] }`,
		schema.zodSchema,
		schema.jsonSchema,
		12288
	);
	return result.examples;
}
