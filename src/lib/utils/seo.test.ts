import { describe, expect, it } from 'vitest';
import {
	resolvePageMeta,
	resolvePageKey,
	isNoindexPath,
	resolveStructuredData,
	resolveBreadcrumbs
} from './seo';

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
			'/learn/game/quiz',
			'/learn/game/word-scramble',
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
		const titles = [
			'/keyboard',
			'/mobile-app',
			'/learn/game',
			'/learn/game/quiz',
			'/learn/game/word-scramble',
			'/'
		].map((p) => resolvePageMeta(p).title);
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

	it('routes the games hub, the quiz and each game, but not the play screen', () => {
		expect(resolvePageKey('/learn/game')?.key).toBe('game');
		expect(resolvePageKey('/learn/game/quiz')?.key).toBe('game-quiz');
		expect(resolvePageKey('/learn/game/word-scramble')).toEqual({
			key: 'game-page',
			data: { slug: 'word-scramble', gameName: 'Word Scramble' }
		});
		expect(resolvePageKey('/learn/game/play')).toBeNull();
		expect(resolvePageKey('/learn/game/not-a-game')).toBeNull();
		expect(resolvePageMeta('/learn/game/play').noindex).toBe(true);
	});

	it('returns null for an unmapped path so the caller self-canonicalises', () => {
		expect(resolvePageKey('/some/route/added/later')).toBeNull();
	});
});

describe('structured data', () => {
	const faqs = [{ question: 'q', answer: 'a' }];

	it('emits FAQPage for any route that returns faqs, not a hardcoded list', () => {
		for (const path of [
			'/egyptian-arabic',
			'/egyptian-arabic/pronunciation',
			'/egyptian-arabic/beginners',
			'/learn/game',
			'/learn/game/quiz',
			'/learn/game/word-scramble'
		]) {
			expect((resolveStructuredData(path, { faqs }) as { '@type': string })['@type']).toBe(
				'FAQPage'
			);
		}
	});

	it('emits a DefinedTermSet listing the words on a vocabulary topic page', () => {
		const topic = {
			slug: 'numbers',
			label: 'Numbers',
			heading: 'Egyptian Arabic Numbers',
			words: [{ arabic: 'واحد', transliteration: 'waahid', english: 'one' }]
		};
		const sd = resolveStructuredData('/egyptian-arabic/vocabulary/numbers', { topic }) as {
			'@type': string;
			hasDefinedTerm: { name: string }[];
		};
		expect(sd['@type']).toBe('DefinedTermSet');
		expect(sd.hasDefinedTerm[0].name).toBe('واحد');
	});
});

describe('egyptian-only routes', () => {
	it('maps the Egyptian vocabulary routes', () => {
		expect(resolvePageKey('/egyptian-arabic/vocabulary')?.key).toBe('vocabulary-hub');
		expect(resolvePageKey('/egyptian-arabic/vocabulary/numbers')).toEqual({
			key: 'vocabulary-topic',
			data: { dialect: 'egyptian-arabic', slug: 'numbers' }
		});
		expect(resolvePageKey('/egyptian-arabic/pronunciation')?.key).toBe('pronunciation');
		expect(resolvePageKey('/egyptian-arabic/beginners')?.key).toBe('beginners');
	});

	it('does not claim those keys for other dialects', () => {
		// These pages do not exist for Levantine, and their copy names Egyptian.
		expect(resolvePageKey('/levantine/vocabulary')).toBeNull();
		expect(resolvePageKey('/levantine/pronunciation')).toBeNull();
	});
});

describe('breadcrumbs', () => {
	it('skips pages too shallow to need a trail', () => {
		expect(resolveBreadcrumbs('/')).toBeNull();
		expect(resolveBreadcrumbs('/egyptian-arabic')).toBeNull();
	});

	it('skips noindex paths', () => {
		expect(resolveBreadcrumbs('/profile/saved-words')).toBeNull();
	});

	it('builds a dialect-aware trail and names the leaf after the page', () => {
		const crumbs = resolveBreadcrumbs('/egyptian-arabic/vocabulary/numbers', {
			topic: { label: 'Numbers' }
		}) as { itemListElement: { name: string; item: string }[] };

		expect(crumbs.itemListElement.map((c) => c.name)).toEqual([
			'Home',
			'Egyptian Arabic',
			'Vocabulary',
			'Numbers'
		]);
		expect(crumbs.itemListElement[3].item).toBe(
			'https://www.parallel-arabic.com/egyptian-arabic/vocabulary/numbers'
		);
	});

	it('falls back to the slug when the page has no name for the leaf', () => {
		const crumbs = resolveBreadcrumbs('/egyptian-arabic/pronunciation') as {
			itemListElement: { name: string }[];
		};
		expect(crumbs.itemListElement.at(-1)?.name).toBe('Pronunciation');
	});
});
