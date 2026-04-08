import { GoogleGenAI } from "@google/genai";
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const wordCompletionSchema = z.object({
  arabic: z.string().optional(),
  english: z.string().optional(),
  transliteration: z.string().optional(),
  dialect: z.enum(['egyptian-arabic', 'fusha', 'levantine', 'darija']).optional()
});

const columnMappings: Record<string, string> = {
  'arabic': 'arabic',
  'arabic_word': 'arabic',
  'arabic_text': 'arabic',
  'arabic text': 'arabic',
  'عربي': 'arabic',
  'english': 'english',
  'english_word': 'english',
  'english text': 'english',
  'translation': 'english',
  'meaning': 'english',
  'transliteration': 'transliteration',
  'transliterated': 'transliteration',
  'transliterated_word': 'transliteration',
  'pronunciation': 'transliteration',
  'phonetic': 'transliteration',
  'dialect': 'dialect',
  'language': 'dialect',
  'variant': 'dialect'
};

function normalizeColumnName(name: string): string | null {
  const normalized = name.toLowerCase().trim().replace(/[_\s-]/g, '_');

  if (columnMappings[normalized]) {
    return columnMappings[normalized];
  }

  for (const [key, value] of Object.entries(columnMappings)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return null;
}

export function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export function isStructuredCSV(text: string): boolean {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return false;

  const firstLine = lines[0].toLowerCase();
  const hasCSVHeaders = /(arabic|english|transliteration|dialect|translation|meaning)/.test(firstLine) ||
                        firstLine.split(',').length >= 2;
  const hasMultipleColumns = firstLine.includes(',') &&
                            (firstLine.split(',').length >= 2);

  return hasCSVHeaders || hasMultipleColumns;
}

/**
 * Detects if text is transliteration (phonetic spelling) vs English.
 * Transliteration typically contains phonetic patterns like double vowels (ee, aa, oo),
 * Arabic-specific consonant clusters (kh, gh, dh), and numeral substitutions (3, 7, 9).
 */
export function isTransliteration(text: string): boolean {
  const trimmed = text.trim().toLowerCase();

  if (!trimmed) return false;
  if (/[\u0600-\u06FF]/.test(trimmed)) return false;

  const words = trimmed.split(/\s+/);

  const commonEnglishWords = [
    'the', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'this', 'that', 'these', 'those', 'a', 'an', 'and', 'or', 'but', 'if',
    'house', 'car', 'book', 'water', 'food', 'time', 'day', 'night', 'good',
    'bad', 'big', 'small', 'new', 'old', 'man', 'woman', 'child', 'person',
    'in', 'at', 'on', 'to', 'for', 'of', 'with', 'from', 'by', 'about',
    'stylish', 'clothes', 'human', 'animal'
  ];

  const hasEnglishWords = words.some(word =>
    commonEnglishWords.some(englishWord =>
      word.toLowerCase() === englishWord.toLowerCase() ||
      word.toLowerCase().startsWith(englishWord.toLowerCase())
    )
  );

  if (hasEnglishWords) return false;

  for (const word of words) {
    if (/(ee|aa|oo|ii|uu)/i.test(word)) {
      const englishDoubleVowelWords = ['see', 'bee', 'too', 'zoo', 'food', 'good', 'mood', 'wood'];
      if (!englishDoubleVowelWords.includes(word)) {
        return true;
      }
    }

    if (/\b(kh|gh|dh|th|sh|ch|zh|q|3|7|9)\w*/i.test(word)) {
      return true;
    }

    if (word.length >= 3 && word.length <= 8 && word === word.toLowerCase()) {
      if (/^[a-z]{3,8}$/i.test(word) && !/^(ing|ed|er|ly|tion|sion)$/i.test(word)) {
        if (/^(an|al|in|en|ar|ir|ur|ee|aa|oo)/i.test(word) ||
            /(ee|aa|oo|ii|uu)/i.test(word) ||
            /q[^u]/i.test(word) ||
            /3|7|9/.test(word)) {
          return true;
        }
      }
    }
  }

  if (words.length <= 2 && trimmed === trimmed.toLowerCase()) {
    const looksLikeTransliteration = words.some(word => {
      return (word.length >= 3 && word.length <= 8 &&
              (/(ee|aa|oo|ii|uu)/i.test(word) ||
               /\b(kh|gh|dh|th|sh|ch|zh|q[^u])\w*/i.test(word) ||
               /3|7|9/.test(word)));
    });

    if (looksLikeTransliteration) {
      return true;
    }
  }

  return false;
}

export function parseUnstructuredText(text: string): Array<Record<string, string>> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const rows: Array<Record<string, string>> = [];

  for (const line of lines) {
    if (!containsArabic(line)) {
      continue;
    }

    const parts = line.split(/[,|;]/).map(p => p.trim()).filter(p => p.length > 0);

    if (parts.length > 1) {
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

      if (arabic) {
        rows.push({ arabic, english: english || '', transliteration: transliteration || '' });
      }
    } else {
      rows.push({ arabic: line, english: '', transliteration: '' });
    }
  }

  return rows;
}

export function parseCSV(csvText: string): Array<Record<string, string>> {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
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

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.replace(/^"|"$/g, ''));

  const columnMap: Record<number, string> = {};
  headers.forEach((header, index) => {
    const normalized = normalizeColumnName(header);
    if (normalized) {
      columnMap[index] = normalized;
    }
  });

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

    if (row.arabic || row.english) {
      rows.push(row);
    }
  }

  return rows;
}

export function normalizeDialect(dialect: string): string {
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

export function validateAndCorrectWord(word: {
  arabic: string;
  english: string;
  transliteration: string;
  dialect: string;
}): { arabic: string; english: string; transliteration: string; dialect: string } {
  const englishIsTransliteration = isTransliteration(word.english);
  const transliterationIsEnglish = word.transliteration.trim() && !isTransliteration(word.transliteration);

  if (englishIsTransliteration) {
    if (transliterationIsEnglish) {
      return {
        arabic: word.arabic,
        english: word.transliteration,
        transliteration: word.english,
        dialect: word.dialect
      };
    }
    if (!word.transliteration.trim() || isTransliteration(word.transliteration)) {
      return {
        arabic: word.arabic,
        english: word.english,
        transliteration: word.transliteration.trim() || word.english,
        dialect: word.dialect
      };
    }
  }

  if (transliterationIsEnglish) {
    if (!word.english.trim() || isTransliteration(word.english)) {
      return {
        arabic: word.arabic,
        english: word.transliteration,
        transliteration: word.english || '',
        dialect: word.dialect
      };
    }
  }

  return word;
}

export async function completeWordWithGemini(
  word: Record<string, string>,
  ai: GoogleGenAI,
  defaultDialect?: string
): Promise<{ arabic: string; english: string; transliteration: string; dialect: string }> {
  const hasArabic = !!word.arabic?.trim();
  const hasEnglish = !!word.english?.trim();
  const hasTransliteration = !!word.transliteration?.trim();
  const hasDialect = !!word.dialect?.trim();

  const normalizedDialect = hasDialect ? normalizeDialect(word.dialect) : (defaultDialect || null);

  if (hasArabic && hasEnglish) {
    if (hasTransliteration && normalizedDialect) {
      return {
        arabic: word.arabic.trim(),
        english: word.english.trim(),
        transliteration: word.transliteration.trim(),
        dialect: normalizedDialect
      };
    }
    if (hasTransliteration) {
      return {
        arabic: word.arabic.trim(),
        english: word.english.trim(),
        transliteration: word.transliteration.trim(),
        dialect: normalizedDialect || defaultDialect || 'egyptian-arabic'
      };
    }
  }

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

  const schema = {
    zodSchema: wordCompletionSchema,
    jsonSchema: zodToJsonSchema(wordCompletionSchema)
  };

  prompt += `\n\nReturn a JSON object with this exact structure:\n`;
  prompt += JSON.stringify(schema.jsonSchema, null, 2);
  prompt += `\n\nExample format: {"arabic": "بيت", "english": "house", "transliteration": "bayt", "dialect": "egyptian-arabic"}`;

  try {
    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
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

    return validateAndCorrectWord(completedWord);
  } catch (err) {
    console.error('Error completing word with Gemini:', err);
    const fallbackWord = {
      arabic: (word.arabic || '').trim(),
      english: (word.english || '').trim(),
      transliteration: (word.transliteration || '').trim(),
      dialect: normalizedDialect || defaultDialect || 'egyptian-arabic'
    };

    return validateAndCorrectWord(fallbackWord);
  }
}
