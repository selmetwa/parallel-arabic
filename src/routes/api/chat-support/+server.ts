import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { generateContentWithRetry, GeminiApiError } from '$lib/utils/gemini-api-retry';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const apiKey = env['GEMINI_API_KEY'];
    if (!apiKey) {
      return error(500, { message: 'GEMINI_API_KEY is not configured' });
    }
    
    const ai = new GoogleGenAI({ apiKey });
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

    // Build conversation context
    const conversationContext = conversationHistory.map((msg: ChatMessage) => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    
    const fullPrompt = `${systemPrompt}\n\n${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}User: ${message}\n\nAssistant:`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
        topP: 0.9
      }
    });

    const responseText = response.text;

    if (!responseText) {
      throw new Error('No response from Gemini');
    }

    return json({ 
      message: responseText,
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    console.error('Chat support error:', e);
    
    // Check if it's a 503 error (model overloaded)
    if (e instanceof GeminiApiError && e.is503) {
      return error(503, { 
        message: 'The AI model is currently overloaded. Please try again in a few moments. We\'re working to handle the high demand.' 
      });
    }
    
    return error(500, { 
      message: 'I\'m having trouble responding right now. Please try again in a moment.' 
    });
  }
}; 