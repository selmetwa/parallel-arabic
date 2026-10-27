import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/** index.json lists every table in the folder, hand-built and generated. */
export function rebuildIndex(dir: string, name: string) {
	const verbs = readdirSync(dir)
		.filter((f) => f.endsWith('.json') && f !== 'index.json')
		.map((f) => {
			const v = JSON.parse(readFileSync(join(dir, f), 'utf8'));
			return { slug: v.slug, arabic: v.arabic, transliteration: v.transliteration, english: v.english, wordId: v.wordId ?? null, rootLetters: v.rootLetters, verbClass: v.verbClass };
		})
		.sort((a, b) => String(a.english).localeCompare(String(b.english)));
	writeFileSync(join(dir, 'index.json'), JSON.stringify({ dialect: name, generatedAt: new Date().toISOString(), verbs }, null, 2) + '\n');
	return verbs.length;
}
