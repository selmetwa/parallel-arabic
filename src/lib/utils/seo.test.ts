import { describe, expect, it } from 'vitest';
import { resolvePageMeta, resolvePageKey, isNoindexPath } from './seo';

const BASE = 'https://www.parallel-arabic.com';

describe('resolvePageMeta', () => {
	// The bug this guards against: the old path matcher fell through to 'home'
	// for anything it did not recognise, so /keyboard, /mobile-app and the whole
	// conjugation tree told Google their canonical URL was the homepage.
	it('never canonicalises a non-home page to the homepage', () => {
		const paths = [
			'/keyboard',
			'/mobile-app',
			'/learn/game',
			'/egyptian-arabic/conjugations',
			'/egyptian-arabic/conjugations/gara',
			'/levantine/phrases/hello',
			'/egyptian-arabic/word/2abl',
			'/egyptian-arabic-vs-levantine',
			'/sentences',
			'/conjugations',
			'/some/route/added/later'
		];

		for (const path of paths) {
			expect(resolvePageMeta(path).url, path).toBe(`${BASE}${path}`);
		}
	});

	it('gives the homepage its own canonical', () => {
		expect(resolvePageMeta('/').url).toBe(BASE);
	});

	it('self-canonicalises even when the keyed url points elsewhere', () => {
		// /alphabet/practice used to canonicalise to /alphabet/learn.
		expect(resolvePageMeta('/alphabet/practice').url).toBe(`${BASE}/alphabet/practice`);
		expect(resolvePageMeta('/alphabet/learn').url).toBe(`${BASE}/alphabet/learn`);
		expect(resolvePageMeta('/alphabet').url).toBe(`${BASE}/alphabet`);
	});

	it('ignores a trailing slash', () => {
		expect(resolvePageMeta('/keyboard/').url).toBe(`${BASE}/keyboard`);
	});

	it('gives distinct titles to pages that used to share the homepage one', () => {
		const titles = ['/keyboard', '/mobile-app', '/learn/game', '/'].map(
			(p) => resolvePageMeta(p).title
		);
		expect(new Set(titles).size).toBe(titles.length);
	});

	it('gives each dialect its own description', () => {
		const descriptions = ['/egyptian-arabic', '/levantine', '/darija', '/fusha'].map(
			(p) => resolvePageMeta(p).description
		);
		expect(new Set(descriptions).size).toBe(4);
	});

	it('prefers seo returned by a route load', () => {
		const meta = resolvePageMeta('/anything', {
			seo: { title: 'Custom', description: 'From load' }
		});
		expect(meta.title).toBe('Custom');
		expect(meta.url).toBe(`${BASE}/anything`);
	});

	it('marks private routes noindex', () => {
		for (const path of ['/profile', '/review/import', '/map', '/leaderboard', '/self-study/x']) {
			expect(resolvePageMeta(path).noindex, path).toBe(true);
		}
	});

	it('keeps public routes indexable', () => {
		for (const path of ['/', '/tutor', '/keyboard', '/pricing', '/alphabet', '/blog']) {
			expect(resolvePageMeta(path).noindex, path).toBeFalsy();
		}
	});

	it('does not let a noindex prefix swallow a longer public path', () => {
		expect(isNoindexPath('/reviewing-arabic')).toBe(false);
		expect(isNoindexPath('/review')).toBe(true);
	});
});

describe('resolvePageKey', () => {
	it('routes dialect-scoped paths', () => {
		expect(resolvePageKey('/levantine')).toEqual({
			key: 'dialect',
			data: { dialect: 'levantine' }
		});
		expect(resolvePageKey('/levantine/phrases')).toEqual({
			key: 'phrases',
			data: { dialect: 'levantine' }
		});
		expect(resolvePageKey('/levantine/phrases/hello')).toEqual({
			key: 'phrase',
			data: { dialect: 'levantine', slug: 'hello' }
		});
		expect(resolvePageKey('/egyptian-arabic/conjugations/gara')).toEqual({
			key: 'conjugation-verb',
			data: { dialect: 'egyptian-arabic', slug: 'gara' }
		});
		expect(resolvePageKey('/egyptian-arabic/word/2abl')).toEqual({
			key: 'word',
			data: { dialect: 'egyptian-arabic', slug: '2abl' }
		});
	});

	it('routes comparison pages but not arbitrary -vs- paths', () => {
		expect(resolvePageKey('/egyptian-arabic-vs-levantine')?.key).toBe('comparison');
		expect(resolvePageKey('/klingon-vs-elvish')).toBeNull();
	});

	it('returns null for an unmapped path so the caller self-canonicalises', () => {
		expect(resolvePageKey('/some/route/added/later')).toBeNull();
	});
});
