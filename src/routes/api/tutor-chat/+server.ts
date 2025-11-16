import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from "openai";
import { type Dialect } from '$lib/types/index';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

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
    const { message, dialect, conversation } = await request.json();

    if (!message || typeof message !== 'string') {
      return error(400, { message: 'Invalid message format' });
    }

    if (!dialect || !dialectNames[dialect as Dialect]) {
      return error(400, { message: 'Invalid dialect' });
    }

    // Build conversation history for context
    const conversationHistory: ChatMessage[] = conversation?.slice(-10) || []; // Last 10 messages for context
    
    const dialectName = dialectNames[dialect as Dialect];
    
    const systemPrompt = `You are a friendly and patient Arabic tutor specializing in ${dialectName}. Your role is to have natural conversations with students learning Arabic.

IMPORTANT GUIDELINES:
- Students may ask questions in BOTH Arabic and English - understand and respond appropriately
- If a student asks in English (e.g., "how do I say X in Arabic", "what does Y mean", "how do you say hello"), provide a helpful response
- Always respond in ${dialectName} (Arabic text) regardless of the language the student used
- When translating English phrases to Arabic, provide the translation in ${dialectName}
- Keep responses conversational, natural, and appropriate for language learners
- Be encouraging and supportive
- Keep responses concise (1-3 sentences typically)
- Use vocabulary appropriate for the student's level based on the conversation
- If the student makes mistakes, gently correct them in a helpful way
- Ask follow-up questions to keep the conversation going
- Respond as if you're having a real conversation, not as a formal teacher

EXAMPLES:
- Student: "How do I say hello in Arabic?" → Respond with the ${dialectName} greeting
- Student: "What does كلمة mean?" → Explain the meaning in ${dialectName}
- Student: "مرحبا" → Respond naturally in ${dialectName}

After your Arabic response, you must also provide:
1. An English translation of your response
2. A transliteration (phonetic spelling using Latin letters) of your Arabic response

Format your response as JSON with this exact structure:
{
  "arabic": "your Arabic response here",
  "english": "English translation here",
  "transliteration": "transliteration here"
}`;

    // Prepare messages for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
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
        // Fallback: create a structured response from plain text
        parsedResponse = {
          arabic: responseContent,
          english: responseContent,
          transliteration: responseContent
        };
      }
    }

    // Validate the response structure
    if (!parsedResponse.arabic || !parsedResponse.english || !parsedResponse.transliteration) {
      // If structure is incomplete, use the Arabic text for all fields as fallback
      parsedResponse = {
        arabic: parsedResponse.arabic || responseContent,
        english: parsedResponse.english || responseContent,
        transliteration: parsedResponse.transliteration || responseContent
      };
    }

    // Note: Nile4 model removed from tutor route to reduce latency
    // Using ChatGPT response directly for faster responses

    return json({ 
      arabic: parsedResponse.arabic,
      english: parsedResponse.english,
      transliteration: parsedResponse.transliteration,
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    console.error('Tutor chat error:', e);
    return error(500, { 
      message: 'I\'m having trouble responding right now. Please try again in a moment.' 
    });
  }
};

