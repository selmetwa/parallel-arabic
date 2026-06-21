import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { type Dialect } from '$lib/types/index';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { createScenarioVocabSchema } from '$lib/utils/gemini-schemas';
import { generateContentWithRetry, GeminiApiError } from '$lib/utils/gemini-api-retry';

type ScenarioLine = {
  speaker: 'student' | 'other';
  arabic: string;
  transliteration: string;
  english: string;
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

    const { dialect, scenarioTitle, scenarioDescription, lines, proficiencyLevel } =
      await request.json();

    if (!dialect || !dialectNames[dialect as Dialect]) {
      return error(400, { message: 'Invalid dialect' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const dialectName = dialectNames[dialect as Dialect];
    const level =
      typeof proficiencyLevel === 'string' && proficiencyLevel.trim()
        ? proficiencyLevel.trim()
        : 'A1';

    const scenarioLines: ScenarioLine[] = Array.isArray(lines) ? lines : [];
    const dialogText = scenarioLines.length
      ? scenarioLines
          .map((l) => `${l.speaker === 'student' ? 'Student' : 'Other'}: ${l.arabic} (${l.english})`)
          .join('\n')
      : '(no sample dialog provided)';

    const { zodSchema, jsonSchema } = createScenarioVocabSchema();

    const prompt = `You are an Arabic tutor preparing a beginner for a short roleplay conversation.

SCENARIO: "${scenarioTitle}"${scenarioDescription ? ` — ${scenarioDescription}` : ''}
Target dialect: ${dialectName}.
Student's proficiency level: ${level} (CEFR).

Here is the sample dialog the conversation is based on:
${dialogText}

Produce two things:

1. "vocab": the 6 to 9 MOST important words or short phrases the student will need to take part in this conversation. Favour the words the student themselves will say.

2. "sentences": 3 to 4 short, natural full sentences that BUILD ON the vocab above — each sentence should reuse one or more of the vocab words so the student practises them in context. Keep them beginner-appropriate for level ${level}.

For EVERY item (in both lists) provide:
- "arabic": the word/phrase/sentence in ${dialectName} (beginner-appropriate).
- "transliteration": Latin-letter transliteration.
- "english": the English meaning.
- "teachingLine": one short, warm sentence a tutor would say out loud to introduce it. For vocab, name the English meaning and the transliteration, e.g. "The word for 'my name' is 'ismi'." For sentences, e.g. "Now try a full sentence: 'ana ismi Sara' — 'My name is Sara'." One sentence, no quotes around the whole line.

Respond as JSON with this exact shape:
{
  "vocab": [
    { "arabic": "...", "transliteration": "...", "english": "...", "teachingLine": "..." }
  ],
  "sentences": [
    { "arabic": "...", "transliteration": "...", "english": "...", "teachingLine": "..." }
  ]
}`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.6,
        maxOutputTokens: 4096,
        // Disable thinking — gemini-2.5-flash's thinking tokens count against
        // maxOutputTokens and can leave no room for the actual JSON output.
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        responseJsonSchema: jsonSchema
      }
    });

    const responseContent = response.text;
    if (!responseContent) {
      throw new Error('No response from Gemini');
    }

    const parsed = parseJsonFromGeminiResponse(responseContent, zodSchema);

    return json({ vocab: parsed.vocab, sentences: parsed.sentences });
  } catch (e) {
    console.error('Scenario intro error:', e);
    if (e instanceof GeminiApiError && e.is503) {
      return error(503, { message: 'Our service is currently busy. Please try again.' });
    }
    return error(500, { message: 'Failed to generate scenario vocab.' });
  }
};
