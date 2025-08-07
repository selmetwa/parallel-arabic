import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from "openai";

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const openai = new OpenAI({ apiKey: env['OPEN_API_KEY'] });
    const { message, conversation } = await request.json();

    if (!message || typeof message !== 'string') {
      return error(400, { message: 'Invalid message format' });
    }

    // Build conversation history for context
    const conversationHistory: ChatMessage[] = conversation?.slice(-10) || []; // Last 10 messages for context
    
    const systemPrompt = `You are an expert Arabic learning assistant. You help students learn Arabic language, culture, and provide educational support. 

Your expertise includes:
- Arabic grammar and syntax
- Vocabulary building
- Pronunciation guidance
- Writing systems (Arabic script)
- Different Arabic dialects (Egyptian, Levantine, Gulf/Khaleeji, Moroccan/Darija, Fusha/MSA)
- Arabic culture and traditions
- Language learning strategies
- Common mistakes and how to avoid them

Guidelines:
- Keep responses helpful, encouraging, and educational
- Provide clear explanations with examples when possible
- If showing Arabic text, include transliteration and English translation
- Be patient and supportive, especially with beginners
- If you don't know something specific, say so and suggest reliable resources
- Keep responses concise but comprehensive
- Use simple language when explaining complex concepts
- Encourage practice and provide actionable advice

The user may ask about grammar rules, vocabulary, pronunciation, culture, or need help with Arabic text. Always aim to be educational and supportive.`;

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
      max_tokens: 500, // Keep responses reasonably sized for chat
      top_p: 0.9,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return json({ 
      message: response,
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    console.error('Chat support error:', e);
    return error(500, { 
      message: 'I\'m having trouble responding right now. Please try again in a moment.' 
    });
  }
}; 