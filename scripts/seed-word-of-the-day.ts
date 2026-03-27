#!/usr/bin/env node
/**
 * Seed Word of the Day Table
 *
 * Pulls 100 words per dialect from the word table and schedules them as
 * daily featured words. Dialects are interleaved so users see variety each day:
 *   Egyptian → Levantine → Moroccan → Fusha → Egyptian → ...
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
  // Fetch more than we need so we can deduplicate arabic words cleanly
  const { data, error } = await supabase
    .from('word')
    .select('arabic_word, english_word, transliterated_word, audio_url, frequency')
    .eq('dialect', dialect)
    .order('audio_url', { ascending: false, nullsFirst: false }) // words with audio first
    .order('frequency', { ascending: false, nullsFirst: false }) // then most frequent
    .limit(WORDS_PER_DIALECT * 3); // overfetch to allow dedup

  if (error) {
    console.error(`❌ Error fetching words for ${dialect}:`, error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.warn(`⚠️  No words found for dialect: ${dialect}`);
    return [];
  }

  // Deduplicate by arabic_word (some dialects may have repeated entries)
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
    // Table is empty — start from today
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
  }

  // Start the day after the latest entry
  const latest = new Date(data.display_date + 'T00:00:00Z');
  return addDays(latest, 1);
}

async function main() {
  console.log(`\n🌟 Word of the Day Seeder${isDryRun ? ' (DRY RUN)' : ''}\n`);

  // 1. Find start date
  const startDate = await getNextStartDate();
  console.log(`📅 Starting from: ${toDateStr(startDate)}\n`);

  // 2. Fetch words for each dialect
  console.log('📥 Fetching words from word table...');
  const wordsByDialect: { arabic: string; transliteration: string; english: string; audio_url: string | null }[][] = [];

  for (const dialect of DIALECTS) {
    const words = await fetchWordsForDialect(dialect.key);
    wordsByDialect.push(words);
  }

  // 3. Interleave: Egyptian[0], Levantine[0], Moroccan[0], Fusha[0], Egyptian[1], ...
  const interleaved: { arabic: string; transliteration: string; english: string; audio_url: string | null; dialect: string }[] = [];
  const maxWords = Math.max(...wordsByDialect.map(w => w.length));

  for (let i = 0; i < maxWords; i++) {
    for (let d = 0; d < DIALECTS.length; d++) {
      if (i < wordsByDialect[d].length) {
        interleaved.push({ ...wordsByDialect[d][i], dialect: DIALECTS[d].label });
      }
    }
  }

  console.log(`\n📊 Total words to schedule: ${interleaved.length}`);
  console.log(`📅 Date range: ${toDateStr(startDate)} → ${toDateStr(addDays(startDate, interleaved.length - 1))}\n`);

  // 4. Build insert rows
  const rows = interleaved.map((word, i) => ({
    arabic: word.arabic,
    transliteration: word.transliteration,
    english: word.english,
    audio_url: word.audio_url,
    display_date: toDateStr(addDays(startDate, i)),
    example_egyptian: null,
    example_levantine: null,
    example_darija: null,
    example_fusha: null,
  }));

  if (isDryRun) {
    console.log('🔍 Sample entries (first 8):');
    rows.slice(0, 8).forEach(r => {
      console.log(`  ${r.display_date}  [${interleaved[rows.indexOf(r)].dialect}]  ${r.arabic} — ${r.english}${r.audio_url ? ' 🔊' : ''}`);
    });
    console.log(`\n✅ Dry run complete. ${rows.length} entries would be inserted.`);
    return;
  }

  // 5. Insert in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('word_of_the_day')
      .insert(batch);

    if (error) {
      // display_date has a UNIQUE constraint — skip duplicates gracefully
      if (error.code === '23505') {
        console.warn(`  ⚠️  Batch ${Math.floor(i / BATCH_SIZE) + 1}: some dates already exist, inserting one-by-one...`);
        for (const row of batch) {
          const { error: rowError } = await supabase.from('word_of_the_day').insert(row);
          if (rowError?.code === '23505') {
            skipped++;
          } else if (rowError) {
            console.error(`  ❌ Failed to insert ${row.display_date}:`, rowError.message);
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
