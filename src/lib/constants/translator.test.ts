import { describe, expect, it } from 'vitest';
import { isDialect } from './dialects';
import {
	TRANSLATOR_MAX_CHARS,
	parseTranslateInput,
	translationCacheKey,
	translatorCopy
} from './translator';

describe('parseTranslateInput', () => {
	it('accepts English text for a real dialect, collapsing whitespace', () => {
		expect(parseTranslateInput({ text: '  how   are you? ', dialect: 'darija' }, isDialect)).toEqual({
			ok: true,
			input: { text: 'how are you?', dialect: 'darija' }
		});
	});

	it('rejects an unknown dialect', () => {
		const res = parseTranslateInput({ text: 'hello', dialect: 'klingon' }, isDialect);
		expect(res).toEqual({ ok: false, error: 'Invalid dialect' });
	});

	it('rejects empty, missing and non-string text', () => {
		for (const text of ['', '   ', undefined, 42]) {
			expect(parseTranslateInput({ text, dialect: 'levantine' }, isDialect).ok, String(text)).toBe(false);
		}
	});

	it('rejects text over the limit', () => {
		const text = 'a'.repeat(TRANSLATOR_MAX_CHARS + 1);
		expect(parseTranslateInput({ text, dialect: 'levantine' }, isDialect).ok).toBe(false);
	});

	it('rejects a body that is not an object', () => {
		expect(parseTranslateInput(null, isDialect).ok).toBe(false);
		expect(parseTranslateInput('hello', isDialect).ok).toBe(false);
	});
});

describe('translationCacheKey', () => {
	it('ignores case, so "Hello" and "hello" share one cached translation', () => {
		expect(translationCacheKey({ text: 'Hello', dialect: 'darija' })).toBe(
			translationCacheKey({ text: 'hello', dialect: 'darija' })
		);
	});

	it('keeps dialects apart', () => {
		expect(translationCacheKey({ text: 'hello', dialect: 'darija' })).not.toBe(
			translationCacheKey({ text: 'hello', dialect: 'levantine' })
		);
	});
});

describe('translatorCopy', () => {
	it('has written copy for the three dialects people search for', () => {
		expect(translatorCopy('egyptian-arabic').title).toMatch(/^Egyptian Arabic Translator/);
		expect(translatorCopy('darija').title).toMatch(/^Darija Translator/);
		expect(translatorCopy('levantine').title).toMatch(/^Levantine Arabic Translator/);
	});

	it('falls back to generic copy, with FAQs, for every other dialect', () => {
		for (const dialect of ['fusha', 'iraqi', 'khaleeji', 'saudi']) {
			const copy = translatorCopy(dialect);
			expect(copy.title, dialect).toContain('Translator');
			expect(copy.faqs.length, dialect).toBeGreaterThan(0);
		}
	});
});
