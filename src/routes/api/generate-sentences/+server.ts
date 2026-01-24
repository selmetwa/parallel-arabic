import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { commonWords } from '$lib/constants/common-words';
import { normalizeArabicText } from '$lib/utils/arabic-normalization';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { createSentencesSchema } from '$lib/utils/gemini-schemas';
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

type SentenceType = {
  arabic: string;
  english: string;
  transliteration: string;
};

export const POST: RequestHandler = async ({ request }) => {
  const apiKey = env['GEMINI_API_KEY'];
  if (!apiKey) {
    return error(500, { message: 'GEMINI_API_KEY is not configured' });
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const data = await request.json();
  
  const dialect = data.dialect || 'egyptian-arabic'; // Default to Egyptian
  const learningTopics = data.learningTopics || []; // Array of selected learning topics
  const vocabularyWords = data.vocabularyWords || ''; // Vocabulary words to feature
  const useReviewWordsOnly = data.useReviewWordsOnly || false;
  const reviewWords = data.reviewWords || [];

  const intermediate_request = data.option === 'intermediate' || data.option === 'b1' || data.option === 'b2' ? 'Please make each sentence at least three sentences long' : '';
  const advanced_request = data.option === 'advanced' || data.option === 'c1' || data.option === 'c2' ? 'Please make each sentence at least five sentences long and use more complex tenses and vocabulary' : '';

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
        return 'B2 (Upper Intermediate) - Use upper intermediate vocabulary with complex sentence structures';
      case 'c1':
      case 'advanced':
        return 'C1 (Advanced) - Use advanced vocabulary and sophisticated sentence structures';
      case 'c2':
        return 'C2 (Proficient) - Use proficient-level vocabulary and highly complex sentence structures';
      default:
        return 'A1 (Beginner) - Use very basic vocabulary and simple sentence structures';
    }
  };

  // Dialect-specific configurations
  const dialectConfigs = {
    'egyptian-arabic': {
      name: 'EGYPTIAN',
      description: 'Please make sure that the arabic provided is in the EGYPTIAN dialect. Please only use words that are commonly used in the Egyptian dialect, not in modern standard Arabic or other dialects.',
      wordList: commonWords,
      commonWordsInstruction: 'Here are 3000 of the most common words in Egyptian Arabic, please use these words in your sentences:',
      wordListInstruction: 'please only use the words in the common words list.'
    },
    'fusha': {
      name: 'MODERN STANDARD ARABIC (FUSHA)',
      description: 'Please make sure that the arabic provided is in MODERN STANDARD ARABIC (FUSHA). Use formal Arabic as used in news, literature, and official communications. Avoid colloquial expressions.',
      wordList: [], // No specific word list for Fusha yet
      commonWordsInstruction: '',
      wordListInstruction: 'Please use formal Modern Standard Arabic vocabulary appropriate for news and literature.'
    },
    'levantine': {
      name: 'LEVANTINE ARABIC',
      description: 'Please make sure that the arabic provided is in the LEVANTINE dialect as spoken in Syria, Lebanon, Palestine, and Jordan. Use natural conversational Levantine expressions.',
      wordList: [], // No specific word list for Levantine yet
      commonWordsInstruction: '',
      wordListInstruction: 'Please use vocabulary common in Levantine Arabic conversations.'
    },
    'darija': {
      name: 'MOROCCAN DARIJA',
      description: 'Please make sure that the arabic provided is in MOROCCAN DARIJA as spoken in Morocco. Use natural conversational Moroccan Arabic expressions and vocabulary.',
      wordList: [], // No specific word list for Darija yet
      commonWordsInstruction: '',
      wordListInstruction: 'Please use vocabulary common in Moroccan Darija conversations.'
    },
    'iraqi': {
      name: 'IRAQI ARABIC',
      description: 'Please make sure that the arabic provided is in the IRAQI dialect as spoken in Iraq. Use natural conversational Iraqi expressions and vocabulary.',
      wordList: [], // No specific word list for Iraqi yet
      commonWordsInstruction: '',
      wordListInstruction: 'Please use vocabulary common in Iraqi Arabic conversations.'
    },
    'khaleeji': {
      name: 'KHALEEJI ARABIC',
      description: 'Please make sure that the arabic provided is in the KHALEEJI dialect as spoken in the Gulf states (UAE, Saudi Arabia, Kuwait, Bahrain, Qatar, Oman). Use natural conversational Gulf Arabic expressions and vocabulary.',
      wordList: [], // No specific word list for Khaleeji yet
      commonWordsInstruction: '',
      wordListInstruction: 'Please use vocabulary common in Khaleeji Arabic conversations.'
    }
  } as const;

  type DialectKey = keyof typeof dialectConfigs;
  const validDialect = dialect as DialectKey;
  const config = dialectConfigs[validDialect] || dialectConfigs['egyptian-arabic'];

  // Add variety to prompts to prevent repetitive responses
  const promptVariations = [
    "Create diverse and unique sentences",
    "Generate varied and interesting sentences", 
    "Produce creative and different sentences",
    "Make original and engaging sentences",
    "Build fresh and distinctive sentences",
    "Craft innovative and varied sentences",
    "Develop unique and compelling sentences",
    "Form creative and diverse sentences",
    "Construct original and varied sentences",
    "Design fresh and engaging sentences",
    "Compose distinctive and interesting sentences",
    "Generate dynamic and creative sentences",
    "Produce imaginative and diverse sentences",
    "Create engaging and original sentences",
    "Build varied and captivating sentences"
  ];

  const randomPrompt = promptVariations[Math.floor(Math.random() * promptVariations.length)];
  
  const timestamp = new Date().toISOString();

  // Build learning topics section
  let learningTopicsSection = '';
  if (learningTopics.length > 0) {
    learningTopicsSection = `
    
    IMPORTANT FOCUS AREAS: Please emphasize these specific language learning topics in your sentences: ${learningTopics.join(', ')}.
    
    For each selected topic, include relevant examples across the 5 sentences:
    ${learningTopics.map((topic: string) => {
      switch (topic) {
        case 'verb conjugation':
          return '- Include various verb conjugations showing different persons (I, you, he/she, we, they)';
        case 'noun plurals':
          return '- Use both singular and plural forms of nouns throughout the sentences';
        case 'past tense':
          return '- Include past tense verbs to describe completed actions';
        case 'present tense':
          return '- Use present tense verbs to describe current actions and states';
        case 'future tense':
          return '- Include future tense constructions to describe upcoming events';
        case 'infinitive':
          return '- Use infinitive verb forms in appropriate contexts';
        case 'numbers':
          return '- Incorporate numbers, counting, and numerical expressions';
        case 'possessive suffixes':
          return '- Use possessive suffixes attached to nouns (my, your, his/her, our, their)';
        default:
          return `- Focus on ${topic} examples and usage`;
      }
    }).join('\n')}`;
  }

  // Build review words section (highest priority when useReviewWordsOnly is true)
  let reviewWordsSection = '';
  if (useReviewWordsOnly && reviewWords.length > 0) {
    const wordsList = reviewWords.map((word) => 
      `Arabic: ${word.arabic}, English: ${word.english}, Transliteration: ${word.transliteration}`
    ).join('\n');
    
    reviewWordsSection = `
    
    REVIEW WORDS TO INCORPORATE: The following are words the user is actively learning. You should incorporate some of these words naturally throughout your sentences, but you do NOT need to include every single word. Quality and naturalness are more important than quantity.
    
    IMPORTANT GUIDELINES:
    - Select a reasonable subset of words that fit naturally into your sentences
    - Prioritize natural, comprehensible sentences over cramming in all words
    - It's better to use fewer words well than to force all words and create awkward, incomprehensible sentences
    - Distribute the words across different sentences rather than cramming many into one sentence
    - If including all words would make sentences unnatural or hard to understand, use only those that fit naturally
    
    AVAILABLE REVIEW WORDS (choose a subset that fits naturally):
    ${wordsList}
    
    Remember: The goal is to create natural, readable sentences that help reinforce learning. Including a few words naturally per sentence is better than forcing many words into awkward, incomprehensible sentences.`;
  }

  // Build vocabulary words section (only if not using review words only)
  let vocabularyWordsSection = '';
  if (!useReviewWordsOnly && vocabularyWords.trim()) {
    const wordsArray = vocabularyWords.split(',').map((word: string) => word.trim()).filter((word: string) => word.length > 0);
    if (wordsArray.length > 0) {
      vocabularyWordsSection = `
      
      VOCABULARY WORDS TO FEATURE: Please incorporate these specific vocabulary words naturally throughout your sentences: ${wordsArray.join(', ')}.
      
      IMPORTANT VOCABULARY REQUIREMENTS:
      - Use as many of these words as possible in natural, contextually appropriate ways
      - If a word is provided in English or transliteration, use the proper ${config.name} equivalent
      - Don't force words unnaturally - only use them where they fit the sentence context
      - Prioritize using these words over generic vocabulary
      - If you can't use a word directly, try to use related words or concepts
      
      Words to incorporate: ${[...wordsArray].sort(() => Math.random() - 0.5).slice(0, Math.min(100, wordsArray.length)).map((word: string) => `"${word}"`).join(', ')}`;
    }
  }

  let question = `
    Give me 5 sentences in ${config.name} dialect.

    ${randomPrompt} - Can you please provide 5 sentences for someone who is learning ${config.name} Arabic.

    DIFFICULTY LEVEL: ${getDifficultyDescription(data.option)}

    ${learningTopicsSection}

    ${reviewWordsSection}

    ${vocabularyWordsSection}

    CRITICAL: Each sentence must be about a DIFFERENT topic or situation. Do NOT focus on just one theme. Vary the topics across:
    - Daily life situations (work, home, family)
    - Food and cooking (but only 1-2 sentences maximum)
    - Travel and transportation  
    - Shopping and commerce
    - Weather and seasons
    - Social interactions and relationships
    - Health and body
    - Education and learning
    - Entertainment and hobbies
    - Technology and communication
    - Emotions and feelings
    - Time and schedules
    - Directions and locations
    - Clothing and appearance
    - Sports and activities
    - Culture and traditions
    - Animals and nature
    - Money and business
    - Religion and beliefs
    - Past experiences and future plans

    IMPORTANT: Be creative and avoid repetitive patterns. Use varied sentence structures, different vocabulary combinations, and diverse scenarios. NO MORE THAN 2 SENTENCES should be about the same topic area.

    Now can you please include the english translation for each sentence.

    Can you also provide the transliteration for each sentence.

    ${config.description}

    Can you make sure that there are no diacratics in the arabic sentences. Nothing like [أَ إِ آ] please. (THIS is very important)
    
    Can you make sure that you use a mix of subjects, for example (I, you, he, she, we, they).

    Can you make sure that you use a mix of past, present, and future tenses.

    Can you make sure that the transliterations don't use anything other than the english alphabet.

    Can you make sure that no other text is returned other than the requested sentences as a json object.

    Please do not include any punctuation in the arabic sentences. Only letters and spaces.

    ${intermediate_request}
    ${advanced_request}

    Generation timestamp: ${timestamp}

    REMEMBER: Maximum 2 sentences per topic area. Ensure diverse themes across all 5 sentences.

    Can you make sure each sentence follows this format 
    {
		  arabic: string;
		  english: string;
		  transliteration: string;
	  }
  `

  if (data.sentences.length > 0) {
    if (data.sentences.length > 0) {
      question += `
      Previously generated sentences (DO NOT include any of these exact sentences in your response, and avoid similar patterns):
      ${JSON.stringify(data.sentences, null, 2)}`;
    }
  }

  try {
    const sentencesSchema = createSentencesSchema();
    
    const schemaString = JSON.stringify(sentencesSchema.jsonSchema, null, 2);
    const enhancedQuestion = `${question}

CRITICAL: You must return a valid JSON object exactly matching this schema:
${schemaString}

IMPORTANT: 
1. Return PURE JSON only.
2. Do NOT wrap the response in markdown code blocks (no \`\`\`json ... \`\`\`).
3. Do NOT include any explanations or other text.`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-3-flash-preview",
      contents: enhancedQuestion,
      // @ts-expect-error - generationConfig is valid but types may be outdated
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 4000, // Increase token limit to prevent truncation
        responseMimeType: 'application/json',
        responseJsonSchema: sentencesSchema.jsonSchema
      }
    });
    
    // Initialize responseData from response
    const responseData: { message: { content: string } } = {
      message: { content: '' }
    };
    
    // Clean the generated sentences
    const content = response.text;
    if (content) {
      // Log full response for debugging truncated JSON
      console.log('Full Gemini response length:', content.length);
      console.log('Last 500 chars of response:', content.substring(Math.max(0, content.length - 500)));
      
      try {
        const parsedContent = parseJsonFromGeminiResponse(content, sentencesSchema.zodSchema);
        if (parsedContent.sentences && Array.isArray(parsedContent.sentences)) {
          console.log('Gemini generated', parsedContent.sentences.length, 'sentences');
          
          // Validate we have complete sentences
          const incompleteSentences = parsedContent.sentences.filter((s: SentenceType) => 
            !s.arabic || !s.english || !s.transliteration ||
            s.arabic.trim() === '' || s.english.trim() === '' || s.transliteration.trim() === ''
          );
          
          if (incompleteSentences.length > 0) {
            console.warn(`Found ${incompleteSentences.length} incomplete sentences, filtering them out`);
            parsedContent.sentences = parsedContent.sentences.filter((s: SentenceType) => 
              s.arabic && s.english && s.transliteration &&
              s.arabic.trim() !== '' && s.english.trim() !== '' && s.transliteration.trim() !== ''
            );
          }
          
          // Clean the sentences first
          parsedContent.sentences = parsedContent.sentences.map((sentence: SentenceType) => ({
            arabic: cleanText(sentence.arabic || '', 'arabic'),
            english: cleanText(sentence.english || '', 'english'),
            transliteration: cleanText(sentence.transliteration || '', 'transliteration')
          }));
          
          responseData.message.content = JSON.stringify(parsedContent);
        } else {
          console.error('No sentences array found in parsed content');
          throw new Error('Invalid response structure: missing sentences array');
        }
      } catch (parseError) {
        console.error('Error parsing generated content:', parseError);
        console.error('Response content (first 2000 chars):', content.substring(0, 2000));
        console.error('Response content (last 2000 chars):', content.substring(Math.max(0, content.length - 2000)));
        throw parseError;
      }
    } else {
      throw new Error('No content received from Gemini');
    }
    
    return json({ message: responseData });

  } catch (e) {
    console.error(e);
    
    // Check if it's a 503 error (model overloaded)
    if (e instanceof GeminiApiError && e.is503) {
      return error(503, { 
        message: 'The AI model is currently overloaded. Please try again in a few moments. We\'re working to handle the high demand.' 
      });
    }
    
    return error(500, { message: 'Something went wrong' });
  }
}
