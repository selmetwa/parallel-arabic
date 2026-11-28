import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { RequestHandler } from './$types';
import { isDialect } from '$lib/constants/dialects';
import {
	ANON_TRANSLATE_COOKIE,
	ANON_TRANSLATE_LIMIT,
	IP_TRANSLATE_LIMIT,
	IP_TRANSLATE_WINDOW_SECONDS,
	parseTranslateInput,
	translationCacheKey
} from '$lib/constants/translator';
import { getDialectName, getDialectSystemInstruction } from '$lib/data/dialect-rules-v2';
import { consumeRateLimit, getCached, setCached } from '$lib/server/redis';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';

/**
 * The free translator on /{dialect}/translator. Open to signed-out visitors,
 * so it is capped like /api/speech-to-text: the cookie is the UX allowance,
 * the IP window is the cost ceiling. Translations are cached, since the same
 * short phrases come up again and again.
 */

// Flat, so the schema stays well inside Gemini's state limit.
const resultSchema = z.object({
	arabic: z.string(),
	transliteration: z.string()
});
type Translation = z.infer<typeof resultSchema>;
const resultJsonSchema = zodToJsonSchema(resultSchema);

const CACHE_SECONDS = 60 * 60 * 24 * 30;

export const POST: RequestHandler = async ({ request, locals, cookies, getClientAddress }) => {
	// No App.Locals declaration in this project; narrowed here as in /api/speech-to-text.
	const { user } = locals as { user?: { id: string } | null };
	const signedIn = !!user;

	const parsed = parseTranslateInput(await request.json().catch(() => null), isDialect);
	if (!parsed.ok) return json({ error: parsed.error }, { status: 400 });
	const { input } = parsed;

	const { allowed } = await consumeRateLimit(
		`translate:ip:${getClientAddress()}`,
		IP_TRANSLATE_LIMIT,
		IP_TRANSLATE_WINDOW_SECONDS
	);
	if (!allowed) {
		return json({ error: 'Too many translations. Please try again later.' }, { status: 429 });
	}

	const used = signedIn ? 0 : Number(cookies.get(ANON_TRANSLATE_COOKIE)) || 0;
	if (!signedIn && used >= ANON_TRANSLATE_LIMIT) {
		return json({ error: 'Free limit reached', limitReached: true }, { status: 403 });
	}

	const cacheKey = translationCacheKey(input);
	let result = await getCached<Translation>(cacheKey);

	if (!result) {
		const apiKey = env['GEMINI_API_KEY'];
		if (!apiKey) return json({ error: 'Translation is unavailable right now' }, { status: 500 });

		const name = getDialectName(input.dialect);
		const prompt = [
			`Translate this into natural, everyday spoken ${name}, the way a native speaker would say it in conversation.`,
			`If the text is already Arabic, rewrite it in ${name}.`,
			`If the phrase depends on who is being addressed, assume one man is being addressed.`,
			`Return the Arabic script without tashkeel, and a Latin transliteration that uses 3 for ع, 7 for ح, 2 for a glottal stop, kh for خ, gh for غ and sh for ش.`,
			``,
			`Text: "${input.text}"`
		].join('\n');

		try {
			const ai = new GoogleGenAI({ apiKey });
			const response = await generateContentWithRetry(ai, {
				model: 'gemini-2.5-flash',
				contents: prompt,
				config: {
					systemInstruction: getDialectSystemInstruction(input.dialect),
					temperature: 0.3,
					responseMimeType: 'application/json',
					responseJsonSchema: resultJsonSchema
				}
			});
			result = parseJsonFromGeminiResponse(response.text || '{}', resultSchema);
		} catch (e) {
			console.error('Error translating:', e);
			return json({ error: 'Translation failed. Please try again.' }, { status: 500 });
		}

		await setCached(cacheKey, result, CACHE_SECONDS);
	}

	let remaining: number | null = null;
	if (!signedIn) {
		cookies.set(ANON_TRANSLATE_COOKIE, String(used + 1), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24
		});
		remaining = ANON_TRANSLATE_LIMIT - (used + 1);
	}

	return json({ ...result, remaining });
};
