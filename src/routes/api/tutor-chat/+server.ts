import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { type Dialect } from '$lib/types/index';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { createTranslationWithAlignmentsSchema } from '$lib/utils/gemini-schemas';
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

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Normalize whatever the profile stores ("A1", "beginner", "Upper Int.", …) to a
// CEFR level so we can calibrate response length/complexity to the learner.
function normalizeCefrLevel(input?: string | null): CefrLevel {
  const s = (input || '').toUpperCase();
  const m = s.match(/[ABC][12]/);
  if (m) return m[0] as CefrLevel;
  if (s.includes('BEGIN')) return 'A1';
  if (s.includes('ELEMENT')) return 'A2';
  if (s.includes('UPPER')) return 'B2';
  if (s.includes('INTER')) return 'B1';
  if (s.includes('ADVAN')) return 'C1';
  if (s.includes('PROFIC') || s.includes('FLUENT') || s.includes('MASTER')) return 'C2';
  return 'A1';
}

// Per-level response calibration. This is the single most important control on
// tutor output: responses must match the learner's level — short/simple for A1,
// progressively longer/richer toward C2.
const LEVEL_GUIDANCE: Record<CefrLevel, string> = {
  A1: 'Reply with ONE very short sentence (about 4–8 words). Use only the most common, basic everyday words and simple present tense. No idioms, no subordinate clauses. Be as simple as possible.',
  A2: 'Reply with 1–2 short, simple sentences. Use common everyday vocabulary and basic past/present tense. Keep grammar simple and avoid idioms.',
  B1: 'Reply with 2–3 sentences. You may introduce some new vocabulary when context makes it clear. Use common connectors and a mix of tenses.',
  B2: 'Reply with 3–4 sentences. Use richer, more varied vocabulary, a range of tenses, and the occasional idiom. You can touch on more abstract topics.',
  C1: 'Reply with 4–5 sentences of natural, near-native speech. Use nuanced vocabulary, idioms, and cultural references freely.',
  C2: 'Reply naturally as you would with a fluent native speaker — full complexity, nuance, idioms and sophisticated vocabulary, at whatever length fits the conversation.'
};

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const apiKey = env['GEMINI_API_KEY'];
    if (!apiKey) {
      return error(500, { message: 'GEMINI_API_KEY is not configured' });
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const { message, dialect, conversation, conversationId: clientConversationId, proficiencyLevel: clientProficiencyLevel } = await request.json();

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
    // Effective level: client-provided wins, then the stored profile, then A1.
    let level: CefrLevel = normalizeCefrLevel(clientProficiencyLevel);

    if (userId) {
      try {
        // Build learner context and get/create conversation in parallel
        const [learnerContext, resolvedId] = await Promise.all([
          buildLearnerContext(userId, dialect),
          conversationId ? Promise.resolve(conversationId) : getOrCreateConversation(userId, dialect)
        ]);
        learnerContextString = formatLearnerContextForPrompt(learnerContext);
        conversationId = resolvedId;
        if (!clientProficiencyLevel && learnerContext.profile.proficiency_level) {
          level = normalizeCefrLevel(learnerContext.profile.proficiency_level);
        }

        // Save user message without blocking the Gemini call
        saveMessage(conversationId, 'user', null, message, null, null).catch(e =>
          console.error('Error saving user message:', e)
        );
      } catch (contextError) {
        console.error('Error building learner context:', contextError);
        // Continue without context - don't break the chat
      }
    }

    // Build conversation history for context
    const conversationHistory: ChatMessage[] = conversation || [];
    
    const dialectName = dialectNames[dialect as Dialect];
    
    // Build adaptive system prompt with learner context
    const systemPrompt = `You are a friendly, patient, and encouraging Arabic tutor specializing in ${dialectName}. You're having a natural conversation with a student learning Arabic.

=== RESPONSE LEVEL — MOST IMPORTANT RULE ===
The student's level is ${level} (CEFR). Calibrate EVERY response to this level:
${LEVEL_GUIDANCE[level]}
This overrides any other guidance about length. A reply that is too long, or uses vocabulary/grammar above ${level}, is a failure even if otherwise correct. Stay at or just slightly above the student's level so they can follow and learn.
=== END RESPONSE LEVEL ===

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
- Match response length and complexity to the RESPONSE LEVEL rule above — this is the authority on how long/complex your reply should be
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
  "transliteration": "transliteration here",
  "wordAlignments": [
    { "arabic": "first Arabic word", "english": "its literal English meaning", "transliteration": "its transliteration" },
    { "arabic": "second Arabic word", "english": "its literal English meaning", "transliteration": "its transliteration" }
  ]
}

IMPORTANT: wordAlignments must have one entry per Arabic word in your response, in the same order they appear. Provide the literal/gloss English meaning for each word (not the full sentence translation).`;

    // Build conversation context
    const conversationContext = conversationHistory.map((msg: ChatMessage) => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    
    const fullPrompt = `${systemPrompt}\n\n${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}User: ${message}\n\nAssistant:`;

    const translationSchema = createTranslationWithAlignmentsSchema();
    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        temperature: 0.8, // Slightly higher for more natural conversation
        maxOutputTokens: 4096,
        topP: 0.9,
        // gemini-2.5-flash "thinks" by default and thinking tokens count against
        // maxOutputTokens. With this heavy prompt the model could spend the whole
        // budget thinking and return no text (finishReason MAX_TOKENS), surfacing
        // as "No response from Gemini". We don't need reasoning for this JSON reply.
        thinkingConfig: { thinkingBudget: 0 },
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
      // Fallback: try raw JSON.parse without schema validation to salvage fields
      try {
        const rawParsed = JSON.parse(responseContent) as Record<string, unknown>;
        if (rawParsed && typeof rawParsed === 'object' && typeof rawParsed.arabic === 'string') {
          parsedResponse = rawParsed;
        } else {
          throw new Error('Missing arabic field in parsed response');
        }
      } catch {
        console.error('Tutor: failed to parse Gemini response as JSON:', responseContent?.substring(0, 200));
        throw new Error('Failed to parse AI response');
      }
    }

    // Guard: reject if any field still contains raw JSON
    const looksLikeJson = (s: string) => s.trimStart().startsWith('{') || s.trimStart().startsWith('[');
    if (looksLikeJson(parsedResponse.arabic) || looksLikeJson(parsedResponse.english)) {
      console.error('Detected raw JSON in tutor response fields, aborting');
      throw new Error('AI response contains unparsed JSON');
    }

    // Validate the response structure
    if (!parsedResponse.arabic || !parsedResponse.english || !parsedResponse.transliteration) {
      console.error('Tutor: incomplete response structure:', JSON.stringify(parsedResponse).substring(0, 200));
      throw new Error('Incomplete AI response structure');
    }

    // Save the tutor's response without blocking the API response
    if (userId && conversationId) {
      saveMessage(conversationId, 'tutor', parsedResponse.arabic, parsedResponse.english, parsedResponse.transliteration, null)
        .catch(e => console.error('Error saving tutor message:', e));
    }

    return json({
      arabic: parsedResponse.arabic,
      english: parsedResponse.english,
      transliteration: parsedResponse.transliteration,
      wordAlignments: parsedResponse.wordAlignments || [],
      conversationId: conversationId || null, // Return for client to track
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    console.error('Tutor chat error:', e);
    
    // Check if it's a 503 error (model overloaded)
    if (e instanceof GeminiApiError && e.is503) {
      return error(503, { 
        message: 'Our service is experiencing high demand. Please try again in a few moments.' 
      });
    }
    
    return error(500, { 
      message: 'I\'m having trouble responding right now. Please try again in a moment.' 
    });
  }
};
