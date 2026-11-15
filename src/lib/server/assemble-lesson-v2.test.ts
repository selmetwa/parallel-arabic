import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { assembleLessonV2, recurrenceHistogram, type AssembleParams } from './assemble-lesson-v2';
import { generatedLessonV2Schema } from '$lib/schemas/lesson-v2-schema';

// A real hand-built lesson source (Saudi A2, The Kitchen and Its Tools): 15 words, 58 pool sentences.
const source = JSON.parse(
	readFileSync(join(__dirname, '../../../content/lessons-v2/saudi/base-a2-u03.json'), 'utf-8')
);

const base: AssembleParams = {
	topicId: 'base-a2-u03',
	title: 'The Kitchen and Its Tools',
	dialect: 'saudi',
	level: 'A2',
	objectives: [],
	vocab: source.vocab,
	pool: source.pool,
	passages: source.passages,
	scenario: source.scenario
};

const isWordTyping = (step: { type: string; sentence?: { english: string } }, words: Set<string>) =>
	step.type === 'typing' && !!step.sentence && words.has(step.sentence.english);

describe('assembleLessonV2 defaults (curriculum lessons)', () => {
	it('recycles every word at least 8 times and has no word-only typing steps', () => {
		const lesson = generatedLessonV2Schema.parse(assembleLessonV2(base));
		const histogram = recurrenceHistogram(lesson);
		expect(Math.min(...Object.values(histogram))).toBeGreaterThanOrEqual(8);
		const words = new Set(lesson.vocab.map((v) => v.english));
		expect(lesson.steps.filter((s) => isWordTyping(s as never, words))).toHaveLength(0);
	});
});

describe('assembleLessonV2 tutor-notes options', () => {
	const concept = {
		title: 'بـ for tools',
		text: 'Put بـ in front of the tool you use.',
		examples: [source.pool[0]],
		words: [source.vocab[6].english] // introduced in the second chunk
	};
	const lesson = generatedLessonV2Schema.parse(
		assembleLessonV2({ ...base, writing: true, minRecurrence: 4, targetRecurrence: 5, concepts: [concept] })
	);
	const words = new Set(lesson.vocab.map((v) => v.english));

	it('is lighter: every word recurs at least 4 times, and the lesson is shorter than the default', () => {
		const histogram = recurrenceHistogram(lesson);
		expect(Object.keys(histogram)).toHaveLength(base.vocab.length);
		expect(Math.min(...Object.values(histogram))).toBeGreaterThanOrEqual(4);
		expect(lesson.steps.length).toBeLessThan(assembleLessonV2(base).steps.length);
	});

	it('has a "write it in Arabic" step for every word, after its vocab intro', () => {
		for (const word of words) {
			const introAt = lesson.steps.findIndex(
				(s) => s.type === 'vocab-intro' && s.items.some((i) => i.english === word)
			);
			const writeAt = lesson.steps.findIndex(
				(s) => s.type === 'typing' && s.sentence.english === word
			);
			expect(writeAt, word).toBeGreaterThan(introAt);
		}
	});

	it('places the concept card after the chunk that introduces its word, not before', () => {
		const conceptAt = lesson.steps.findIndex((s) => s.type === 'content' && s.title === concept.title);
		const introAt = lesson.steps.findIndex(
			(s) => s.type === 'vocab-intro' && s.items.some((i) => i.english === concept.words[0])
		);
		const nextIntroAt = lesson.steps.findIndex((s, i) => i > introAt && s.type === 'vocab-intro');
		expect(conceptAt).toBeGreaterThan(introAt);
		expect(conceptAt).toBeLessThan(nextIntroAt);
	});

	it('puts a concept with no matching word after the first chunk', () => {
		const orphan = { ...concept, title: 'Orphan', words: ['not a lesson word'] };
		const l = assembleLessonV2({ ...base, writing: true, minRecurrence: 4, targetRecurrence: 5, concepts: [orphan] });
		const conceptAt = l.steps.findIndex((s) => s.type === 'content' && s.title === 'Orphan');
		const secondIntroAt = l.steps.findIndex((s, i) => i > 2 && s.type === 'vocab-intro');
		expect(conceptAt).toBeGreaterThan(0);
		expect(conceptAt).toBeLessThan(secondIntroAt);
	});
});
