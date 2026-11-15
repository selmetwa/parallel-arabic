/**
 * Pure steps between the learner's checklist and the lesson assembler.
 */
import type { ExtractedItem } from '$lib/schemas/tutor-notes-schema';
import type { SentenceItem, VocabItem } from '$lib/schemas/lesson-v2-schema';
import { arabicTokens } from './coverage';
import { normalizeArabicText } from '$lib/utils/arabic-normalization';

const strip = (s: string) => normalizeArabicText(s).replace(/[^ء-ي ]/g, '').trim();

/**
 * The kept vocab items as lesson vocab, ordered so each group stays together
 * (groups in order of first appearance). English glosses are made unique because
 * the assembler counts repetitions per gloss (ليه and ليها are both "It has").
 */
export function selectedVocab(items: ExtractedItem[], selection: number[]): VocabItem[] {
	const picked = selection
		.filter((i) => items[i]?.kind === 'vocab')
		.map((i) => items[i]);
	const groupOrder = [...new Set(picked.map((i) => i.group))];
	const sorted = [...picked].sort((a, b) => groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group));

	const seenArabic = new Set<string>();
	const seenGloss = new Set<string>();
	const vocab: VocabItem[] = [];
	for (const item of sorted) {
		const ar = strip(item.arabic);
		if (seenArabic.has(ar)) continue;
		seenArabic.add(ar);

		let english = item.english.trim();
		if (seenGloss.has(english.toLowerCase())) english = `${english} (${item.transliteration})`;
		seenGloss.add(english.toLowerCase());

		vocab.push({
			arabic: item.arabic,
			arabicTashkeel: item.arabicTashkeel || item.arabic,
			english,
			transliteration: item.transliteration,
			wordAlignments: item.wordAlignments.length
				? item.wordAlignments
				: [{ arabic: item.arabic, english, transliteration: item.transliteration }],
			partOfSpeech: item.partOfSpeech
		});
	}
	return vocab;
}

export function selectedConcepts(items: ExtractedItem[], selection: number[]): ExtractedItem[] {
	return selection.filter((i) => items[i]?.kind === 'concept').map((i) => items[i]);
}

/** Lesson words (english glosses) whose Arabic appears in any of the sentences. */
export function wordsUsedIn(vocab: VocabItem[], sentences: SentenceItem[]): string[] {
	const tokens = new Set(sentences.flatMap((s) => arabicTokens(s.arabic).map(strip)));
	const text = sentences.map((s) => strip(s.arabic)).join(' | ');
	return vocab
		.filter((v) => {
			const ar = strip(v.arabic);
			return ar.includes(' ') ? text.includes(ar) : tokens.has(ar) || [...tokens].some((t) => t.endsWith(ar) && t.length - ar.length <= 3);
		})
		.map((v) => v.english);
}

/** Loose Arabic sentences from the notes (not table rows or "a / b" alternatives), for the pool prompt to reuse. */
export function tutorSentences(notes: string): string[] {
	return notes
		.split('\n')
		.filter((line) => !/[|/=]/.test(line) && arabicTokens(line).length >= 3)
		.map((line) => line.trim());
}

/** "Work & study · Cooking · Grammar terms": the most common groups among the kept items. */
export function lessonTitle(items: ExtractedItem[]): string {
	const counts = new Map<string, number>();
	for (const item of items) counts.set(item.group, (counts.get(item.group) ?? 0) + 1);
	const top = [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([g]) => g)
		.filter(Boolean);
	return top.length ? top.join(' · ') : 'Tutor notes';
}
