import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from "openai";
import { type Dialect } from '$lib/types/index';

const dialectNames: Record<Dialect, string> = {
  'fusha': 'Modern Standard Arabic (Fusha)',
  'levantine': 'Levantine Arabic',
  'darija': 'Moroccan Darija',
  'egyptian-arabic': 'Egyptian Arabic',
  'iraqi': 'Iraqi Arabic',
  'khaleeji': 'Khaleeji Arabic'
};


export const POST: RequestHandler = async ({ request }) => {
  try {
    const openai = new OpenAI({ apiKey: env['OPEN_API_KEY'] });
    const { message, dialect, inputLanguage } = await request.json();

    if (!message || typeof message !== 'string') {
      return error(400, { message: 'Invalid message format' });
    }

    if (!dialect || !dialectNames[dialect as Dialect]) {
      return error(400, { message: 'Invalid dialect' });
    }

    const dialectName = dialectNames[dialect as Dialect];
    const isArabicInput = inputLanguage === 'ar';
    
    // Detect if input contains Arabic characters
    const containsArabic = /[\u0600-\u06FF]/.test(message);
    const actualIsArabic = containsArabic || isArabicInput;

    let systemPrompt: string;
    
    if (actualIsArabic) {
      // User spoke Arabic - provide English translation and transliteration
      systemPrompt = `You are an expert Arabic grammar teacher and translator specializing in ${dialectName}. 

Your task is to provide:
1. The original Arabic text (keep as is, but correct any obvious spelling/grammar errors)
2. English translation
3. Transliteration (phonetic spelling using Latin letters)
4. Grammar feedback - carefully analyze the Arabic text for:
   - Grammar errors (verb conjugations, noun-adjective agreement, case endings, etc.)
   - Spelling mistakes
   - Word order issues
   - Pronunciation concerns
   - Suggestions for more natural or correct expressions
   - If the text is perfect, return an empty string for feedback

IMPORTANT: When providing feedback, always include transliteration (phonetic spelling) alongside Arabic text so learners can understand pronunciation. For example, if correcting a word, show both the Arabic and its transliteration.

Be specific and helpful. If there are errors, explain what's wrong and how to fix it. If the text is correct, return an empty string.

Format your response as JSON with this exact structure:
{
  "arabic": "original Arabic text here (corrected if needed)",
  "english": "English translation here",
  "transliteration": "transliteration here",
  "feedback": "Detailed grammar feedback here, or empty string if no errors"
}`;
    } else {
      // User spoke English - translate to Arabic and provide transliteration
      systemPrompt = `You are an expert Arabic translator specializing in ${dialectName}. 

Your task is to translate the English text to ${dialectName} and provide:
1. Arabic translation in ${dialectName}
2. The original English text
3. Transliteration of the Arabic translation (phonetic spelling using Latin letters)
4. Grammar feedback - analyze if the English text would translate well to ${dialectName}, or if there are better ways to express it

Format your response as JSON with this exact structure:
{
  "arabic": "Arabic translation in ${dialectName}",
  "english": "original English text here",
  "transliteration": "transliteration of Arabic here",
  "feedback": "Feedback on the translation or suggestions here (empty string if no issues)"
}`;
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.3,
      max_tokens: 300,
      top_p: 0.9,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create a structured response
        if (actualIsArabic) {
          parsedResponse = {
            arabic: message,
            english: message,
            transliteration: message
          };
        } else {
          parsedResponse = {
            arabic: message,
            english: message,
            transliteration: message
          };
        }
      }
    }

    // Validate the response structure
    if (!parsedResponse.arabic || !parsedResponse.english || !parsedResponse.transliteration) {
      // Fallback
      parsedResponse = {
        arabic: actualIsArabic ? message : message,
        english: actualIsArabic ? message : message,
        transliteration: message,
        feedback: ''
      };
    }

    // Note: Nile4 model removed from tutor route to reduce latency
    // Using ChatGPT response directly for faster responses

    return json({ 
      arabic: parsedResponse.arabic,
      english: parsedResponse.english,
      transliteration: parsedResponse.transliteration,
      feedback: parsedResponse.feedback || '',
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    console.error('Translate user message error:', e);
    return error(500, { 
      message: 'Failed to translate message' 
    });
  }
};

