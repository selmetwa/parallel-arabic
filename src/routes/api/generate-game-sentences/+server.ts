import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { normalizeArabicText } from '$lib/utils/arabic-normalization';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import {
  createGameSentencesSchema,
  createListeningComprehensionSchema
} from '$lib/utils/gemini-schemas';
import { generateContentWithRetry, GeminiApiError } from '$lib/utils/gemini-api-retry';

// Function to clean unwanted characters from text
function cleanText(text: string, type: 'arabic' | 'english' | 'transliteration'): string {
  if (!text) return text;

  let cleaned = text;

  // Remove common unwanted characters for all types.
  // The apostrophe is deliberately kept: English options are shown as whole
  // sentences, and stripping it turned "don't" into "dont". It is also meaningful
  // in transliteration, whose whitelist below already allows it.
  cleaned = cleaned.replace(/[`""]/g, '');
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
  // 'blank' = fill-in-the-blank (multiple choice), 'comprehension' = listening.
  // Defaults to 'blank' so existing callers are unaffected.
  const questionStyle: 'blank' | 'comprehension' =
    data.questionStyle === 'comprehension' ? 'comprehension' : 'blank';

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
      ${questionStyle === 'comprehension'
        ? 'Where possible, let the distractors turn on these grammar topics, so getting one wrong reveals a gap in exactly that area.'
        : 'Make sure the blank word is related to these grammar topics when possible.'}
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

      ${questionStyle === 'comprehension'
        ? 'IMPORTANT: Each sentence should feature one of these vocabulary words, so the learner has to recognise it by ear.'
        : 'IMPORTANT: Use these words as the blank word in your sentences. Each sentence should feature one of these vocabulary words.'}
    `;
  }

  const blankPrompt = `
    Generate ${count} fill-in-the-blank sentences in ${config.name} for a vocabulary game.

    ${customRequestSection}

    ${learningTopicsSection}

    ${reviewWordsSection}

    DIFFICULTY LEVEL: ${getDifficultyDescription(difficulty)}

    ${config.description}

    For each sentence:
    1. Create a complete, natural sentence in Arabic
    2. Choose ONE word from the sentence to be the "blank" word — the blankWord MUST be copied EXACTLY as it appears in the Arabic sentence (same spelling, same form — do NOT use a different conjugation or variant)
    3. Provide the English translation and transliteration
    4. Generate exactly 3 WRONG options that:
       - Are the same part of speech as the correct word
       - Would fit grammatically in the sentence but with wrong meaning
       - Are at a similar difficulty level

    IMPORTANT REQUIREMENTS:
    - No diacritics in Arabic text (no harakat like فَتْحة or ضَمَّة)
    - Transliterations should only use English alphabet
    - The blankWord field MUST be an exact substring of the arabic field — copy the word directly from the sentence
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

  const comprehensionPrompt = `
    Generate ${count} sentences in ${config.name} for a LISTENING COMPREHENSION exercise.

    The learner hears the sentence spoken aloud and nothing else — no Arabic text, no
    translation — and must choose its meaning from four English options. So the whole
    exercise lives or dies on the quality of the three wrong options.

    ${customRequestSection}

    ${learningTopicsSection}

    ${reviewWordsSection}

    DIFFICULTY LEVEL: ${getDifficultyDescription(difficulty)}

    ${config.description}

    For each sentence:
    1. Write a complete, natural, everyday sentence in Arabic
    2. Give its correct English translation and a transliteration of the full sentence
    3. Write exactly 3 DISTRACTORS — wrong English translations

    THE DISTRACTOR RULES — these matter more than anything else here:
    - Each distractor must be a NEAR MISS: identical to the correct translation except
      for ONE feature. Change the tense, or the subject, or negate it, or change
      singular to plural, or swap exactly one concrete noun. Keep everything else word
      for word the same.
    - A learner who understood the sentence must be able to rule it out. A learner who
      only caught a couple of words must NOT be able to.
    - Never write an unrelated or absurd sentence. "I ate an elephant" is useless as a
      distractor because it can be dismissed without listening at all.
    - Use 3 DIFFERENT values of variesBy across the 3 distractors whenever the sentence
      allows it, so one question tests several features.
    - variesBy must be exactly one of: tense, person, negation, number, vocabulary
      ("person" = wrong subject/pronoun, "vocabulary" = one noun or verb swapped)

    Worked example. Arabic means "I went to the market yesterday":
      correct:    "I went to the market yesterday"
      distractor: "I am going to the market tomorrow"   variesBy: tense
      distractor: "He went to the market yesterday"      variesBy: person
      distractor: "I didn't go to the market yesterday"  variesBy: negation

    IMPORTANT REQUIREMENTS:
    - No diacritics in the Arabic text (no harakat)
    - Transliterations use the English alphabet only
    - Sentences must be natural spoken ${config.name}, the kind of thing someone would
      actually say — this is going to be read aloud by a speech engine
    - Keep sentences short enough to hold in memory on one listen (roughly 4-10 words)
    - No distractor may mean the same thing as the correct translation

    Return as JSON with this exact structure:
    {
      "sentences": [
        {
          "arabic": "full sentence in Arabic",
          "english": "correct English translation",
          "transliteration": "full sentence transliteration",
          "distractors": [
            { "english": "near-miss translation", "variesBy": "tense" },
            { "english": "near-miss translation", "variesBy": "person" },
            { "english": "near-miss translation", "variesBy": "negation" }
          ]
        }
      ]
    }
  `;

  const isComprehension = questionStyle === 'comprehension';

  try {
    const systemPrompt = isComprehension
      ? "You are a helpful Arabic language teacher creating listening comprehension exercises. Always return valid JSON."
      : "You are a helpful Arabic language teacher creating fill-in-the-blank exercises. Always return valid JSON.";
    const fullPrompt = `${systemPrompt}\n\n${isComprehension ? comprehensionPrompt : blankPrompt}`;

    // Loosely typed on purpose: the two styles return different sentence shapes, and
    // each branch below validates its own fields.
    const sentencesSchema: { zodSchema: any; jsonSchema: any } = isComprehension
      ? createListeningComprehensionSchema()
      : createGameSentencesSchema();
    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 8192,
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

    const rawSentences: any[] = (parsed as any).sentences || [];

    if (isComprehension) {
      // The blankWord substring check below does not apply here — there is no blank.
      // What matters instead is that three distinct near-miss options survived.
      const comprehensionSentences = rawSentences.map((sentence: any) => {
        if (!sentence.arabic || !sentence.english) {
          return null;
        }

        const english = cleanText(sentence.english, 'english');

        // Dedupe on the English that will actually be shown: an option reading the
        // same as the answer makes the question unanswerable, or marks a right
        // answer wrong.
        const seen = new Set<string>([english.toLowerCase()]);
        const distractors = (sentence.distractors || [])
          .map((d: any) => ({
            english: cleanText(d?.english || '', 'english'),
            variesBy: typeof d?.variesBy === 'string' ? d.variesBy.toLowerCase().trim() : ''
          }))
          .filter((d: { english: string }) => {
            if (!d.english) return false;
            const key = d.english.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

        return {
          arabic: cleanText(sentence.arabic, 'arabic'),
          english,
          transliteration: cleanText(sentence.transliteration, 'transliteration'),
          // Exactly three, so the round is always four options wide
          distractors: distractors.slice(0, 3)
        };
      }).filter((s: any) => s && s.arabic && s.english && s.distractors.length >= 3);

      if (comprehensionSentences.length === 0) {
        throw new Error('No valid sentences generated');
      }

      return json({ sentences: comprehensionSentences });
    }

    // Clean and validate sentences
    const sentences = rawSentences.map((sentence: any) => {
      if (!sentence.arabic || !sentence.english || !sentence.blankWord) {
        return null;
      }

      const cleaned = {
        arabic: cleanText(sentence.arabic, 'arabic'),
        english: cleanText(sentence.english, 'english'),
        transliteration: cleanText(sentence.transliteration, 'transliteration'),
        blankWord: cleanText(sentence.blankWord, 'arabic'),
        blankWordEnglish: cleanText(sentence.blankWordEnglish, 'english'),
        blankWordTransliteration: cleanText(sentence.blankWordTransliteration, 'transliteration'),
        wrongOptions: (sentence.wrongOptions || []).map((opt: string) => cleanText(opt, 'arabic')).filter(Boolean)
      };

      // Verify blankWord actually exists in the sentence
      if (!cleaned.arabic.includes(cleaned.blankWord)) {
        // Try to find the matching word via normalized comparison
        const sentenceWords = cleaned.arabic.split(' ');
        const normalizedBlank = normalizeArabicText(cleaned.blankWord);
        const match = sentenceWords.find(w => normalizeArabicText(w) === normalizedBlank);
        if (match) {
          cleaned.blankWord = match;
        } else {
          console.warn('Discarding sentence — blankWord not found in sentence:', {
            sentence: cleaned.arabic,
            blankWord: cleaned.blankWord
          });
          return null;
        }
      }

      // Remove wrong options that match the correct answer
      const normalizedCorrect = normalizeArabicText(cleaned.blankWord);
      const seenOptions = new Set<string>([normalizedCorrect]);
      cleaned.wrongOptions = cleaned.wrongOptions.filter((opt: string) => {
        const normalized = normalizeArabicText(opt);
        if (seenOptions.has(normalized)) return false;
        seenOptions.add(normalized);
        return true;
      });

      return cleaned;
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
        message: 'Our service is experiencing high demand. Please try again in a few moments.'
      });
    }

    return error(500, {
      message: err instanceof Error ? err.message : 'Failed to generate sentences'
    });
  }
};
