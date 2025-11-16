#!/usr/bin/env node
/**
 * Populate Word Table from API Endpoints and Local Data
 * 
 * This script:
 * 1. Fetches words from API endpoints for Egyptian, Darija, and Fusha dialects
 * 2. Imports common words from local data
 * 3. Inserts all words into the word table
 * 
 * Usage:
 *   npm run populate:words
 *   npm run populate:words -- --dry-run  (preview without inserting)
 *   npm run populate:words -- --dialect=egyptian-arabic  (only specific dialect)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const API_URL = 'https://egyptian-arabic-vocab-selmetwa.koyeb.app';
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface ApiWord {
  english: string;
  arabic: string;
  transliteration: string;
  audioUrl?: string;
}

interface WordToInsert {
  id: string;
  arabic_word: string;
  english_word: string;
  transliterated_word: string;
  dialect: string;
  category: string;
  audio_url?: string;
  frequency?: number;
  source: string;
}

interface Section {
  name: string;
  path: string;
  count: number;
  isPaywalled: boolean;
  useLocalData?: boolean;
}

// Dialect API path mapping
const dialectApiPaths: Record<string, string> = {
  'egyptian-arabic': 'egyptian',
  'darija': 'darija',
  'fusha': 'modern-standard-arabic'
};

async function fetchWordsFromApi(dialect: string, sectionPath: string): Promise<ApiWord[]> {
  const apiPath = dialectApiPaths[dialect];
  if (!apiPath) {
    throw new Error(`Unknown dialect: ${dialect}`);
  }

  const url = `${API_URL}/vocab/${apiPath}/${sectionPath}`;
  console.log(`  Fetching: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ApiWord[] = await response.json();
    
    // Some APIs return extra elements, slice them out (as done in the app)
    if (data.length > 2) {
      return data.slice(1, data.length - 1);
    }
    
    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ❌ Error fetching ${url}:`, message);
    return [];
  }
}

async function insertWords(words: WordToInsert[], dryRun: boolean): Promise<{ inserted: number; skipped: number; errors: number }> {
  if (words.length === 0) {
    return { inserted: 0, skipped: 0, errors: 0 };
  }

  if (dryRun) {
    console.log(`  Would insert ${words.length} words`);
    return { inserted: 0, skipped: 0, errors: 0 };
  }

  // Insert in batches to avoid overwhelming the database
  const batchSize = 100;
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('word')
        .upsert(batch, {
          onConflict: 'arabic_word,english_word,dialect,category',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error(`  ❌ Batch error:`, error.message);
        errors += batch.length;
      } else {
        // Count how many were actually inserted vs skipped
        const insertedCount = data?.length || 0;
        inserted += insertedCount;
        skipped += (batch.length - insertedCount);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`  ❌ Batch insert error:`, message);
      errors += batch.length;
    }
  }

  return { inserted, skipped, errors };
}

async function processSection(
  dialect: string,
  section: Section,
  dryRun: boolean
): Promise<{ words: number; inserted: number; skipped: number; errors: number }> {
  console.log(`\n📂 Processing: ${section.name} (${dialect})`);

  let wordsToInsert: WordToInsert[] = [];

  if (section.useLocalData && dialect === 'egyptian-arabic' && section.path === 'most_common') {
    // Import common words from local file
    try {
      let commonWordsModule;
      try {
        commonWordsModule = await import('../src/lib/constants/common-words.js');
      } catch {
        commonWordsModule = await import('../src/lib/constants/common-words.ts');
      }
      
      const commonWords = commonWordsModule.commonWords || [];
      
      interface CommonWord {
        _id?: string;
        word: string;
        en: string;
        franco: string;
        appeared?: number;
      }
      
      wordsToInsert = commonWords.map((word: CommonWord) => ({
        id: word._id || uuidv4(),
        arabic_word: word.word,
        english_word: word.en,
        transliterated_word: word.franco,
        dialect: 'egyptian-arabic',
        category: 'most_common',
        frequency: word.appeared,
        source: 'common_words'
      }));

      console.log(`  ✅ Loaded ${wordsToInsert.length} common words from local data`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`  ❌ Error loading common words:`, message);
      return { words: 0, inserted: 0, skipped: 0, errors: 0 };
    }
  } else {
    // Fetch from API
    const apiWords = await fetchWordsFromApi(dialect, section.path);
    
    if (apiWords.length === 0) {
      console.log(`  ⚠️  No words fetched`);
      return { words: 0, inserted: 0, skipped: 0, errors: 0 };
    }

    wordsToInsert = apiWords.map((word) => ({
      id: uuidv4(),
      arabic_word: word.arabic,
      english_word: word.english,
      transliterated_word: word.transliteration,
      dialect: dialect,
      category: section.path,
      audio_url: word.audioUrl,
      source: 'api'
    }));

    console.log(`  ✅ Fetched ${wordsToInsert.length} words from API`);
  }

  const result = await insertWords(wordsToInsert, dryRun);
  
  if (!dryRun) {
    console.log(`  📊 Inserted: ${result.inserted}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
  }

  return {
    words: wordsToInsert.length,
    inserted: result.inserted,
    skipped: result.skipped,
    errors: result.errors
  };
}

async function populateAllWords(dryRun: boolean = false, specificDialect?: string) {
  console.log('🔄 Starting word population...');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (will insert into database)'}`);
  console.log('');

  // Import section definitions
  let egyptianSections: Section[] = [];
  let darijaSections: Section[] = [];
  let fushaSections: Section[] = [];

  try {
    // Try with .js extension first (for TypeScript compiled output)
    const sectionsModule = await import('../src/lib/constants/sections.js');
    egyptianSections = sectionsModule.sections || [];
  } catch (error: unknown) {
    try {
      // Fallback to .ts extension
      const sectionsModule = await import('../src/lib/constants/sections.ts');
      egyptianSections = sectionsModule.sections || [];
    } catch (fallbackError: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error loading Egyptian sections:', message);
    }
  }

  try {
    const darijaModule = await import('../src/lib/constants/darija-sections.js');
    darijaSections = darijaModule.darijaSections || [];
  } catch (error: unknown) {
    try {
      const darijaModule = await import('../src/lib/constants/darija-sections.ts');
      darijaSections = darijaModule.darijaSections || [];
    } catch (fallbackError: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error loading Darija sections:', message);
    }
  }

  try {
    const fushaModule = await import('../src/lib/constants/fusha-sections.js');
    fushaSections = fushaModule.fushaSections || [];
  } catch (error: unknown) {
    try {
      const fushaModule = await import('../src/lib/constants/fusha-sections.ts');
      fushaSections = fushaModule.fushaSections || [];
    } catch (fallbackError: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error loading Fusha sections:', message);
    }
  }

  const dialects: Array<{ name: string; sections: Section[] }> = [];

  if (!specificDialect || specificDialect === 'egyptian-arabic') {
    dialects.push({ name: 'egyptian-arabic', sections: egyptianSections });
  }
  if (!specificDialect || specificDialect === 'darija') {
    dialects.push({ name: 'darija', sections: darijaSections });
  }
  if (!specificDialect || specificDialect === 'fusha') {
    dialects.push({ name: 'fusha', sections: fushaSections });
  }

  let totalWords = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const dialect of dialects) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🌍 Dialect: ${dialect.name.toUpperCase()}`);
    console.log(`   Sections: ${dialect.sections.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const section of dialect.sections) {
      const result = await processSection(dialect.name, section, dryRun);
      
      totalWords += result.words;
      totalInserted += result.inserted;
      totalSkipped += result.skipped;
      totalErrors += result.errors;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 Summary:');
  console.log(`   Total words processed: ${totalWords}`);
  console.log(`   ✅ Inserted: ${totalInserted}`);
  console.log(`   ⏭️  Skipped (duplicates): ${totalSkipped}`);
  console.log(`   ❌ Errors: ${totalErrors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (dryRun && totalWords > 0) {
    console.log('\n💡 Run without --dry-run to insert these words');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dialectArg = args.find(arg => arg.startsWith('--dialect='));
const specificDialect = dialectArg ? dialectArg.split('=')[1] : undefined;

// Run population
populateAllWords(dryRun, specificDialect)
  .then(() => {
    console.log('\n✅ Population completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Population failed:', error);
    process.exit(1);
  });

