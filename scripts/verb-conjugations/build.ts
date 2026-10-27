/**
 * Writes the Levantine, Darija and Fusha conjugation files from the stem
 * tables. Run with: npx vite-node scripts/verb-conjugations/build.ts
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { rebuildIndex } from './generate-more-index';
import * as levantine from './levantine';
import * as darija from './darija';
import * as fusha from './fusha';

const OUT = 'src/lib/data/verb-conjugations';

const DIALECTS = { levantine, darija, fusha } as const;

for (const [dialect, mod] of Object.entries(DIALECTS)) {
	const dir = join(OUT, dialect);
	mkdirSync(dir, { recursive: true });
	for (const spec of mod.SPECS) {
		const file = mod.build(spec);
		writeFileSync(join(dir, `${spec.slug}.json`), JSON.stringify(file, null, 2) + '\n');
	}
	// The index also lists the generated tables (generate-more.ts) in the folder.
	console.log(`${dialect}: ${rebuildIndex(dir, dialect)} verbs`);
}
