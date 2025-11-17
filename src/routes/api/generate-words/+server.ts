import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { commonWords } from '$lib/constants/common-words';
import { normalizeArabicText } from '$lib/utils/arabic-normalization';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { createWordsSchema } from '$lib/utils/gemini-schemas';
import { generateContentWithRetry, GeminiApiError } from '$lib/utils/gemini-api-retry';

// Function to clean unwanted characters from text
function cleanText(text: string, type: 'arabic' | 'english' | 'transliteration'): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove common unwanted characters for all types
  cleaned = cleaned.replace(/[''`""]/g, ''); // Remove various quote marks and apostrophes
  cleaned = cleaned.replace(/[‚„]/g, ''); // Remove additional quote variants
  cleaned = cleaned.replace(/[–—]/g, '-'); // Replace em/en dashes with regular dash
  cleaned = cleaned.replace(/…/g, '...'); // Replace ellipsis with three dots
  
  if (type === 'arabic') {
    // Use the new normalization logic for Arabic text
    cleaned = normalizeArabicText(cleaned);
  } else if (type === 'english') {
    // For English, remove non-standard characters but keep basic punctuation
    cleaned = cleaned.replace(/[^\w\s.,!?-]/g, '');
  } else if (type === 'transliteration') {
    // For transliteration, keep only English alphabet, numbers, and basic punctuation
    cleaned = cleaned.replace(/[^a-zA-Z0-9\s.,!?-]/g, '');
  }
  
  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

export const POST: RequestHandler = async ({ request }) => {
  const apiKey = env['GEMINI_API_KEY'];
  if (!apiKey) {
    return error(500, { message: 'GEMINI_API_KEY is not configured' });
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const data = await request.json();
  
  const dialect = data.dialect || 'egyptian-arabic';
  const wordTypes = data.wordTypes || []; // Array of selected word types (nouns, numbers, etc.)
  const difficulty = data.difficulty || 'a1';
  const customRequest = data.customRequest || ''; // Custom user input for word types

  // Map difficulty levels to descriptions
  const getDifficultyDescription = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'a1':
      case 'beginner':
        return 'A1 (Beginner) - Use very basic vocabulary';
      case 'a2':
        return 'A2 (Elementary) - Use elementary vocabulary';
      case 'b1':
      case 'intermediate':
        return 'B1 (Intermediate) - Use intermediate vocabulary';
      case 'b2':
        return 'B2 (Upper Intermediate) - Use upper intermediate vocabulary';
      case 'c1':
      case 'advanced':
        return 'C1 (Advanced) - Use advanced vocabulary';
      case 'c2':
        return 'C2 (Proficient) - Use proficient-level vocabulary';
      default:
        return 'A1 (Beginner) - Use very basic vocabulary';
    }
  };

  // Dialect-specific configurations
  const dialectConfigs = {
    'egyptian-arabic': {
      name: 'EGYPTIAN',
      description: 'Please make sure that the arabic provided is in the EGYPTIAN dialect. Please only use words that are commonly used in the Egyptian dialect, not in modern standard Arabic or other dialects.',
      wordList: commonWords,
      commonWordsInstruction: 'Here are 3000 of the most common words in Egyptian Arabic, please use these words:',
      wordListInstruction: 'please only use the words in the common words list.'
    },
    'fusha': {
      name: 'MODERN STANDARD ARABIC (FUSHA)',
      description: 'Please make sure that the arabic provided is in MODERN STANDARD ARABIC (FUSHA). Use formal Arabic as used in news, literature, and official communications.',
      wordList: [],
      commonWordsInstruction: '',
      wordListInstruction: 'Please use formal Modern Standard Arabic vocabulary.'
    },
    'darija': {
      name: 'MOROCCAN DARIJA',
      description: 'Please make sure that the arabic provided is in MOROCCAN DARIJA dialect. Use natural conversational Moroccan expressions.',
      wordList: [],
      commonWordsInstruction: '',
      wordListInstruction: 'Please use vocabulary common in Moroccan Darija conversations.'
    }
  } as const;

  const config = dialectConfigs[dialect as keyof typeof dialectConfigs] || dialectConfigs['egyptian-arabic'];

  // Build word types section
  let wordTypesSection = '';
  if (wordTypes.length > 0) {
    wordTypesSection = `
      
      WORD TYPES TO GENERATE: Please generate words from these categories: ${wordTypes.join(', ')}.
      
      IMPORTANT: 
      - Generate a diverse mix of words from the selected categories
      - Each word should be a single word (not a phrase or sentence)
      - Ensure words are appropriate for ${getDifficultyDescription(difficulty)} level
      - Make sure words are commonly used and practical for language learning
    `;
  }

  // Build custom request section
  let customRequestSection = '';
  if (customRequest.trim()) {
    customRequestSection = `
      
      ADDITIONAL REQUIREMENTS: ${customRequest}
      
      Please incorporate these specific requirements when generating words.
    `;
  }

  // Build word list section if available
  let wordListSection = '';
  if (config.wordList && config.wordList.length > 0) {
    const randomWords = [...config.wordList]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(500, config.wordList.length))
      .map((word: any) => word.arabic || word)
      .filter(Boolean);
    
    if (randomWords.length > 0) {
      wordListSection = `
      
      ${config.commonWordsInstruction}
      
      ${randomWords.slice(0, 200).join(', ')}
      
      ${config.wordListInstruction}
      `;
    }
  }

  let question = `
    Give me 20 individual words in ${config.name} dialect.

    ${wordTypesSection}

    ${customRequestSection}

    DIFFICULTY LEVEL: ${getDifficultyDescription(difficulty)}

    ${wordListSection}

    ${config.description}

    Can you make sure that there are no diacritics in the arabic words. Nothing like [أَ إِ آ] please. (THIS is very important)
    
    Can you make sure that the transliterations don't use anything other than the english alphabet.

    Can you make sure that no other text is returned other than the requested words as a json object.

    Please do not include any punctuation in the arabic words. Only letters and spaces (for compound words if necessary).

    IMPORTANT FORMAT REQUIREMENTS:
    - Each word must be a single word (not a phrase)
    - Return as JSON object with a "words" array
    - Each word object must have: "arabic", "english", "transliteration"
    - Example format: {"words": [{"arabic": "بيت", "english": "house", "transliteration": "bayt"}, ...]}

    Please generate exactly 20 words.
  `;

  try {
    const systemPrompt = "You are a helpful assistant that generates Arabic vocabulary words for language learners. Always return valid JSON.";
    const fullPrompt = `${systemPrompt}\n\n${question}`;

    const wordsSchema = createWordsSchema();
    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      // @ts-expect-error - generationConfig is valid but types may be outdated
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
        responseJsonSchema: wordsSchema.jsonSchema
      }
    });

    const content = response.text;
    if (!content) {
      throw new Error('No content received from Gemini');
    }

    let parsed;
    try {
      parsed = parseJsonFromGeminiResponse(content, wordsSchema.zodSchema);
    } catch (parseError) {
      throw new Error('Failed to parse JSON response');
    }

    // Clean and validate words
    let words = (parsed.words || []).map((word: any) => {
      if (!word.arabic || !word.english || !word.transliteration) {
        return null;
      }

      return {
        arabic: cleanText(word.arabic, 'arabic'),
        english: cleanText(word.english, 'english'),
        transliteration: cleanText(word.transliteration, 'transliteration')
      };
    }).filter((word: any) => word && word.arabic && word.english && word.transliteration);

    if (words.length === 0) {
      throw new Error('No valid words generated');
    }

    return json({
      message: {
        message: {
          content: JSON.stringify({ words })
        }
      }
    });
  } catch (err) {
    console.error('Error generating words:', err);
    
    // Check if it's a 503 error (model overloaded)
    if (err instanceof GeminiApiError && err.is503) {
      return error(503, { 
        message: 'The AI model is currently overloaded. Please try again in a few moments. We\'re working to handle the high demand.' 
      });
    }
    
    return error(500, {
      message: err instanceof Error ? err.message : 'Failed to generate words'
    });
  }
};

