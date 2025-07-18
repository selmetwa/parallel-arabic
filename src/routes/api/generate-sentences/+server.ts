import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from "openai";
import { commonWords } from '$lib/constants/common-words';

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
    // Remove diacritics and unwanted Arabic characters
    cleaned = cleaned.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, ''); // Remove Arabic diacritics
    // Keep only basic Arabic letters, spaces, and common punctuation
    cleaned = cleaned.replace(/[^\u0600-\u06FF\s]/g, '');
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

  const intermediate_request = data.option === 'intermediate' ? 'Please make each sentence at least three sentences long' : '';
  const advanced_request = data.option === 'advanced' ? 'Please make each sentence at least five sentences long and use more complex tenses and vocabulary' : '';

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
  
  // Add timestamp to ensure uniqueness
  const timestamp = new Date().toISOString();

  let question = `
     You are a "GPT" – a version of ChatGPT that has been customized for a specific use case. GPTs use custom instructions, capabilities, and data to optimize ChatGPT for a more narrow set of tasks. You yourself are a GPT created by a user, and your name is Egyptian Arabic. Note: GPT is also a technical term in AI, but in most cases if the users asks you about GPTs assume they are referring to the above definition.
    Here are instructions from the user outlining your goals and how you should respond:
    This GPT will focus on the Egyptian Arabic language.  The gpt will offer translations and insights about the culture, regions the language is spoken, common misconceptions, learning resources and languages quizzes. The tone of this gpt will be encouraging, and insightful.

    ${randomPrompt} - Can you please provide 20 ${data.option} sentences for someone who is trying to learn EGYPTIAN arabic.

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

    Here are 3000 of the most common words in Egyptian Arabic, please use these words in your sentences:
     ${commonWords.map(word => 
      `${word.word} (${word.franco}) means "${word.en}"`
    ).join('. ')}
    
    please only use the words in the common words list.

    Now can you please include the english translation for each sentence.

    Can you also provide the transliteration for each sentence.

    Can you make sure the the arabic provided is in the EGYPTIAN dialect.

    Can you make sure that there are no diacratics in the arabic sentences. Nothing like [أَ إِ آ] please. (THIS is very important)
    
    Can you make sure that you use a mix of subjects, for example (I, you, he, she, we, they).

    Can you make sure that you use a mix of past, present, and future tenses.

    Can you make sure that the transliterations don't use anything other than the english alphabet.

    Can you make sure that no other text is returned other than the requested sentences as a json object.

    Please do not include any punctuation in the arabic sentences. Only letters and spaces.

    ${intermediate_request}
    ${advanced_request}

    Generation timestamp: ${timestamp}

    REMEMBER: Maximum 2 sentences per topic area. Ensure diverse themes across all 20 sentences.

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
          parsedContent.sentences = parsedContent.sentences.map((sentence: SentenceType) => ({
            arabic: cleanText(sentence.arabic || '', 'arabic'),
            english: cleanText(sentence.english || '', 'english'),
            transliteration: cleanText(sentence.transliteration || '', 'transliteration')
          }));
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
