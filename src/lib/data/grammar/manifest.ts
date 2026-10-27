import { GRAMMAR_DIALECTS } from './topics';

/** Article bodies, keyed `${dialect}/${slug}`. */
const bodies = import.meta.glob<string>('./*/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
});

const byKey = new Map<string, string>();
for (const [path, body] of Object.entries(bodies)) {
	const m = path.match(/^\.\/([^/]+)\/([^/]+)\.md$/);
	if (m) byKey.set(`${m[1]}/${m[2]}`, body);
}

export function grammarBody(dialect: string, slug: string): string | undefined {
	return byKey.get(`${dialect}/${slug}`);
}

/** The other dialects that have this article, for "compare dialects". */
export function grammarDialectsFor(slug: string): string[] {
	return GRAMMAR_DIALECTS.filter((d) => byKey.has(`${d}/${slug}`));
}
