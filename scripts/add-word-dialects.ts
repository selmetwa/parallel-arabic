#!/usr/bin/env node
/**
 * Refresh "the same word in the other dialects" on the existing word pages,
 * without rebuilding them. `npm run build:words` does this itself for the
 * dialect it builds; run this after the word table changes.
 *
 * Usage:
 *   npm run build:word-dialects -- --dry-run
 *   npm run build:word-dialects
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { addOtherDialects } from './lib/word-dialects';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

addOtherDialects(join(__dirname, '..', 'src', 'lib', 'data', 'words'), {
	dryRun: process.argv.includes('--dry-run')
}).catch((error) => {
	console.error(error);
	process.exit(1);
});
