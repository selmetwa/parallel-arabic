import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from "@google/genai";
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import { 
  getConversationMessages,
  updateConversationSummary,
  upsertLearningInsight
} from '$lib/utils/tutor-memory';
import { z } from 'zod';

// Schema for the summary response (vocabulary is extracted directly from messages, not from AI)
const SummaryResponseSchema = z.object({
  summary: z.string().describe('A 1-2 sentence summary of the main topics and activities in the conversation'),
  topics: z.array(z.string()).describe('List of 2-5 main topics discussed'),
  insights: z.array(z.object({
    type: z.enum(['weakness', 'strength', 'topic_interest', 'vocabulary_gap']),
    content: z.string().describe('A brief description of the insight')
  })).describe('Learning insights observed from the conversation')
});

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const apiKey = env['GEMINI_API_KEY'];
    if (!apiKey) {
      return error(500, { message: 'GEMINI_API_KEY is not configured' });
    }

    // @ts-expect-error - safeGetSession exists on locals at runtime
    const { user } = await locals.safeGetSession();
    
    if (!user) {
      return error(401, { message: 'Not authenticated' });
    }

    const { conversationId, dialect } = await request.json();

    if (!conversationId) {
      return error(400, { message: 'conversationId is required' });
    }

    // Get all messages from the conversation
    const messages = await getConversationMessages(conversationId);
    
    console.log(`[tutor-summarize] Found ${messages.length} messages for conversation ${conversationId}`);

    if (messages.length < 2) {
      // Not enough messages to summarize
      console.log('[tutor-summarize] Not enough messages, skipping');
      return json({ success: true, skipped: true, reason: 'Not enough messages', messageCount: messages.length });
    }

    // EXTRACT VOCABULARY DIRECTLY FROM MESSAGES (no AI needed for this!)
    // Each tutor message has arabic, english, and transliteration
    const vocabularyMap = new Map<string, { arabic: string; english: string; transliteration: string }>();
    
    for (const msg of messages) {
      if (msg.role === 'tutor' && msg.arabic && msg.english && msg.transliteration) {
        // Add the full sentence as vocabulary
        const key = msg.arabic.trim();
        if (!vocabularyMap.has(key)) {
          vocabularyMap.set(key, {
            arabic: msg.arabic.trim(),
            english: msg.english.trim(),
            transliteration: msg.transliteration.trim()
          });
        }
      }
    }
    
    const extractedVocabulary = Array.from(vocabularyMap.values());
    console.log(`[tutor-summarize] Extracted ${extractedVocabulary.length} vocabulary items from messages`);

    const ai = new GoogleGenAI({ apiKey });

    // Build conversation text for AI analysis (summary, topics, insights only)
    const conversationText = messages.map(m => {
      const role = m.role === 'user' ? 'Student' : 'Tutor';
      const arabicText = m.arabic ? `[Arabic: ${m.arabic}]` : '';
      const englishText = m.english ? `[English: ${m.english}]` : '';
      return `${role}: ${arabicText} ${englishText}`.trim();
    }).join('\n');
    
    console.log('[tutor-summarize] Conversation text:', conversationText.substring(0, 500));

    const systemPrompt = `You are analyzing an Arabic learning conversation between a student and an AI tutor.

CONVERSATION TO ANALYZE:
---
${conversationText}
---

INSTRUCTIONS:
Analyze this conversation and provide:

1. SUMMARY: Write 1-2 sentences describing what the student learned or practiced in this session.

2. TOPICS: List 2-5 specific topics that were covered (e.g., "greetings", "food vocabulary", "verb conjugation", "asking questions", "family words", "numbers", "colors").

3. INSIGHTS: Based on the conversation, identify learning insights:
   - "weakness": Things the student struggled with or made mistakes on
   - "strength": Things the student did well or understood quickly  
   - "topic_interest": Topics the student asked about or seemed engaged with
   - "vocabulary_gap": Areas where the student needs more vocabulary

Be specific and actionable with insights.

EXAMPLE OUTPUT:
{
  "summary": "The student practiced basic greetings and learned how to introduce themselves in Egyptian Arabic.",
  "topics": ["greetings", "introductions", "asking about wellbeing"],
  "insights": [
    {"type": "topic_interest", "content": "Interested in learning basic greetings"},
    {"type": "strength", "content": "Quick to pick up pronunciation"}
  ]
}

You MUST provide at least 2 topics and at least 1 insight.
Respond with valid JSON only.`;

    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.0-flash",
      contents: systemPrompt,
      // @ts-expect-error - generationConfig is valid but types may be outdated
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000, // Increased for detailed vocabulary extraction
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text;
    
    console.log('[tutor-summarize] Raw AI response:', responseText?.substring(0, 1000));
    
    if (!responseText) {
      throw new Error('No response from AI');
    }

    // Parse the AI response (for summary, topics, insights only)
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
      console.log('[tutor-summarize] Parsed JSON:', JSON.stringify(parsedResponse, null, 2).substring(0, 500));
      parsedResponse = SummaryResponseSchema.parse(parsedResponse);
    } catch (parseError) {
      console.error('[tutor-summarize] Error parsing summary response:', parseError);
      console.error('[tutor-summarize] Raw response was:', responseText);
      // Create a minimal summary based on what we can extract
      try {
        const rawParsed = JSON.parse(responseText);
        parsedResponse = {
          summary: rawParsed.summary || 'Conversation with the Arabic tutor',
          topics: Array.isArray(rawParsed.topics) ? rawParsed.topics : [],
          insights: Array.isArray(rawParsed.insights) ? rawParsed.insights : []
        };
      } catch {
        parsedResponse = {
          summary: 'Conversation with the Arabic tutor',
          topics: [],
          insights: []
        };
      }
    }

    // Return the full data to the client
    // Vocabulary comes from our direct message extraction, not from AI!
    return json({
      success: true,
      summary: parsedResponse.summary,
      topics: parsedResponse.topics,
      vocabulary: extractedVocabulary, // From messages, not AI!
      insights: parsedResponse.insights,
      conversationId,
      dialect
    });

  } catch (e) {
    console.error('Summarization error:', e);
    return error(500, { message: 'Failed to summarize conversation' });
  }
};

