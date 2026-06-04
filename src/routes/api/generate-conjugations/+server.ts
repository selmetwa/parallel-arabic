import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { generateContentWithRetry, GeminiApiError } from '$lib/utils/gemini-api-retry';
import { createConjugationExerciseSchema } from '$lib/utils/gemini-schemas';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';

type DialectKey = 'egyptian-arabic' | 'fusha' | 'levantine' | 'darija';

const DIALECT_CONJUGATION_GUIDE: Record<DialectKey, { name: string; guide: string }> = {
	'egyptian-arabic': {
		name: 'Egyptian Arabic (colloquial, NOT MSA)',
		guide: `- Present tense: prefix بـ (b-) on the imperfect (e.g. باكتب baktib, بتكتب btiktib, بيكتب biyiktib).
- Future tense: prefix هـ (ha-) on the bare imperfect, NO b- (e.g. هاكتب haaktib, هيكتب hayiktib).
- Negation: ما...ش circumfix (e.g. ماكتبتش ma katabtish, مبكتبش mabaktibsh); future negation uses مش (mish hayiktib).
- Past tense suffixes: ana/enta → -t, enti → -ti, howa → bare, heya → -it, ehna → -na, entu → -tu, homma → -u.`
	},
	fusha: {
		name: 'Modern Standard Arabic (Fusha)',
		guide: `- Present tense: bare imperfect with prefixes أ/ت/ي/ن, fully voweled (e.g. أكتبُ aktubu, تكتبُ taktubu, يكتبُ yaktubu).
- Future tense: prefix سـ (sa-) on the present (e.g. سأكتبُ sa'aktubu, سيكتبُ sayaktubu).
- Negation of present: لا + present verb (e.g. لا أكتبُ la aktubu); future negation: لن + subjunctive (e.g. لن أكتبَ lan aktuba).
- Use the formal MSA pronoun forms but keep the 8 person KEYS below; map: enta=anta, enti=anti, howa=huwa, heya=hiya, ehna=naḥnu, entu=antum, homma=hum.
- Past tense: classical suffixes (كتبتُ katabtu, كتبتَ katabta, كتبتِ katabti, كتبَ kataba, كتبتْ katabat, كتبنا katabnā, كتبتم katabtum, كتبوا katabū).`
	},
	levantine: {
		name: 'Levantine Arabic (Shami — Syria/Lebanon/Palestine/Jordan)',
		guide: `- Present tense: prefix بـ (b-) on the imperfect (e.g. بكتب baktob, بتكتب btiktob, بيكتب byiktob).
- Future tense: particle رح (raḥ) before the bare imperfect (e.g. رح اكتب raḥ iktob, رح يكتب raḥ yiktob).
- Negation: ما (ma) before the verb, NO -ish suffix (e.g. ما بكتب ma baktob).
- Past tense suffixes: ana/enta → -t, enti → -ti, howa → bare, heya → -it, ehna → -na, entu → -tu, homma → -u.`
	},
	darija: {
		name: 'Moroccan Darija',
		guide: `- Present tense: prefix كنـ/كتـ/كيـ (kan-/kat-/kay-) on the imperfect (e.g. كنكتب kanktab, كتكتب katktab, كيكتب kayktab).
- Future tense: prefix غـ / particle غادي (gha-/ghadi) (e.g. غنكتب ghanktab, غيكتب ghayktab).
- Negation: ما...ش circumfix (e.g. ما كنكتبش ma kanktabsh).
- Plural present/future take -و (-u) suffix (e.g. كنكتبو kanktabu).
- Past tense: كتبت ktabt, كتبتي ktabti, كتب ktab, كتبات ktabat, كتبنا ktabna, كتبتو ktabtu, كتبو ktabu.`
	}
};

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env['GEMINI_API_KEY'];
	if (!apiKey) {
		return error(500, { message: 'GEMINI_API_KEY is not configured' });
	}

	const ai = new GoogleGenAI({ apiKey });

	const { verb, dialect } = await request.json();

	if (!verb || typeof verb !== 'string' || !verb.trim()) {
		return error(400, { message: 'An English verb is required' });
	}

	const dialectKey: DialectKey = DIALECT_CONJUGATION_GUIDE[dialect as DialectKey]
		? (dialect as DialectKey)
		: 'egyptian-arabic';
	const { name: dialectName, guide } = DIALECT_CONJUGATION_GUIDE[dialectKey];

	const { jsonSchema, zodSchema } = createConjugationExerciseSchema();

	const prompt = `Generate a complete verb conjugation table for the English verb "${verb.trim()}" in ${dialectName}.

═══════════════════════════════════════════════
PRONOUNS — use these EXACT keys, in this EXACT order, for every tense and form:
  ana   (I)
  enta  (you, masculine singular)
  enti  (you, feminine singular)
  howa  (he)
  heya  (she)
  ehna  (we)
  entu  (you, plural)
  homma (they)

═══════════════════════════════════════════════
DIALECT GRAMMAR (${dialectName}):
${guide}

Produce all three tenses (past, present, future), each with an affirmative array (8 entries,
one per pronoun above in order) and a negative array (8 entries). Every entry must have:
  - person: one of the 8 keys above
  - arabic: the conjugated verb in Arabic script
  - transliteration: ASCII romanization (see rules)
  - english: full English translation with pronoun (e.g. "I wrote", "you (f) write", "he will write", "we don't write")

═══════════════════════════════════════════════
TRANSLITERATION RULES (apply to every transliteration field):
  * Use ONLY plain ASCII letters plus: 3 for ع, 7 for ح, gh for غ, kh for خ, sh for ش.
  * NO diacritics, NO accents, NO special Unicode (no ā á ḥ ṭ etc.), NO brackets or codes.

═══════════════════════════════════════════════
ALSO PROVIDE:
- verb: { arabic, transliteration, english } for the base dictionary form of the verb in this dialect.
- rootLetters: the Arabic root letters separated by spaces (e.g. "ك ت ب").
- verbClass: one of sound, hollow, defective, irregular, doubled.
- notes: one short sentence on the verb pattern or any irregularity.

CRITICAL: Return a valid JSON object exactly matching this schema:
${JSON.stringify(jsonSchema, null, 2)}

Return PURE JSON only. No markdown code blocks. No explanations.`;

	try {
		const response = await generateContentWithRetry(ai, {
			model: 'gemini-2.5-flash',
			contents: prompt,
			config: {
				responseMimeType: 'application/json',
				responseJsonSchema: jsonSchema
			}
		});

		const parsed = parseJsonFromGeminiResponse(response.text || '{}', zodSchema);
		return json(parsed);
	} catch (e) {
		if (e instanceof GeminiApiError && e.is503) {
			return error(503, {
				message: 'The AI model is currently overloaded. Please try again in a few moments.'
			});
		}
		console.error('Error generating conjugations:', e);
		const errorMessage = e instanceof Error ? e.message : 'Failed to generate conjugations. Please try again.';
		return error(500, { message: errorMessage });
	}
};
