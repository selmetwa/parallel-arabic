import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from "openai";
import { commonWords } from '$lib/constants/common-words';
import { normalizeArabicText } from '$lib/utils/arabic-normalization';

// Function to improve Arabic text using the Egyptian Arabic model
async function improveArabicWithEgyptianModel(arabicText: string): Promise<string> {
	try {
		console.log('Improving Arabic with Egyptian model...');
		
		const prompt = `الرجاء ترجمة النص العربي التالي إلى اللهجة المصرية الأصيلة. احتفظ بنفس المعنى ولكن استخدم الكلمات والتعبيرات المصرية الشائعة:

${arabicText}`;

		const response = await fetch('https://selmetwa--nilechat-generator-api-generate.modal.run', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				prompt: prompt,
				max_tokens: 2000
			})
		});

		if (!response.ok) {
			throw new Error(`Egyptian model request failed: ${response.status} ${response.statusText}`);
		}

		const result = await response.json();
		console.log('Egyptian Arabic model response received');
		
		// Extract text from response
		let improvedText = '';
		if (typeof result === 'string') {
			improvedText = result;
		} else if (result.response) {
			improvedText = result.response;
		} else if (result.text) {
			improvedText = result.text;
		} else if (result.content) {
			improvedText = result.content;
		} else {
			improvedText = JSON.stringify(result);
		}

		return improvedText.trim();
	} catch (error) {
		console.error('Failed to improve Arabic with Egyptian model:', error);
		// Return original text if improvement fails
		return arabicText;
	}
}

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
  const openai = new OpenAI({ apiKey: env['OPEN_API_KEY'] });
  const data = await request.json();
  
  const dialect = 'egyptian-arabic'; // Default to Egyptian
  const learningTopics = data.learningTopics || []; // Array of selected learning topics
  const vocabularyWords = data.vocabularyWords || ''; // Vocabulary words to feature

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

  // Build word list section if available
  let wordListSection = '';
  if (config.wordList.length > 0) {
    wordListSection = `
    ${config.commonWordsInstruction}
     ${config.wordList.map((word: { word: string; franco?: string; en: string }) => 
      `${word.word} (${word.franco || 'no-transliteration'}) means "${word.en}"`
    ).join('. ')}
    
    ${config.wordListInstruction}`;
  } else {
    wordListSection = config.wordListInstruction;
  }

  // Build learning topics section
  let learningTopicsSection = '';
  if (learningTopics.length > 0) {
    learningTopicsSection = `
    
    IMPORTANT FOCUS AREAS: Please emphasize these specific language learning topics in your sentences: ${learningTopics.join(', ')}.
    
    For each selected topic, include relevant examples across the 10 sentences:
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

  // Build vocabulary words section
  let vocabularyWordsSection = '';
  if (vocabularyWords.trim()) {
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
    Give me 10 sentences in ${config.name} dialect.

    ${randomPrompt} - Can you please provide 10 sentences for someone who is learning ${config.name} Arabic.

    DIFFICULTY LEVEL: ${getDifficultyDescription(data.option)}

    ${learningTopicsSection}

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

    ${wordListSection}

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

    REMEMBER: Maximum 2 sentences per topic area. Ensure diverse themes across all 10 sentences.

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
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: question }],
      response_format: { type: "json_object" },
      model: "gpt-4o-mini",
      // Add randomness parameters
      temperature: 0.9,  // Higher temperature for more creativity
      top_p: 0.95,      // Nucleus sampling for variety
      frequency_penalty: 0.5,  // Penalize repetitive tokens
      presence_penalty: 0.3,   // Encourage new topics
    });
    
    // Clean the generated sentences
    const responseData = completion.choices[0];
    if (responseData.message?.content) {
      try {
        const parsedContent = JSON.parse(responseData.message.content);
        if (parsedContent.sentences && Array.isArray(parsedContent.sentences)) {
          console.log('OpenAI generated', parsedContent.sentences.length, 'sentences');
          
          // Clean the sentences first
          parsedContent.sentences = parsedContent.sentences.map((sentence: SentenceType) => ({
            arabic: cleanText(sentence.arabic || '', 'arabic'),
            english: cleanText(sentence.english || '', 'english'),
            transliteration: cleanText(sentence.transliteration || '', 'transliteration')
          }));

          // NEW: Improve Arabic sentences with Egyptian model for Egyptian dialect
          if (dialect === 'egyptian-arabic') {
            console.log('Starting Arabic improvement with Egyptian model...');
            for (let i = 0; i < parsedContent.sentences.length; i++) {
              const originalArabic = parsedContent.sentences[i].arabic;
              const improvedArabic = await improveArabicWithEgyptianModel(originalArabic);
              console.log({ originalArabic, improvedArabic });
              parsedContent.sentences[i].arabic = improvedArabic;
              
              // Update transliteration and English to match the improved Arabic
              if (improvedArabic !== originalArabic) {
                console.log(`Updating English and transliteration for improved Arabic: ${improvedArabic}`);
                try {
                  const updateCompletion = await openai.chat.completions.create({
                    messages: [{ 
                      role: "system", 
                      content: `Given this Egyptian Arabic sentence: "${improvedArabic}"
                      
                      Please provide:
                      1. An accurate English translation
                      2. An accurate transliteration using only English alphabet letters
                      
                      Make sure the transliteration reflects authentic Egyptian pronunciation.
                      
                      Return ONLY a JSON object in this exact format:
                      {
                        "english": "the english translation",
                        "transliteration": "the transliteration"
                      }
                      
                      No other text or explanation.` 
                    }],
                    response_format: { type: "json_object" },
                    model: "gpt-4o-mini",
                    temperature: 0.3, // Lower temperature for more consistent translations
                  });
                  
                  const updateResponse = updateCompletion.choices[0].message?.content;
                  if (updateResponse) {
                    const updateData = JSON.parse(updateResponse);
                    if (updateData.english && updateData.transliteration) {
                      parsedContent.sentences[i].english = cleanText(updateData.english, 'english');
                      parsedContent.sentences[i].transliteration = cleanText(updateData.transliteration, 'transliteration');
                      console.log(`Updated translations for sentence ${i + 1}`);
                    }
                  }
                } catch (updateError) {
                  console.error(`Failed to update translations for sentence ${i + 1}:`, updateError);
                  // Keep original English and transliteration if update fails
                }
              }
            }
            console.log('Completed Arabic improvement with Egyptian model');
          }
          
          responseData.message.content = JSON.stringify(parsedContent);
        }
      } catch (parseError) {
        console.error('Error parsing generated content:', parseError);
      }
    }
    
    return json({ message: responseData });

  } catch (e) {
    console.error(e);
    return error(500, { message: 'Something went wrong' });
  }
}
