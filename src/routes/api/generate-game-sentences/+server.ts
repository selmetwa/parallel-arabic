import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { normalizeArabicText } from '$lib/utils/arabic-normalization';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { createGameSentencesSchema } from '$lib/utils/gemini-schemas';
import { generateContentWithRetry, GeminiApiError } from '$lib/utils/gemini-api-retry';

// Function to clean unwanted characters from text
function cleanText(text: string, type: 'arabic' | 'english' | 'transliteration'): string {
  if (!text) return text;

  let cleaned = text;

  // Remove common unwanted characters for all types
  cleaned = cleaned.replace(/[''`""]/g, '');
  cleaned = cleaned.replace(/[‚„]/g, '');
  cleaned = cleaned.replace(/[–—]/g, '-');
  cleaned = cleaned.replace(/…/g, '...');

  if (type === 'arabic') {
    cleaned = normalizeArabicText(cleaned);
  } else if (type === 'english') {
    cleaned = cleaned.replace(/[^\w\s.,!?'-]/g, '');
  } else if (type === 'transliteration') {
    cleaned = cleaned.replace(/[^a-zA-Z0-9\s.,!?'-]/g, '');
  }

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
  const difficulty = data.difficulty || 'a1';
  const customRequest = data.customRequest || '';
  const count = Math.min(data.count || 10, 20); // Max 20 sentences
  const learningTopics = data.learningTopics || []; // Array of topic IDs
  const reviewWords = data.reviewWords || []; // Array of {arabic, english, transliteration}

  // Map difficulty levels to descriptions
  const getDifficultyDescription = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'a1':
      case 'beginner':
        return 'A1 (Beginner) - Use very basic vocabulary and simple sentence structures';
      case 'a2':
        return 'A2 (Elementary) - Use elementary vocabulary with slightly more complex sentences';
      case 'b1':
      case 'intermediate':
        return 'B1 (Intermediate) - Use intermediate vocabulary and varied sentence structures';
      case 'b2':
        return 'B2 (Upper Intermediate) - Use upper intermediate vocabulary with complex sentences';
      case 'c1':
      case 'advanced':
        return 'C1 (Advanced) - Use advanced vocabulary and sophisticated sentence structures';
      case 'c2':
        return 'C2 (Proficient) - Use proficient-level vocabulary with nuanced expressions';
      default:
        return 'A1 (Beginner) - Use very basic vocabulary and simple sentence structures';
    }
  };

  // Dialect-specific configurations
  const dialectConfigs = {
    'egyptian-arabic': {
      name: 'EGYPTIAN ARABIC',
      description: 'Make sure all Arabic text is in the EGYPTIAN dialect. Use vocabulary and expressions commonly used in Egypt.'
    },
    'fusha': {
      name: 'MODERN STANDARD ARABIC (FUSHA)',
      description: 'Make sure all Arabic text is in MODERN STANDARD ARABIC (FUSHA). Use formal Arabic as used in news and literature.'
    },
    'levantine': {
      name: 'LEVANTINE ARABIC',
      description: 'Make sure all Arabic text is in the LEVANTINE dialect as spoken in Syria, Lebanon, Palestine, and Jordan.'
    },
    'darija': {
      name: 'MOROCCAN DARIJA',
      description: 'Make sure all Arabic text is in MOROCCAN DARIJA dialect.'
    }
  } as const;

  const config = dialectConfigs[dialect as keyof typeof dialectConfigs] || dialectConfigs['egyptian-arabic'];

  // Build topic/theme section
  let customRequestSection = '';
  if (customRequest.trim()) {
    customRequestSection = `
      TOPIC/THEME: ${customRequest}
      Generate sentences related to this topic.
    `;
  }

  // Build learning topics section
  const learningTopicLabels: { [key: string]: string } = {
    'verb-conjugation': 'verb conjugation patterns',
    'noun-plurals': 'noun plurals and their patterns',
    'past-tense': 'past tense verbs',
    'present-tense': 'present tense verbs',
    'future-tense': 'future tense expressions',
    'numbers': 'numbers and counting',
    'possessives': 'possessive suffixes and pronouns',
    'questions': 'question words and structures'
  };

  let learningTopicsSection = '';
  if (learningTopics.length > 0) {
    const topicDescriptions = learningTopics
      .map((t: string) => learningTopicLabels[t] || t)
      .join(', ');
    learningTopicsSection = `
      GRAMMAR FOCUS: Create sentences that practice ${topicDescriptions}.
      Make sure the blank word is related to these grammar topics when possible.
    `;
  }

  // Build review words section
  let reviewWordsSection = '';
  if (reviewWords.length > 0) {
    const wordList = reviewWords
      .slice(0, 30) // Limit to 30 words to avoid prompt being too long
      .map((w: { arabic: string; english: string }) => `${w.arabic} (${w.english})`)
      .join(', ');
    reviewWordsSection = `
      VOCABULARY TO USE: Create sentences that include these words from the user's vocabulary list:
      ${wordList}

      IMPORTANT: Use these words as the blank word in your sentences. Each sentence should feature one of these vocabulary words.
    `;
  }

  const question = `
    Generate ${count} fill-in-the-blank sentences in ${config.name} for a vocabulary game.

    ${customRequestSection}

    ${learningTopicsSection}

    ${reviewWordsSection}

    DIFFICULTY LEVEL: ${getDifficultyDescription(difficulty)}

    ${config.description}

    For each sentence:
    1. Create a complete, natural sentence in Arabic
    2. Choose ONE word from the sentence to be the "blank" word (this should be a key vocabulary word, not a common function word)
    3. Provide the English translation and transliteration
    4. Generate exactly 3 WRONG options that:
       - Are the same part of speech as the correct word
       - Would fit grammatically in the sentence but with wrong meaning
       - Are at a similar difficulty level

    IMPORTANT REQUIREMENTS:
    - No diacritics in Arabic text (no harakat like فَتْحة or ضَمَّة)
    - Transliterations should only use English alphabet
    - The blank word should be a meaningful vocabulary word (nouns, verbs, adjectives) not articles or prepositions
    - Wrong options should be plausible but clearly incorrect
    - Make sentences practical and useful for language learners

    Return as JSON with this exact structure:
    {
      "sentences": [
        {
          "arabic": "full sentence in Arabic",
          "english": "full sentence in English",
          "transliteration": "full sentence transliteration",
          "blankWord": "the word to blank out in Arabic",
          "blankWordEnglish": "English meaning of blank word",
          "blankWordTransliteration": "transliteration of blank word",
          "wrongOptions": ["wrong1", "wrong2", "wrong3"]
        }
      ]
    }
  `;

  try {
    const systemPrompt = "You are a helpful Arabic language teacher creating fill-in-the-blank exercises. Always return valid JSON.";
    const fullPrompt = `${systemPrompt}\n\n${question}`;

    const sentencesSchema = createGameSentencesSchema();
    const response = await generateContentWithRetry(ai, {
      model: "gemini-3-flash-preview",
      contents: fullPrompt,
      // @ts-expect-error - generationConfig is valid but types may be outdated
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 4000,
        responseMimeType: 'application/json',
        responseJsonSchema: sentencesSchema.jsonSchema
      }
    });

    const content = response.text;
    if (!content) {
      throw new Error('No content received from Gemini');
    }

    let parsed;
    try {
      parsed = parseJsonFromGeminiResponse(content, sentencesSchema.zodSchema);
    } catch (parseError) {
      throw new Error('Failed to parse JSON response');
    }

    // Clean and validate sentences
    const sentences = (parsed.sentences || []).map((sentence: any) => {
      if (!sentence.arabic || !sentence.english || !sentence.blankWord) {
        return null;
      }

      return {
        arabic: cleanText(sentence.arabic, 'arabic'),
        english: cleanText(sentence.english, 'english'),
        transliteration: cleanText(sentence.transliteration, 'transliteration'),
        blankWord: cleanText(sentence.blankWord, 'arabic'),
        blankWordEnglish: cleanText(sentence.blankWordEnglish, 'english'),
        blankWordTransliteration: cleanText(sentence.blankWordTransliteration, 'transliteration'),
        wrongOptions: (sentence.wrongOptions || []).map((opt: string) => cleanText(opt, 'arabic')).filter(Boolean)
      };
    }).filter((s: any) => s && s.wrongOptions && s.wrongOptions.length >= 3);

    if (sentences.length === 0) {
      throw new Error('No valid sentences generated');
    }

    return json({
      sentences
    });
  } catch (err) {
    console.error('Error generating sentences:', err);

    if (err instanceof GeminiApiError && err.is503) {
      return error(503, {
        message: 'The AI model is currently overloaded. Please try again in a few moments.'
      });
    }

    return error(500, {
      message: err instanceof Error ? err.message : 'Failed to generate sentences'
    });
  }
};
