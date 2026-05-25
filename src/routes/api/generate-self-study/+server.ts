import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenAI } from '@google/genai';
import { env } from '$env/dynamic/private';
import { createSelfStudySchema } from '$lib/schemas/self-study-schema';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import { supabase } from '$lib/supabaseClient';

// Extract the outermost JSON object from the response, regardless of
// markdown wrappers or trailing content after the closing brace.
function extractJson(text: string): string {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) return text.trim();
    return text.substring(start, end + 1);
}

export const POST: RequestHandler = async ({ request, locals }) => {
    const { wordList, grammarNotes, dialect, level, sessionLength } = await request.json();

    if (!wordList?.trim() || !grammarNotes?.trim()) {
        return json({ error: 'Word list and grammar notes are required' }, { status: 400 });
    }
    if (!dialect) {
        return json({ error: 'Dialect is required' }, { status: 400 });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
        return json({ error: 'API key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const schema = createSelfStudySchema();
    const schemaString = JSON.stringify(schema.jsonSchema, null, 2);

    const dialectLabel: Record<string, string> = {
        'egyptian-arabic': 'Egyptian Arabic (Masri)',
        'levantine': 'Levantine Arabic',
        'darija': 'Moroccan Darija',
        'fusha': 'Modern Standard Arabic (Fusha)',
        'iraqi': 'Iraqi Arabic',
        'khaleeji': 'Khaleeji Arabic'
    };
    const dialectName = dialectLabel[dialect] || dialect;

    // Resolve target step count. 999 = "all vocab" → generous ceiling
    const targetSteps: number = (!sessionLength || sessionLength >= 999) ? 80 : sessionLength;

    const prompt = `You are generating a self-study Arabic review session for a learner who just had a session with their human tutor.

LEARNER INPUT:
- Dialect: ${dialectName}
- Level: ${level || 'intermediate'}
- Target step count: ${targetSteps === 80 ? 'as many as needed to cover every vocabulary word at least twice' : targetSteps}
- Raw vocabulary list from tutor:
${wordList}

- Raw grammar notes from tutor:
${grammarNotes}

════════════════════════════════════
STEP 1 — PARSE
════════════════════════════════════
Parse the vocabulary list into structured words (arabic, english, transliteration).
Include ALL meaningful words — skip only meta-notes or formatting artifacts.

Parse the grammar concept: main verb/structure, English meaning, a plain-English rule, and a conjugation table covering all 8 pronouns (أنا، إنت، إنتِ، هو، هي، إحنا، إنتوا، هما) or dialect equivalents.

════════════════════════════════════
STEP 2 — GENERATE STEPS
════════════════════════════════════
Generate exactly ${targetSteps === 80 ? 'enough steps to touch every vocabulary word at least twice (aim for 50–80 steps)' : targetSteps + ' steps'}.

Mix these step types in an engaging sequence. Use the exact field names from the schema below.

──────────────────────
STEP TYPES
──────────────────────

TYPE: "reading"
Fields: title, passageArabic, passageEnglish, passageTransliteration, wordAlignments, tip (optional)
Rules:
- A natural 4–8 sentence paragraph using AT LEAST 10 vocab words AND the grammar verb
- tip: explain how the grammar verb appears in the passage
- wordAlignments: one entry per space-delimited Arabic token in passageArabic, in the same order:
    { arabic: "the token as-is", english: "English gloss for that single word", transliteration: "romanized form" }
  Every token in passageArabic must have a corresponding entry — do NOT skip punctuation-attached tokens.

TYPE: "multiple-choice" — TWO MODES:

  MODE A — English question, Arabic options (questionLanguage: "english"):
    question: in English — asks for the Arabic word given an English meaning.
      CORRECT: "Which word means 'culture'?" / "Which Arabic word means 'to recommend'?"
      NEVER:   "What does 'ثقافة' mean?" ← this form belongs in Mode B, not Mode A.
    options: 4 items each with { id, arabic, transliteration, isCorrect }
    All Arabic text must be in ${dialectName}.

  MODE B — Arabic question, English options (questionLanguage: "arabic"):
    question: in Arabic — gives an Arabic word and asks for its English meaning.
      e.g. "ما معنى كلمة 'ثقافة'؟"
    options: 4 items each with { id, english, isCorrect }
    arabic and transliteration fields are omitted.
    CRITICAL: Mode B options MUST be English words/phrases — NEVER Arabic.

Rules for ALL multiple-choice:
- focus: "vocabulary" or "grammar"
- explanation: why the correct answer is right
- EXACTLY 4 options, EXACTLY one with isCorrect: true
- All option values must be unique

TYPE: "writing"
Fields: promptEnglish, targetArabic, targetArabicTashkeel, hint (transliteration), tip (grammar reminder)
Rules:
- promptEnglish: English sentence the learner must translate into ${dialectName}
- targetArabic: the canonical correct Arabic answer — NO diacritics (clean Arabic only)
- targetArabicTashkeel: SAME sentence as targetArabic but WITH complete tashkeel/diacritics (fatha, kasra, damma, sukun, shadda, tanwin) to help learners with pronunciation
- hint: transliteration of targetArabic (shown when learner asks for a hint)

TYPE: "speaking"
Fields: speakingEnglish, speakingArabic, speakingTransliteration, tip (optional)
Rules: natural, conversational sentences — not textbook Arabic

──────────────────────
SEQUENCE GUIDELINES
──────────────────────
- Open with a reading passage (step 1)
- Then interleave: vocab multiple-choice (mode A) → grammar multiple-choice → writing → speaking → reading → repeat
- Every vocab word from the list should appear in at least one multiple-choice question AND at least one writing or speaking step
- Use mode B (Arabic question) for roughly 30% of multiple-choice steps to give reading practice
- Distribute writing steps evenly — roughly one per 4–5 steps
- Include a speaking step every 5–6 steps
- Add a second reading passage midway and a third near the end
- End with 3–5 mixed review multiple-choice steps

════════════════════════════════════
RULES
════════════════════════════════════
- All Arabic text must be in ${dialectName} ONLY (not MSA unless dialect is fusha)
- Use diacritical marks SPARINGLY — only for pronunciation clarity
- The vocabulary array must include ALL words parsed from the tutor list
- The conjugationTable must have exactly 8 rows (one per pronoun)

════════════════════════════════════
OUTPUT
════════════════════════════════════
Return PURE JSON only. No markdown. No code blocks. No explanation.
Start with { and end with }.
Match this schema exactly:
${schemaString}`;

    try {
        const response = await generateContentWithRetry(ai, {
            model: 'gemini-2.5-flash',
            contents: prompt,
            // @ts-expect-error - generationConfig valid but types may be outdated
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 32000,
                responseMimeType: 'application/json',
                responseJsonSchema: schema.jsonSchema
            }
        });

        const rawText = response.text;
        if (!rawText) throw new Error('No content generated');

        const cleanText = extractJson(rawText);

        let sessionData;
        try {
            sessionData = schema.zodSchema.parse(JSON.parse(cleanText));
        } catch (parseError) {
            console.error('[generate-self-study] Parse/validation error:', parseError);
            console.error('[generate-self-study] Raw response preview:', rawText.substring(0, 500));
            throw new Error(`Failed to parse Gemini response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }

        sessionData.dialect = dialect;

        // Persist immediately (same pattern as generate-lesson) so abandoned
        // sessions are still recoverable. Persistence is best-effort — if the
        // user is anonymous or storage/DB fails, generation still succeeds.
        let sessionId: string | null = null;
        try {
            // @ts-expect-error - safeGetSession exists on locals at runtime
            const { user } = await locals.safeGetSession();
            if (user?.id) {
                const id = crypto.randomUUID();
                const fileName = `${id}.json`;

                const { error: storageError } = await supabase.storage
                    .from('generated_self_study')
                    .upload(fileName, JSON.stringify(sessionData), {
                        contentType: 'application/json',
                        upsert: true
                    });

                if (storageError) {
                    console.error('[generate-self-study] Storage upload failed:', storageError);
                } else {
                    const { error: dbError } = await supabase.from('self_study_sessions').insert({
                        id,
                        user_id: user.id,
                        title: sessionData.title,
                        dialect: sessionData.dialect,
                        level: sessionData.level ?? 'intermediate',
                        vocab_count: sessionData.vocabulary?.length ?? 0,
                        step_count: sessionData.steps?.length ?? 0,
                        score_percent: null,
                        session_data_key: fileName,
                        created_at: Date.now()
                    });
                    if (dbError) {
                        console.error('[generate-self-study] DB insert failed:', dbError);
                    } else {
                        sessionId = id;
                    }
                }
            }
        } catch (persistError) {
            console.error('[generate-self-study] Persistence error (non-fatal):', persistError);
        }

        return json({ success: true, session: sessionData, sessionId });

    } catch (error) {
        console.error('[generate-self-study] Error:', error);
        return json({
            error: 'Failed to generate session',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};
