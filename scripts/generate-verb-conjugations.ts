#!/usr/bin/env node
/**
 * Generate Verb Conjugation Data using Gemini AI
 *
 * Uses the static Egyptian Arabic verb list from verb-data-egyptian.ts,
 * generates all 32 conjugations per verb using Gemini, and saves
 * static JSON files to src/lib/data/verb-conjugations/egyptian-arabic/
 *
 * Usage:
 *   vite-node scripts/generate-verb-conjugations.ts
 *   vite-node scripts/generate-verb-conjugations.ts -- --dry-run
 *   vite-node scripts/generate-verb-conjugations.ts -- --verb=katab  (single verb)
 */

import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { egyptianArabicVerbs } from './verb-data-egyptian.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

// --- Config ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is required');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const OUTPUT_DIR = join(__dirname, '..', 'src', 'lib', 'data', 'verb-conjugations', 'egyptian-arabic');

// --- Zod Schema ---
const conjugationEntrySchema = z.object({
  person: z.enum(['ana', 'enta', 'enti', 'howa', 'heya', 'ehna', 'entu', 'homma']),
  arabic: z.string(),
  transliteration: z.string(),
  english: z.string()
});

const conjugationSetSchema = z.object({
  affirmative: z.array(conjugationEntrySchema).length(8),
  negative: z.array(conjugationEntrySchema).length(8)
});

const objectPronounEntrySchema = z.object({
  object: z.enum(['me', 'you_m', 'you_f', 'him_it', 'her_it', 'us', 'you_pl', 'them']),
  suffix: z.string(),
  arabic: z.string(),
  transliteration: z.string(),
  english: z.string()
});

const verbConjugationResponseSchema = z.object({
  rootLetters: z.string(),
  verbClass: z.enum(['sound', 'hollow', 'defective', 'irregular', 'doubled']),
  notes: z.string(),
  conjugations: z.object({
    past: conjugationSetSchema,
    present: conjugationSetSchema,
    future: conjugationSetSchema
  }),
  objectPronouns: z.array(objectPronounEntrySchema).length(8)
});

const jsonSchema = zodToJsonSchema(verbConjugationResponseSchema);

// --- Helpers ---

/**
 * Strip database transliteration codes and normalize to simple latin romanization.
 * e.g. "i3táraf [8s1]" → "i3taraf"
 *      "rāɧ [1h1] má3a" → "rah ma3a"
 */
function cleanTransliteration(raw: string): string {
  return raw
    .replace(/\[.*?\]/g, '')          // remove [bracket codes]
    .replace(/[āàáâä]/g, 'a')         // normalize a variants
    .replace(/[ēèéêë]/g, 'e')         // normalize e variants
    .replace(/[īìíîï]/g, 'i')         // normalize i variants
    .replace(/[ōòóôö]/g, 'o')         // normalize o variants
    .replace(/[ūùúûü]/g, 'u')         // normalize u variants
    .replace(/ɧ/g, 'h')               // ɧ → h
    .replace(/ɣ/g, 'gh')              // ɣ → gh
    .replace(/[ṭṭ]/g, 't')            // emphatic t
    .replace(/[ḍ]/g, 'd')             // emphatic d
    .replace(/[ṣ]/g, 's')             // emphatic s
    .replace(/[ẓ]/g, 'z')             // emphatic z
    .replace(/[ḥ]/g, 'h')             // pharyngeal h
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim();
}

function toSlug(transliteration: string, wordId: string, existingSlugs: Set<string>): string {
  let slug = cleanTransliteration(transliteration)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (existingSlugs.has(slug)) {
    slug = `${slug}-${wordId.slice(0, 6)}`;
  }
  return slug;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonSafe(text: string) {
  const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(clean);
}

async function generateConjugations(
  arabicWord: string,
  englishWord: string,
  rawTransliteration: string
) {
  const cleanedTranslit = cleanTransliteration(rawTransliteration);

  const prompt = `Generate complete Egyptian Arabic (colloquial, not MSA) conjugation data for the verb:
Arabic: ${arabicWord}
English: ${englishWord}
Base transliteration (for reference only): ${cleanedTranslit}

═══════════════════════════════════════════════
PRONOUNS — use these EXACT keys in EXACT order:
  ana   (أنا  - I)
  enta  (إنتَ - you m)
  enti  (إنتِ - you f)
  howa  (هو   - he)
  heya  (هي   - she)
  ehna  (إحنا - we)
  entu  (إنتوا - you pl)
  homma (همّ  - they)

═══════════════════════════════════════════════
1. PAST TENSE (suffix pattern):
   Affirmative — attach suffix to verb stem:
     ana   → stem + t    (e.g. katabt)
     enta  → stem + t    (e.g. katabt)
     enti  → stem + ti   (e.g. katibti)
     howa  → bare stem   (e.g. katab)
     heya  → stem + it   (e.g. katbit)
     ehna  → stem + na   (e.g. katabna)
     entu  → stem + tu   (e.g. katabtuu)
     homma → stem + u    (e.g. katabu)
   Negative — ma + verb + sh circumfix:
     (e.g. ma katabtish, ma katabtish, ma katibtish, ma katabsh, ma katbitsh, ma katabnaش, ma katabtush, ma katabush)

2. PRESENT TENSE — habitual/ongoing (b- prefix + imperfect stem):
   Subject prefixes for the imperfect stem:
     ana   → a-    (aktib)
     enta  → ti-   (tiktib)
     enti  → ti-…-i (tiktibi)
     howa  → yi-   (yiktib)
     heya  → ti-   (tiktib)
     ehna  → ni-   (niktib)
     entu  → ti-…-u (tiktibu)
     homma → yi-…-u (yiktibu)
   Affirmative — add b- before the imperfect prefix:
     ana baktib, enta btiktib, enti btiktibi, howa biyiktib, heya btiktib, ehna bniktib, entu btiktibu, homma biyiktibu
   Negative — ma + b-prefixed-verb + sh:
     (e.g. mabaktibsh, mabtiktibsh, mabtiktibiish, mabiyiktibsh, mabtiktibsh, mabniktibsh, mabtiktibuush, mabiyiktibuush)

3. FUTURE TENSE (ha- prefix + bare imperfect stem, NO b-):
   Affirmative:
     ana ha-aktib → haaktib, enta ha-tiktib → hatiktib, enti ha-tiktibi → hatiktibi,
     howa ha-yiktib → hayiktib, heya ha-tiktib → hatiktib, ehna ha-niktib → haniktib,
     entu ha-tiktibu → hatiktibu, homma ha-yiktibu → hayiktibu
   Negative — mish + future form:
     (e.g. mish haaktib, mish hatiktib, mish hatiktibi, mish hayiktib, ...)

4. OBJECT PRONOUNS — suffixes attached to the verb (show using howa past tense as base):
   These are the 8 object pronoun suffixes. For each, show:
   - suffix: the romanized suffix only (e.g. -ni, -ak, -ik, -u, -ha, -na, -ku, -hum)
   - arabic: the full Arabic word (base verb + suffix, e.g. كتبني)
   - transliteration: the full form (e.g. katabni)
   - english: "he [english meaning]ed me / you / him / etc."
   Objects in EXACT order: me, you_m, you_f, him_it, her_it, us, you_pl, them

═══════════════════════════════════════════════
TRANSLITERATION RULES (CRITICAL — apply to every transliteration field):
  * Use ONLY plain ASCII letters plus:
      3 for ع  (e.g. 3amal, ma3a, i3taraf)
      7 for ح  (e.g. 7asal, ro7, ba7r)
      gh for غ  kh for خ  sh for ش  (e.g. ghali, kharag, shaf)
  * NO diacritics, NO accents, NO special Unicode (no ā á ɧ ɣ ṭ ḥ etc.)
  * NO brackets, codes, or non-ASCII characters
  * Correct examples: katab, biyiktib, ma katabtish, mabaktibsh, rah, i3taraf, 7asal, ghawi

═══════════════════════════════════════════════
OTHER FIELDS:
- verbClass: one of: sound, hollow, defective, irregular, doubled
- notes: one sentence on any irregularities or the verb pattern
- rootLetters: Arabic root letters separated by spaces (e.g. "ك ت ب")
- english in each conjugation entry: full English translation with pronoun
  (e.g. "I wrote", "you (m) wrote", "you (f) wrote", "he wrote", "she wrote", "we wrote", "you (pl) wrote", "they wrote")`;

  const schemaString = JSON.stringify(jsonSchema, null, 2);
  const fullPrompt = `${prompt}

CRITICAL: Return a valid JSON object exactly matching this schema:
${schemaString}

Return PURE JSON only. No markdown code blocks. No explanations.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: fullPrompt,
    // @ts-expect-error - generationConfig types may be outdated
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseJsonSchema: jsonSchema
    }
  });

  const text = response.text;
  if (!text) throw new Error('No content from Gemini');

  const parsed = parseJsonSafe(text);
  return verbConjugationResponseSchema.parse(parsed);
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbArg = args.find((a) => a.startsWith('--verb='));
  const specificVerb = verbArg ? verbArg.split('=')[1] : undefined;

  console.log('🔄 Verb conjugation generator');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (specificVerb) console.log(`Verb filter: ${specificVerb}`);
  console.log('');

  const allVerbs = egyptianArabicVerbs;
  console.log(`✅ Loaded ${allVerbs.length} verbs from static list`);

  if (!dryRun) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Build slug map for collision detection
  const existingSlugs = new Set<string>();
  const indexEntries: Array<{
    slug: string;
    arabic: string;
    transliteration: string;
    english: string;
    wordId: string;
    rootLetters: string;
    verbClass: string;
  }> = [];

  // Load existing index if present (for incremental runs)
  const indexPath = join(OUTPUT_DIR, 'index.json');
  if (existsSync(indexPath)) {
    try {
      const existing = JSON.parse(readFileSync(indexPath, 'utf-8'));
      for (const v of existing.verbs || []) {
        existingSlugs.add(v.slug);
      }
    } catch {
      // ignore parse errors on existing index
    }
  }

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  const verbsToProcess = specificVerb
    ? allVerbs.filter((w) => {
        const slug = toSlug(w.transliterated_word, w.id, new Set());
        const cleaned = cleanTransliteration(w.transliterated_word).toLowerCase();
        return slug === specificVerb || cleaned === specificVerb;
      })
    : allVerbs;

  for (const word of verbsToProcess) {
    const slug = toSlug(word.transliterated_word, word.id, existingSlugs);
    existingSlugs.add(slug);

    const filePath = join(OUTPUT_DIR, `${slug}.json`);

    if (!specificVerb && existsSync(filePath)) {
      console.log(`⏭️  Skipping ${slug} (already exists)`);
      // Load existing for index
      try {
        const existing = JSON.parse(readFileSync(filePath, 'utf-8'));
        indexEntries.push({
          slug: existing.slug,
          arabic: existing.arabic,
          transliteration: existing.transliteration,
          english: existing.english,
          wordId: word.id,
          rootLetters: existing.rootLetters,
          verbClass: existing.verbClass
        });
      } catch {
        // ignore
      }
      skipped++;
      continue;
    }

    console.log(`\n📖 Processing: ${word.arabic_word} (${word.english_word}) → ${slug}`);

    if (dryRun) {
      console.log(`  Would generate conjugations and write to ${filePath}`);
      processed++;
      continue;
    }

    try {
      const result = await generateConjugations(
        word.arabic_word,
        word.english_word,
        word.transliterated_word
      );

      const verbData = {
        slug,
        arabic: word.arabic_word,
        transliteration: cleanTransliteration(word.transliterated_word),
        english: word.english_word,
        wordId: word.id,
        rootLetters: result.rootLetters,
        verbClass: result.verbClass,
        notes: result.notes,
        conjugations: result.conjugations
      };

      writeFileSync(filePath, JSON.stringify(verbData, null, 2), 'utf-8');
      console.log(`  ✅ Written: ${filePath}`);

      indexEntries.push({
        slug,
        arabic: word.arabic_word,
        transliteration: cleanTransliteration(word.transliterated_word),
        english: word.english_word,
        wordId: word.id,
        rootLetters: result.rootLetters,
        verbClass: result.verbClass
      });

      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ Error generating ${slug}:`, msg);
      errors++;
    }

    // Rate limit protection
    await sleep(600);
  }

  // Write index.json
  if (!dryRun && indexEntries.length > 0) {
    const indexData = {
      dialect: 'egyptian-arabic',
      generatedAt: new Date().toISOString(),
      verbs: indexEntries.sort((a, b) => a.english.localeCompare(b.english))
    };
    writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
    console.log(`\n✅ Written index.json (${indexEntries.length} verbs)`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 Summary:');
  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ⏭️  Skipped (existing): ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
