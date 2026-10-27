import { describe, expect, it } from 'vitest';
import { GRAMMAR_DIALECTS, GRAMMAR_TOPICS, getGrammarTopic } from './topics';
import { grammarBody } from './manifest';
import { grammarExcerpt, renderGrammar } from './render';

describe('grammar reference', () => {
	it('has a body for every topic in every grammar dialect', () => {
		for (const dialect of GRAMMAR_DIALECTS) {
			for (const topic of GRAMMAR_TOPICS) {
				expect(grammarBody(dialect, topic.slug), `${dialect}/${topic.slug}`).toBeTruthy();
			}
		}
	});

	it('only relates topics that exist', () => {
		for (const topic of GRAMMAR_TOPICS) {
			for (const slug of topic.related) expect(getGrammarTopic(slug), slug).toBeDefined();
		}
	});

	it('links only to grammar articles that exist', () => {
		for (const dialect of GRAMMAR_DIALECTS) {
			for (const topic of GRAMMAR_TOPICS) {
				const body = grammarBody(dialect, topic.slug)!;
				for (const [, d, slug] of body.matchAll(/\]\(\/grammar\/([^/]+)\/([^)]+)\)/g)) {
					expect(grammarBody(d, slug), `${dialect}/${topic.slug} → ${d}/${slug}`).toBeTruthy();
				}
			}
		}
	});

	it('gives every example row three columns', () => {
		for (const dialect of GRAMMAR_DIALECTS) {
			for (const topic of GRAMMAR_TOPICS) {
				const body = grammarBody(dialect, topic.slug)!;
				for (const block of body.matchAll(/```ex\n([\s\S]*?)```/g)) {
					for (const row of block[1].split('\n').filter((l) => l.trim())) {
						expect(row.split('|').length, `${dialect}/${topic.slug}: ${row}`).toBe(3);
					}
				}
			}
		}
	});
});

describe('renderGrammar', () => {
	it('renders headings, tables, examples and tips', () => {
		const html = renderGrammar(
			[
				'Intro with **bold** and [a link](/grammar/fusha/dual).',
				'',
				'## Heading',
				'',
				'| A | B |',
				'| --- | --- |',
				'| 1 | 2 |',
				'',
				'```ex',
				'كتاب | kitaab | book',
				'```',
				'',
				'> A tip.'
			].join('\n')
		);
		expect(html).toContain('<strong>bold</strong>');
		expect(html).toContain('<a href="/grammar/fusha/dual">a link</a>');
		expect(html).toContain('<h2>Heading</h2>');
		expect(html).toContain('<td>1</td>');
		expect(html).toContain('<span class="ex-ar" dir="rtl" lang="ar">كتاب</span>');
		expect(html).toContain('<aside class="tip">A tip.</aside>');
	});

	it('escapes HTML in the source', () => {
		expect(renderGrammar('a <script> b')).not.toContain('<script>');
	});

	it('wraps Arabic runs in prose for bidi', () => {
		expect(renderGrammar('The word كتاب means book.')).toContain('<bdi class="ar" dir="rtl">كتاب</bdi>');
	});

	it('takes the first paragraph as the excerpt', () => {
		expect(grammarExcerpt('First **para**.\n\n## Next')).toBe('First para.');
	});
});
