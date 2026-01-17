import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { normalizeArabicText } from '$lib/utils/arabic-normalization';

// Schema for word completion - single word object (not wrapped in words array)
const wordCompletionSchema = z.object({
  arabic: z.string().optional(),
  english: z.string().optional(),
  transliteration: z.string().optional(),
  dialect: z.enum(['egyptian-arabic', 'fusha', 'levantine', 'darija']).optional()
});

// Column name mappings - handle variations
const columnMappings: Record<string, string> = {
  // Arabic variations
  'arabic': 'arabic',
  'arabic_word': 'arabic',
  'arabic_text': 'arabic',
  'arabic text': 'arabic',
  'عربي': 'arabic',
  
  // English variations
  'english': 'english',
  'english_word': 'english',
  'english text': 'english',
  'translation': 'english',
  'meaning': 'english',
  
  // Transliteration variations
  'transliteration': 'transliteration',
  'transliterated': 'transliteration',
  'transliterated_word': 'transliteration',
  'pronunciation': 'transliteration',
  'phonetic': 'transliteration',
  
  // Dialect variations
  'dialect': 'dialect',
  'language': 'dialect',
  'variant': 'dialect'
};

function normalizeColumnName(name: string): string | null {
  const normalized = name.toLowerCase().trim().replace(/[_\s-]/g, '_');
  
  // Direct match
  if (columnMappings[normalized]) {
    return columnMappings[normalized];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(columnMappings)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Checks if text contains Arabic characters
 */
function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Detects if the file is structured CSV (has headers with column names) or unstructured text
 */
function isStructuredCSV(text: string): boolean {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return false;
  
  const firstLine = lines[0].toLowerCase();
  // Check if first line looks like CSV headers (contains common column name patterns)
  const hasCSVHeaders = /(arabic|english|transliteration|dialect|translation|meaning)/.test(firstLine) ||
                        firstLine.split(',').length >= 2; // Multiple comma-separated values
  
  // Also check if it has multiple columns (commas with quoted or unquoted values)
  const hasMultipleColumns = firstLine.includes(',') && 
                            (firstLine.split(',').length >= 2);
  
  return hasCSVHeaders || hasMultipleColumns;
}

/**
 * Parses unstructured text file - extracts lines that contain Arabic characters
 * Lines without Arabic are ignored
 */
function parseUnstructuredText(text: string): Array<Record<string, string>> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const rows: Array<Record<string, string>> = [];
  
  for (const line of lines) {
    // Skip lines that don't contain Arabic characters
    if (!containsArabic(line)) {
      continue;
    }
    
    // Try to detect if line has multiple parts (e.g., "word1, word2" or "word1 | word2")
    const parts = line.split(/[,|;]/).map(p => p.trim()).filter(p => p.length > 0);
    
    if (parts.length > 1) {
      // Multiple parts - try to identify which is Arabic, English, transliteration
      let arabic = '';
      let english = '';
      let transliteration = '';
      
      for (const part of parts) {
        if (containsArabic(part)) {
          arabic = part;
        } else if (isTransliteration(part)) {
          transliteration = part;
        } else {
          english = part;
        }
      }
      
      // If we found Arabic, create a row
      if (arabic) {
        rows.push({
          arabic: arabic,
          english: english || '',
          transliteration: transliteration || ''
        });
      }
    } else {
      // Single part - assume it's Arabic (since we already checked it contains Arabic)
      rows.push({
        arabic: line,
        english: '',
        transliteration: ''
      });
    }
  }
  
  return rows;
}

function parseCSV(csvText: string): Array<Record<string, string>> {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  // Simple CSV parser that handles quoted fields
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }
  
  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.replace(/^"|"$/g, ''));
  
  // Map headers to normalized names
  const columnMap: Record<number, string> = {};
  headers.forEach((header, index) => {
    const normalized = normalizeColumnName(header);
    if (normalized) {
      columnMap[index] = normalized;
    }
  });
  
  // Parse rows
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
    const row: Record<string, string> = {};
    
    values.forEach((value, index) => {
      const columnName = columnMap[index];
      if (columnName && value) {
        row[columnName] = value;
      }
    });
    
    // Only add row if it has at least arabic or english
    if (row.arabic || row.english) {
      rows.push(row);
    }
  }
  
  return rows;
}

function normalizeDialect(dialect: string): string {
  const normalized = dialect.toLowerCase().trim();
  const dialectMap: Record<string, string> = {
    'egyptian': 'egyptian-arabic',
    'egyptian-arabic': 'egyptian-arabic',
    'egyptian arabic': 'egyptian-arabic',
    'masri': 'egyptian-arabic',
    'fusha': 'fusha',
    'msa': 'fusha',
    'modern standard arabic': 'fusha',
    'levantine': 'levantine',
    'levantine arabic': 'levantine',
    'shami': 'levantine',
    'darija': 'darija',
    'moroccan': 'darija',
    'moroccan darija': 'darija'
  };
  
  return dialectMap[normalized] || 'egyptian-arabic';
}

/**
 * Detects if text is transliteration (phonetic spelling) vs English
 * Transliteration typically:
 * - Contains phonetic patterns (like "bayt", "kitaab", "aneeq")
 * - Often all lowercase
 * - Doesn't contain common English words
 * - May contain Arabic-specific phonetic characters
 * - Has double vowels (ee, aa, oo) which are common in transliteration
 */
function isTransliteration(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  
  // If empty, not transliteration
  if (!trimmed) return false;
  
  // Check if it contains Arabic characters - definitely not transliteration
  if (/[\u0600-\u06FF]/.test(trimmed)) return false;
  
  // Split into words
  const words = trimmed.split(/\s+/);
  
  // Common English words that wouldn't appear in transliteration
  const commonEnglishWords = [
    'the', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'this', 'that', 'these', 'those', 'a', 'an', 'and', 'or', 'but', 'if',
    'house', 'car', 'book', 'water', 'food', 'time', 'day', 'night', 'good',
    'bad', 'big', 'small', 'new', 'old', 'man', 'woman', 'child', 'person',
    'in', 'at', 'on', 'to', 'for', 'of', 'with', 'from', 'by', 'about',
    'stylish', 'clothes', 'human', 'animal' // Common English words from examples
  ];
  
  // If it contains common English words, it's likely English
  const hasEnglishWords = words.some(word => 
    commonEnglishWords.some(englishWord => 
      word.toLowerCase() === englishWord.toLowerCase() ||
      word.toLowerCase().startsWith(englishWord.toLowerCase())
    )
  );
  
  if (hasEnglishWords) return false;
  
  // Check each word for transliteration patterns
  for (const word of words) {
    // Double vowels are very common in transliteration (ee, aa, oo, ii, uu)
    if (/(ee|aa|oo|ii|uu)/i.test(word)) {
      // But check if it's a known English word with double vowels
      const englishDoubleVowelWords = ['see', 'bee', 'too', 'zoo', 'food', 'good', 'mood', 'wood'];
      if (!englishDoubleVowelWords.includes(word)) {
        return true; // Likely transliteration
      }
    }
    
    // Arabic-specific consonant clusters
    if (/\b(kh|gh|dh|th|sh|ch|zh|q|3|7|9)\w*/i.test(word)) {
      return true; // Likely transliteration
    }
    
    // Words that are all lowercase, short (3-8 chars), and don't look like English
    if (word.length >= 3 && word.length <= 8 && word === word.toLowerCase()) {
      // Check if it has unusual consonant clusters or vowel patterns for English
      // Transliteration often has patterns like: aneeq, beit, kitaab, fee
      if (/^[a-z]{3,8}$/i.test(word) && !/^(ing|ed|er|ly|tion|sion)$/i.test(word)) {
        // If it ends with common transliteration endings or has transliteration-like patterns
        if (/^(an|al|in|en|ar|ir|ur|ee|aa|oo)/i.test(word) || 
            /(ee|aa|oo|ii|uu)/i.test(word) ||
            /q[^u]/i.test(word) || // 'q' not followed by 'u' (common in transliteration)
            /3|7|9/.test(word)) { // Arabic transliteration numbers
          return true;
        }
      }
    }
  }
  
  // If it's a single short word (1-2 words), all lowercase, and doesn't match English patterns
  if (words.length <= 2 && trimmed === trimmed.toLowerCase()) {
    // Check if any word looks like transliteration
    const looksLikeTransliteration = words.some(word => {
      // Short words with double vowels or Arabic patterns
      return (word.length >= 3 && word.length <= 8 && 
              (/(ee|aa|oo|ii|uu)/i.test(word) || 
               /\b(kh|gh|dh|th|sh|ch|zh|q[^u])\w*/i.test(word) ||
               /3|7|9/.test(word)));
    });
    
    if (looksLikeTransliteration) {
      return true;
    }
  }
  
  // Default: assume it's English if it doesn't match transliteration patterns strongly
  return false;
}

/**
 * Validates and corrects word data - ensures English doesn't contain transliteration
 */
function validateAndCorrectWord(word: {
  arabic: string;
  english: string;
  transliteration: string;
  dialect: string;
}): { arabic: string; english: string; transliteration: string; dialect: string } {
  const englishIsTransliteration = isTransliteration(word.english);
  const transliterationIsEnglish = word.transliteration.trim() && !isTransliteration(word.transliteration);
  
  // If English looks like transliteration
  if (englishIsTransliteration) {
    // If transliteration looks like English, swap them (most common case)
    if (transliterationIsEnglish) {
      return {
        arabic: word.arabic,
        english: word.transliteration, // Use transliteration as English
        transliteration: word.english, // Use English as transliteration
        dialect: word.dialect
      };
    }
    // If transliteration is empty or also looks like transliteration, use English as transliteration
    // Keep English empty so it can be regenerated if needed, but for now we'll keep the word
    // and use English as transliteration (better than losing the word)
    if (!word.transliteration.trim() || isTransliteration(word.transliteration)) {
      return {
        arabic: word.arabic,
        english: word.english, // Keep it for now (might be a valid English word that matches pattern)
        transliteration: word.transliteration.trim() || word.english, // Use English as transliteration if transliteration is empty
        dialect: word.dialect
      };
    }
  }
  
  // If transliteration looks like English and English is empty or also looks like transliteration, swap them
  if (transliterationIsEnglish) {
    if (!word.english.trim() || isTransliteration(word.english)) {
      return {
        arabic: word.arabic,
        english: word.transliteration, // Use transliteration as English
        transliteration: word.english || '', // Use English as transliteration (or empty)
        dialect: word.dialect
      };
    }
  }
  
  return word;
}

async function completeWordWithGemini(
  word: Record<string, string>,
  ai: GoogleGenAI,
  defaultDialect?: string
): Promise<{ arabic: string; english: string; transliteration: string; dialect: string }> {
  const hasArabic = !!word.arabic?.trim();
  const hasEnglish = !!word.english?.trim();
  const hasTransliteration = !!word.transliteration?.trim();
  const hasDialect = !!word.dialect?.trim();
  
  // Normalize dialect if present, otherwise use default dialect
  const normalizedDialect = hasDialect ? normalizeDialect(word.dialect) : (defaultDialect || null);
  
  // If we have all required fields (arabic, english), return them (generate transliteration if missing)
  if (hasArabic && hasEnglish) {
    if (hasTransliteration && normalizedDialect) {
      return {
        arabic: word.arabic.trim(),
        english: word.english.trim(),
        transliteration: word.transliteration.trim(),
        dialect: normalizedDialect
      };
    }
    // Only need to generate transliteration
    if (hasTransliteration) {
      return {
        arabic: word.arabic.trim(),
        english: word.english.trim(),
        transliteration: word.transliteration.trim(),
        dialect: normalizedDialect || defaultDialect || 'egyptian-arabic'
      };
    }
  }
  
  // Build prompt based on what we have
  let prompt = `You are an expert Arabic linguist. Complete this Arabic vocabulary word entry. `;
  
  if (hasArabic && !hasEnglish) {
    prompt += `I have the Arabic word "${word.arabic}". Please provide:\n`;
    prompt += `1. English translation\n`;
    prompt += `2. Transliteration (phonetic spelling using Latin letters only)\n`;
  } else if (hasEnglish && !hasArabic) {
    prompt += `I have the English word "${word.english}". Please provide:\n`;
    prompt += `1. Arabic translation\n`;
    prompt += `2. Transliteration (phonetic spelling using Latin letters only)\n`;
  } else if (hasArabic && hasEnglish && !hasTransliteration) {
    prompt += `I have Arabic "${word.arabic}" and English "${word.english}". Please provide:\n`;
    prompt += `1. Transliteration (phonetic spelling using Latin letters only)\n`;
  }
  
  // Always use the provided dialect (either from CSV or user selection)
  if (normalizedDialect) {
    prompt += `\nThe dialect is: ${normalizedDialect}. Use this dialect.`;
  } else if (defaultDialect) {
    prompt += `\nThe dialect is: ${defaultDialect}. Use this dialect.`;
  }
  
  prompt += `\n\nIMPORTANT:\n`;
  prompt += `- Arabic text should have NO diacritics (no أَ إِ آ etc.)\n`;
  prompt += `- English translation must be actual English words (e.g., "house", "book", "water"), NOT phonetic transliteration\n`;
  prompt += `- Transliteration should use ONLY English alphabet letters for phonetic spelling (e.g., "bayt", "kitaab")\n`;
  prompt += `- Do NOT put transliteration in the English field - English must be real English words\n`;
  prompt += `- Dialect must be one of: egyptian-arabic, fusha, levantine, darija\n`;
  
  // Create schema and include it in the prompt
  const schema = {
    zodSchema: wordCompletionSchema,
    jsonSchema: zodToJsonSchema(wordCompletionSchema)
  };
  
  // Add schema to prompt so Gemini knows exactly what format to return
  prompt += `\n\nReturn a JSON object with this exact structure:\n`;
  prompt += JSON.stringify(schema.jsonSchema, null, 2);
  prompt += `\n\nExample format: {"arabic": "بيت", "english": "house", "transliteration": "bayt", "dialect": "egyptian-arabic"}`;
  
  try {
    const response = await generateContentWithRetry(ai, {
      model: "gemini-3-flash-preview",
      contents: prompt,
      // @ts-expect-error - generationConfig is valid but types may be outdated
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
        responseJsonSchema: schema.jsonSchema
      }
    });
    
    const content = response.text;
    if (!content) {
      throw new Error('No response from Gemini');
    }
    
    const parsed = parseJsonFromGeminiResponse(content, schema.zodSchema);
    
    if (!parsed || !parsed.arabic || !parsed.english) {
      throw new Error('Invalid response from Gemini - missing required fields');
    }
    
    const completedWord = {
      arabic: parsed.arabic.trim(),
      english: parsed.english.trim(),
      transliteration: (parsed.transliteration || word.transliteration || '').trim(),
      dialect: normalizeDialect(parsed.dialect || word.dialect || defaultDialect || 'egyptian-arabic')
    };
    
    // Validate and correct the word to ensure English doesn't contain transliteration
    return validateAndCorrectWord(completedWord);
  } catch (err) {
    console.error('Error completing word with Gemini:', err);
    // Fallback: return what we have with defaults
    const fallbackWord = {
      arabic: (word.arabic || '').trim(),
      english: (word.english || '').trim(),
      transliteration: (word.transliteration || '').trim(),
      dialect: normalizedDialect || defaultDialect || 'egyptian-arabic'
    };
    
    // Validate and correct the fallback word
    return validateAndCorrectWord(fallbackWord);
  }
}

export const POST: RequestHandler = async ({ request, locals }) => {
  // @ts-expect-error - auth property exists at runtime
  const { sessionId, user } = await locals?.auth?.validate() || {};

  if (!sessionId || !user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const apiKey = env['GEMINI_API_KEY'];
  
  if (!apiKey) {
    return error(500, { message: 'GEMINI_API_KEY is not configured' });
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userDialect = formData.get('dialect') as string;
    
    if (!file) {
      return json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!userDialect) {
      return json({ error: 'Dialect is required' }, { status: 400 });
    }
    
    // Normalize and validate dialect
    const normalizedUserDialect = normalizeDialect(userDialect);
    
    // Read file content
    const fileText = await file.text();
    
    // Detect if file is structured CSV or unstructured text
    const isStructured = isStructuredCSV(fileText);
    
    // Parse based on file type
    let rows: Array<Record<string, string>> = [];
    if (isStructured) {
      rows = parseCSV(fileText);
    } else {
      // Unstructured text - extract lines with Arabic
      rows = parseUnstructuredText(fileText);
    }
    
    if (rows.length === 0) {
      if (isStructured) {
        return json({ error: 'No valid rows found in CSV file' }, { status: 400 });
      } else {
        return json({ error: 'No lines with Arabic text found. Please ensure your text file contains Arabic characters.' }, { status: 400 });
      }
    }
    
    const totalRows = rows.length;
    
    // Create a readable stream for Server-Sent Events
    // Capture isStructured in closure for use inside stream
    const fileIsStructured = isStructured;
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendProgress = (current: number, total: number, message?: string) => {
          const data = JSON.stringify({ 
            type: 'progress', 
            current, 
            total, 
            message: message || `${current}/${total} words imported` 
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };
        
        const sendError = (error: string) => {
          const data = JSON.stringify({ type: 'error', error });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.close();
        };
        
        const sendSuccess = (result: { imported: number; skipped: number; message: string }) => {
          const data = JSON.stringify({ type: 'success', ...result });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.close();
        };
        
        try {
    // Complete words with Gemini
    const completedWords: Array<{ arabic: string; english: string; transliteration: string; dialect: string }> = [];
    
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
      try {
              // Use user-provided dialect, but allow CSV dialect column to override if present
              const rowWithDialect = { ...row };
              if (!row.dialect) {
                rowWithDialect.dialect = normalizedUserDialect;
              }
              const completed = await completeWordWithGemini(rowWithDialect, ai, normalizedUserDialect);
        // Validate required fields
        if (completed.arabic && completed.english) {
          completedWords.push(completed);
        }
              // Send progress update
              const message = fileIsStructured 
                ? `${i + 1}/${totalRows} words processed`
                : `${i + 1}/${totalRows} lines with Arabic processed`;
              sendProgress(i + 1, totalRows, message);
      } catch (err) {
        console.error('Error completing word:', err);
              // Still send progress even if word failed
              sendProgress(i + 1, totalRows);
        // Skip this word
      }
    }
    
    if (completedWords.length === 0) {
            sendError('No valid words could be processed');
            return;
    }
    
    // Check for duplicates
    const arabicWords = completedWords.map(w => normalizeArabicText(w.arabic));
    const { data: existingWords } = await supabase
      .from('saved_word')
      .select('arabic_word')
      .eq('user_id', userId)
      .in('arabic_word', arabicWords);
    
    const existingSet = new Set(
      (existingWords || []).map(w => normalizeArabicText(w.arabic_word))
    );
    
    const wordsToImport = completedWords.filter(w => 
      !existingSet.has(normalizeArabicText(w.arabic))
    );
    
    if (wordsToImport.length === 0) {
            sendSuccess({
        imported: 0,
        skipped: completedWords.length,
        message: 'All words are already in your review deck'
      });
            return;
    }
    
    // Insert words
    const savedWordsToInsert = wordsToImport.map(word => ({
      id: uuidv4(),
      user_id: userId,
      arabic_word: normalizeArabicText(word.arabic),
      english_word: word.english.trim(),
      transliterated_word: word.transliteration.trim(),
      dialect: word.dialect,
      ease_factor: 2.5,
      interval_days: 0,
      repetitions: 0,
      is_learning: true,
      mastery_level: 0,
      created_at: Date.now()
    }));
    
    const { data: insertedWords, error: insertError } = await supabase
      .from('saved_word')
      .insert(savedWordsToInsert)
      .select();
    
    if (insertError) {
      console.error('Error importing words:', insertError);
            sendError('Failed to import words');
            return;
    }
    
          sendSuccess({
      imported: insertedWords?.length || 0,
      skipped: completedWords.length - (insertedWords?.length || 0),
      message: `Successfully imported ${insertedWords?.length || 0} word${(insertedWords?.length || 0) !== 1 ? 's' : ''}`
          });
        } catch (err) {
          console.error('Error in import-words-csv endpoint:', err);
          sendError(err instanceof Error ? err.message : 'Failed to process CSV file');
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (err) {
    console.error('Error in import-words-csv endpoint:', err);
    return json({ 
      error: err instanceof Error ? err.message : 'Failed to process CSV file' 
    }, { status: 500 });
  }
};

