import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { type Dialect } from '$lib/types/index';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { createTranslationResponseSchema } from '$lib/utils/gemini-schemas';
import { generateContentWithRetry, GeminiApiError } from '$lib/utils/gemini-api-retry';
import { 
  buildLearnerContext, 
  formatLearnerContextForPrompt,
  getOrCreateConversation,
  saveMessage
} from '$lib/utils/tutor-memory';

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

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const apiKey = env['GEMINI_API_KEY'];
    if (!apiKey) {
      return error(500, { message: 'GEMINI_API_KEY is not configured' });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const { message, dialect, conversation, conversationId: clientConversationId } = await request.json();

    if (!message || typeof message !== 'string') {
      return error(400, { message: 'Invalid message format' });
    }

    if (!dialect || !dialectNames[dialect as Dialect]) {
      return error(400, { message: 'Invalid dialect' });
    }

    // Get user ID from session
    // @ts-expect-error - safeGetSession exists on locals at runtime
    const { user } = await locals.safeGetSession();
    const userId = user?.id;

    // Build learner context if user is logged in
    let learnerContextString = '';
    let conversationId = clientConversationId;
    
    if (userId) {
      try {
        // Build rich learner context
        const learnerContext = await buildLearnerContext(userId, dialect);
        learnerContextString = formatLearnerContextForPrompt(learnerContext);
        
        // Get or create conversation for persistence
        if (!conversationId) {
          conversationId = await getOrCreateConversation(userId, dialect);
        }
        
        // Save the user's message
        await saveMessage(conversationId, 'user', null, message, null, null);
      } catch (contextError) {
        console.error('Error building learner context:', contextError);
        // Continue without context - don't break the chat
      }
    }

    // Build conversation history for context
    const conversationHistory: ChatMessage[] = conversation?.slice(-10) || []; // Last 10 messages for context
    
    const dialectName = dialectNames[dialect as Dialect];
    
    // Build adaptive system prompt with learner context
    const systemPrompt = `You are a friendly, patient, and encouraging Arabic tutor specializing in ${dialectName}. You're having a natural conversation with a student learning Arabic.

${learnerContextString ? `
=== PERSONALIZED CONTEXT ===
${learnerContextString}
=== END CONTEXT ===

Use this context to personalize your responses:
- Reference topics from previous sessions when relevant
- Use vocabulary the student knows to build confidence
- Incorporate words they're learning to reinforce them
- Be aware of their weaknesses and help address them gently
- Adapt your language complexity to their proficiency level
` : ''}

IMPORTANT GUIDELINES:
- Students may ask questions in BOTH Arabic and English - understand and respond appropriately
- If a student asks in English (e.g., "how do I say X in Arabic", "what does Y mean", "how do you say hello"), provide a helpful response
- Always respond in ${dialectName} (Arabic text) regardless of the language the student used
- When translating English phrases to Arabic, provide the translation in ${dialectName}
- Keep responses conversational, natural, and appropriate for language learners
- Be encouraging and supportive - celebrate progress!
- Keep responses concise (1-3 sentences typically) unless explaining something complex
- Use vocabulary appropriate for the student's level based on the conversation and their profile
- If the student makes mistakes, gently correct them in a helpful way
- Ask follow-up questions to keep the conversation going
- Respond as if you're having a real conversation, not as a formal teacher
- Remember: you're building a relationship with this student over time

PERSONALIZATION TIPS:
- If this is a new student, welcome them warmly and ask what they'd like to learn today
- If you know their interests, try to incorporate them into the conversation
- If they've been studying for a while (high streak), acknowledge their dedication
- Only use the student's name if it's an actual name (not a number or ID)
- NEVER include random numbers, IDs, or codes in your response

EXAMPLES:
- Student: "How do I say hello in Arabic?" → Respond with the ${dialectName} greeting and maybe ask how they're doing
- Student: "What does كلمة mean?" → Explain the meaning in ${dialectName}
- Student: "مرحبا" → Respond naturally in ${dialectName}, perhaps with a follow-up question

After your Arabic response, you must also provide:
1. An English translation of your response
2. A transliteration (phonetic spelling using Latin letters) of your Arabic response

Format your response as JSON with this exact structure:
{
  "arabic": "your Arabic response here",
  "english": "English translation here",
  "transliteration": "transliteration here"
}`;

    // Build conversation context
    const conversationContext = conversationHistory.map((msg: ChatMessage) => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    
    const fullPrompt = `${systemPrompt}\n\n${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}User: ${message}\n\nAssistant:`;

    const translationSchema = createTranslationResponseSchema();
    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.0-flash",
      contents: fullPrompt,
      // @ts-expect-error - generationConfig is valid but types may be outdated
      generationConfig: {
        temperature: 0.8, // Slightly higher for more natural conversation
        maxOutputTokens: 600,
        topP: 0.9,
        responseMimeType: 'application/json',
        responseJsonSchema: translationSchema.jsonSchema
      }
    });

    const responseContent = response.text;

    console.log('Tutor response:', responseContent?.substring(0, 200));
    if (!responseContent) {
      throw new Error('No response from Gemini');
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = parseJsonFromGeminiResponse(responseContent, translationSchema.zodSchema);
    } catch (parseError) {
      // Fallback: create a structured response from plain text
      parsedResponse = {
        arabic: responseContent,
        english: responseContent,
        transliteration: responseContent
      };
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

    // Save the tutor's response if we have a conversation
    if (userId && conversationId) {
      try {
        await saveMessage(
          conversationId, 
          'tutor', 
          parsedResponse.arabic, 
          parsedResponse.english, 
          parsedResponse.transliteration, 
          null
        );
      } catch (saveError) {
        console.error('Error saving tutor message:', saveError);
        // Don't break the response
      }
    }

    return json({ 
      arabic: parsedResponse.arabic,
      english: parsedResponse.english,
      transliteration: parsedResponse.transliteration,
      conversationId: conversationId || null, // Return for client to track
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    console.error('Tutor chat error:', e);
    
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
