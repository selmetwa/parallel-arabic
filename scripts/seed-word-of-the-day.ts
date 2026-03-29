#!/usr/bin/env node
/**
 * Seed Word of the Day Table
 *
 * Pulls 100 words per dialect from the word table and schedules them as
 * daily featured words. Each day gets one word per dialect (4 rows/day),
 * so every user sees a word in their own target dialect every day.
 *
 * Words are selected by preferring those with audio_url, then ordered by
 * frequency desc (most common/useful words first).
 *
 * Starts from the day after the latest existing entry (or today if the table
 * is empty), so it's safe to run multiple times — it won't overwrite anything.
 *
 * Usage:
 *   npm run seed:wotd
 *   npm run seed:wotd -- --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });


const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const isDryRun = process.argv.includes('--dry-run');
const WORDS_PER_DIALECT = 100;

const DIALECTS = [
  { key: 'egyptian-arabic', label: 'Egyptian' },
  { key: 'levantine',       label: 'Levantine' },
  { key: 'darija',          label: 'Moroccan' },
  { key: 'fusha',           label: 'Fusha' },
] as const;

/** Format a Date as YYYY-MM-DD (UTC) */
function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Add N days to a date, returns a new Date */
function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

async function fetchWordsForDialect(dialect: string): Promise<{ arabic: string; transliteration: string; english: string; audio_url: string | null }[]> {
  const { data, error } = await supabase
    .from('word')
    .select('arabic_word, english_word, transliterated_word, audio_url, frequency')
    .eq('dialect', dialect)
    .order('audio_url', { ascending: false, nullsFirst: false })
    .order('frequency', { ascending: false, nullsFirst: false })
    .limit(WORDS_PER_DIALECT * 3);

  if (error) {
    console.error(`❌ Error fetching words for ${dialect}:`, error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.warn(`⚠️  No words found for dialect: ${dialect}`);
    return [];
  }

  const seen = new Set<string>();
  const unique = data.filter(w => {
    if (seen.has(w.arabic_word)) return false;
    seen.add(w.arabic_word);
    return true;
  });

  const words = unique.slice(0, WORDS_PER_DIALECT).map(w => ({
    arabic: w.arabic_word,
    transliteration: w.transliterated_word,
    english: w.english_word,
    audio_url: w.audio_url ?? null,
  }));

  console.log(`  ✓ ${dialect}: fetched ${words.length} words (${words.filter(w => w.audio_url).length} with audio)`);
  return words;
}

async function getNextStartDate(): Promise<Date> {
  const { data, error } = await supabase
    .from('word_of_the_day')
    .select('display_date')
    .order('display_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('❌ Error checking existing word_of_the_day entries:', error.message);
    process.exit(1);
  }

  if (!data) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
  }

  const latest = new Date(data.display_date + 'T00:00:00Z');
  return addDays(latest, 1);
}

async function main() {
  console.log(`\n🌟 Word of the Day Seeder${isDryRun ? ' (DRY RUN)' : ''}\n`);

  const startDate = await getNextStartDate();
  console.log(`📅 Starting from: ${toDateStr(startDate)}\n`);

  console.log('📥 Fetching words from word table...');
  const wordsByDialect: { arabic: string; transliteration: string; english: string; audio_url: string | null }[][] = [];

  for (const dialect of DIALECTS) {
    const words = await fetchWordsForDialect(dialect.key);
    wordsByDialect.push(words);
  }

  // One word per dialect per day. Total days = min words across all dialects.
  const numDays = Math.min(...wordsByDialect.map(w => w.length));
  console.log(`\n📊 Days to schedule: ${numDays} (${numDays * DIALECTS.length} total rows, ${DIALECTS.length} dialects/day)`);
  console.log(`📅 Date range: ${toDateStr(startDate)} → ${toDateStr(addDays(startDate, numDays - 1))}\n`);

  // Build rows: for each day, one row per dialect
  const rows: {
    arabic: string;
    transliteration: string;
    english: string;
    audio_url: string | null;
    dialect: string;
    display_date: string;
    example_egyptian: null;
    example_levantine: null;
    example_darija: null;
    example_fusha: null;
  }[] = [];

  for (let i = 0; i < numDays; i++) {
    const dateStr = toDateStr(addDays(startDate, i));
    for (let d = 0; d < DIALECTS.length; d++) {
      rows.push({
        arabic: wordsByDialect[d][i].arabic,
        transliteration: wordsByDialect[d][i].transliteration,
        english: wordsByDialect[d][i].english,
        audio_url: wordsByDialect[d][i].audio_url,
        dialect: DIALECTS[d].key,
        display_date: dateStr,
        example_egyptian: null,
        example_levantine: null,
        example_darija: null,
        example_fusha: null,
      });
    }
  }

  if (isDryRun) {
    console.log('🔍 Sample entries (first 8):');
    rows.slice(0, 8).forEach(r => {
      console.log(`  ${r.display_date}  [${r.dialect}]  ${r.arabic} — ${r.english}${r.audio_url ? ' 🔊' : ''}`);
    });
    console.log(`\n✅ Dry run complete. ${rows.length} entries would be inserted.`);
    return;
  }

  // Insert in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('word_of_the_day')
      .insert(batch);

    if (error) {
      if (error.code === '23505') {
        console.warn(`  ⚠️  Batch ${Math.floor(i / BATCH_SIZE) + 1}: some entries already exist, inserting one-by-one...`);
        for (const row of batch) {
          const { error: rowError } = await supabase.from('word_of_the_day').insert(row);
          if (rowError?.code === '23505') {
            skipped++;
          } else if (rowError) {
            console.error(`  ❌ Failed to insert ${row.display_date} [${row.dialect}]:`, rowError.message);
          } else {
            inserted++;
          }
        }
      } else {
        console.error(`  ❌ Batch error:`, error.message);
        process.exit(1);
      }
    } else {
      inserted += batch.length;
      process.stdout.write(`  ✓ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rows.length / BATCH_SIZE)} (${inserted} total)\r`);
    }
  }

  console.log(`\n\n✅ Done!`);
  console.log(`   Inserted: ${inserted}`);
  if (skipped > 0) console.log(`   Skipped (already existed): ${skipped}`);
  console.log(`   Date range: ${rows[0].display_date} → ${rows[rows.length - 1].display_date}`);
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
