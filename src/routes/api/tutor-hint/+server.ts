import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { type Dialect } from '$lib/types/index';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { textWithTranslationSchema } from '$lib/utils/gemini-schemas';
import { generateContentWithRetry, GeminiApiError } from '$lib/utils/gemini-api-retry';
import { zodToJsonSchema } from 'zod-to-json-schema';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const dialectNames: Record<Dialect, string> = {
  fusha: 'Modern Standard Arabic (Fusha)',
  levantine: 'Levantine Arabic',
  darija: 'Moroccan Darija',
  'egyptian-arabic': 'Egyptian Arabic',
  iraqi: 'Iraqi Arabic',
  khaleeji: 'Khaleeji Arabic'
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const apiKey = env['GEMINI_API_KEY'];
    if (!apiKey) {
      return error(500, { message: 'GEMINI_API_KEY is not configured' });
    }

    const {
      dialect,
      conversation,
      scenarioTitle,
      scenarioDescription,
      otherRole,
      proficiencyLevel
    } = await request.json();

    if (!dialect || !dialectNames[dialect as Dialect]) {
      return error(400, { message: 'Invalid dialect' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const dialectName = dialectNames[dialect as Dialect];
    const history: ChatMessage[] = Array.isArray(conversation) ? conversation.slice(-8) : [];
    const level = (typeof proficiencyLevel === 'string' && proficiencyLevel.trim()) ? proficiencyLevel.trim() : 'A1';

    const speakerLabel = otherRole && typeof otherRole === 'string' ? otherRole : 'Tutor';
    const conversationContext = history.length
      ? history.map((m) => `${m.role === 'user' ? 'Student' : speakerLabel}: ${m.content}`).join('\n')
      : '(no messages yet)';

    const scenarioBlock = scenarioTitle
      ? `SCENARIO: "${scenarioTitle}"${scenarioDescription ? ` — ${scenarioDescription}` : ''}
The student is roleplaying as themselves. The other party is "${speakerLabel}".`
      : `FREE CONVERSATION (no scripted scenario). The student is chatting with their Arabic tutor.`;

    const prompt = `You are helping an Arabic learner know what to say next in a conversation.

${scenarioBlock}

Target dialect: ${dialectName}.
Student's proficiency level: ${level} (CEFR). Calibrate vocabulary and sentence length to this level.

Recent conversation so far:
${conversationContext}

Generate the NEXT line the student could naturally say, based on what ${speakerLabel} just said. The MOST IMPORTANT goal: the line must KEEP THE CONVERSATION GOING and give ${speakerLabel} a clear reason to reply.

To keep it going, the line should do at least one of these:
- ask ${speakerLabel} a relevant question back,
- share a new detail about the student that invites a follow-up, or
- open a natural next sub-topic that fits the scenario.

Rules:
- Sound natural, not robotic. Use everyday phrasing for ${dialectName}.
- Do NOT produce dead-end / closing lines like "Thanks", "I'm good", "Okay", or goodbyes — UNLESS the conversation is genuinely meant to wrap up.
- Stay on-topic${scenarioTitle ? ` and move toward the goal of the scenario ("${scenarioTitle}")` : ''}.
- Do NOT repeat lines the student has already said, and don't just echo ${speakerLabel}'s question back unchanged.
- If a name or place would be needed, leave a "___" blank for the student to fill in.
- Calibrate to level ${level}: for A1/A2 keep it short (3-8 words) but still open-ended — usually a short question works best. For B1+ a fuller sentence with a follow-up is great.

Respond as JSON with this exact shape:
{
  "arabic": "...",
  "transliteration": "...",
  "english": "..."
}`;

    const schemaJson = zodToJsonSchema(textWithTranslationSchema);

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        // Disable thinking — gemini-2.5-flash's thinking tokens count against
        // maxOutputTokens and can leave no room for the actual JSON output.
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        responseJsonSchema: schemaJson
      }
    });

    const responseContent = response.text;
    if (!responseContent) {
      throw new Error('No response from Gemini');
    }

    const parsed = parseJsonFromGeminiResponse(responseContent, textWithTranslationSchema);

    return json({
      arabic: parsed.arabic,
      transliteration: parsed.transliteration,
      english: parsed.english
    });
  } catch (e) {
    console.error('Tutor hint error:', e);
    if (e instanceof GeminiApiError && e.is503) {
      return error(503, { message: 'Our service is currently busy. Please try again.' });
    }
    return error(500, { message: 'Failed to generate hint.' });
  }
};
