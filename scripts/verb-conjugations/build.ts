/**
 * Writes the Levantine, Darija and Fusha conjugation files from the stem
 * tables. Run with: npx vite-node scripts/verb-conjugations/build.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as levantine from './levantine';
import * as darija from './darija';
import * as fusha from './fusha';

const OUT = 'src/lib/data/verb-conjugations';

const DIALECTS = { levantine, darija, fusha } as const;

for (const [dialect, mod] of Object.entries(DIALECTS)) {
	const dir = join(OUT, dialect);
	mkdirSync(dir, { recursive: true });
	const verbs = mod.SPECS.map((spec) => {
		const file = mod.build(spec);
		writeFileSync(join(dir, `${spec.slug}.json`), JSON.stringify(file, null, 2) + '\n');
		const { conjugations: _, notes: __, ...summary } = file;
		return summary;
	});
	verbs.sort((a, b) => String(a.english).localeCompare(String(b.english)));
	writeFileSync(
		join(dir, 'index.json'),
		JSON.stringify({ dialect, generatedAt: new Date().toISOString(), verbs }, null, 2) + '\n'
	);
	console.log(`${dialect}: ${verbs.length} verbs`);
}
