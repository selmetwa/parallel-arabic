#!/usr/bin/env node
/**
 * Seed the `word` table with the hand-written game vocabulary for Iraqi,
 * Khaleeji and Saudi (Hijazi). Source files: content/words/<dialect>/<category>.txt,
 * one word per line as `arabic | transliteration | english` (# starts a comment).
 * The category slug is the file name. Every row is checked against the game
 * cleaner (src/lib/games/word-pool.ts) so nothing gets silently dropped in play.
 *
 * Usage:
 *   npx tsx scripts/seed-new-dialect-words.ts --dry-run
 *   npx tsx scripts/seed-new-dialect-words.ts --dialect=iraqi
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: join(ROOT, '.env') });

const DIALECTS = ['iraqi', 'khaleeji', 'saudi'];
const dryRun = process.argv.includes('--dry-run');
const only = process.argv.find((a) => a.startsWith('--dialect='))?.split('=')[1];

interface Row {
	id: string;
	arabic_word: string;
	english_word: string;
	transliterated_word: string;
	dialect: string;
	category: string;
	source: string;
}

function parse(dialect: string): { rows: Row[]; errors: string[] } {
	const dir = join(ROOT, 'content', 'words', dialect);
	const rows: Row[] = [];
	const errors: string[] = [];
	if (!existsSync(dir)) return { rows, errors };
	for (const file of readdirSync(dir).filter((f) => f.endsWith('.txt')).sort()) {
		const category = file.replace(/\.txt$/, '');
		const seenEnglish = new Set<string>();
		const seenArabic = new Set<string>();
		readFileSync(join(dir, file), 'utf8')
			.split('\n')
			.forEach((line, i) => {
				const text = line.replace(/#.*/, '').trim();
				if (!text) return;
				const where = `${dialect}/${file}:${i + 1}`;
				const parts = text.split('|').map((p) => p.trim());
				if (parts.length !== 3 || parts.some((p) => !p)) {
					errors.push(`${where} expected "arabic | translit | english"`);
					return;
				}
				const [arabic, translit, english] = parts;
				// Same rules the game cleaner applies, so every seeded word is playable.
				if (/[A-Za-z0-9_*/().؟?!:؛،,]/.test(arabic)) errors.push(`${where} arabic has punctuation/Latin`);
				if (/[گچ]/.test(arabic)) errors.push(`${where} uses چ/گ (standard letters only)`);
				if (/[ء-ي]/.test(translit)) errors.push(`${where} transliteration has Arabic`);
				if (english.split(' ').length > 3 || /[;,/()]/.test(english)) errors.push(`${where} english must be 1–3 plain words`);
				const key = english.toLowerCase().replace(/^(to|a|an|the) /, '');
				if (seenEnglish.has(key)) errors.push(`${where} duplicate meaning "${english}"`);
				if (seenArabic.has(arabic)) errors.push(`${where} duplicate arabic "${arabic}"`);
				seenEnglish.add(key);
				seenArabic.add(arabic);
				rows.push({
					id: randomUUID(),
					arabic_word: arabic,
					english_word: english,
					transliterated_word: translit,
					dialect,
					category,
					source: 'claude-authored'
				});
			});
	}
	return { rows, errors };
}

async function main() {
	const dialects = only ? [only] : DIALECTS;
	const all: Row[] = [];
	let failed = false;
	for (const dialect of dialects) {
		const { rows, errors } = parse(dialect);
		const byCategory = new Map<string, number>();
		rows.forEach((r) => byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + 1));
		console.log(`${dialect}: ${rows.length} words`, Object.fromEntries(byCategory));
		errors.forEach((e) => console.error(`  ✗ ${e}`));
		if (errors.length) failed = true;
		all.push(...rows);
	}
	if (failed) process.exit(1);
	if (dryRun) {
		console.log('Dry run — nothing written.');
		return;
	}

	const url = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) throw new Error('PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
	const supabase = createClient(url, key);
	for (let i = 0; i < all.length; i += 200) {
		const { error } = await supabase
			.from('word')
			.upsert(all.slice(i, i + 200), { onConflict: 'arabic_word,english_word,dialect,category', ignoreDuplicates: true });
		if (error) throw error;
	}
	console.log(`Upserted ${all.length} words.`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
