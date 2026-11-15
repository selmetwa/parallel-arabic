import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import type { ExtractedItem } from '$lib/schemas/tutor-notes-schema';
import { lessonTitle, selectedConcepts, selectedVocab, tutorSentences, wordsUsedIn } from './prepare';

function item(arabic: string, english: string, group: string, kind: 'vocab' | 'concept' = 'vocab'): ExtractedItem {
	return {
		kind,
		arabic,
		arabicTashkeel: arabic,
		english,
		transliteration: english.toLowerCase(),
		wordAlignments: [],
		partOfSpeech: kind === 'vocab' ? 'noun' : '',
		explanation: '',
		sourceLine: arabic,
		group
	};
}

const items = [
	item('أداة', 'Tool', 'Work'),
	item('ليه', 'It has', 'Phrases'),
	item('أدوات', 'Tools', 'Work'),
	item('ليها', 'It has', 'Phrases'),
	item('بـ', 'ب for tools', 'Grammar', 'concept'),
	item('اداة', 'Tool', 'Work') // same word as the first, different hamza
];

describe('selectedVocab', () => {
	const vocab = selectedVocab(items, [0, 1, 2, 3, 4, 5]);

	it('keeps only vocab, grouped together in order of first appearance', () => {
		expect(vocab.map((v) => v.arabic)).toEqual(['أداة', 'أدوات', 'ليه', 'ليها']);
	});

	it('drops a repeated word even when its spelling differs slightly', () => {
		expect(vocab.filter((v) => v.english === 'Tool')).toHaveLength(1);
	});

	it('makes english glosses unique, since the lesson counts practice per gloss', () => {
		expect(vocab.map((v) => v.english)).toEqual(['Tool', 'Tools', 'It has', 'It has (it has)']);
	});

	it('gives a word without alignments a single alignment of itself', () => {
		expect(vocab[0].wordAlignments).toEqual([{ arabic: 'أداة', english: 'Tool', transliteration: 'tool' }]);
	});

	it('respects the checklist', () => {
		expect(selectedVocab(items, [2]).map((v) => v.arabic)).toEqual(['أدوات']);
	});
});

describe('selectedConcepts', () => {
	it('returns only the kept concepts', () => {
		expect(selectedConcepts(items, [0, 4]).map((c) => c.english)).toEqual(['ب for tools']);
	});
});

describe('wordsUsedIn', () => {
	const vocab = selectedVocab([item('أداة', 'Tool', 'Work'), item('قلم', 'Pen', 'Work'), item('مفيش حد', 'Nobody', 'Phrases')], [0, 1, 2]);
	const sentence = (arabic: string) => ({ arabic, arabicTashkeel: arabic, english: '', transliteration: '', wordAlignments: [] });

	it('finds words with clitics attached and multi-word phrases', () => {
		expect(wordsUsedIn(vocab, [sentence('كتبت بالقلم'), sentence('مفيش حد هنا')])).toEqual(['Pen', 'Nobody']);
	});
});

describe('tutorSentences', () => {
	it('picks loose sentences from the notes and skips table rows and single words', () => {
		const notes = readFileSync(join(__dirname, 'fixtures', 'example-notes.txt'), 'utf-8');
		expect(tutorSentences(notes)).toEqual(['الرسايل هتاخد وقت عشان تِتبعِت', 'اية اللغات اللي هتشتغلي بيها ؟']);
	});
});

describe('lessonTitle', () => {
	it('names the lesson after its most common groups', () => {
		expect(lessonTitle(items)).toBe('Work · Phrases · Grammar');
	});
});
