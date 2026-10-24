/**
 * Per-dialect generation rules, shared by every Gemini call that writes Arabic.
 *
 * Each block tells Gemini how to write authentic, natural text for that dialect.
 * getDialectSystemInstruction() goes in `config.systemInstruction`; the lesson
 * FORMAT_RULES (clean arabic vs tashkeel, word alignments) stay in the prompt.
 *
 * To support a new dialect: add a display name and a rules block, or rely on the
 * generic fallback. Everything downstream (schema, assembler, player, TTS/STT,
 * tutor) is already dialect-agnostic.
 */

export const DIALECT_DISPLAY_NAMES: Record<string, string> = {
	'egyptian-arabic': 'Egyptian Arabic (Masri)',
	levantine: 'Levantine Arabic (Shami)',
	darija: 'Moroccan Darija',
	fusha: 'Modern Standard Arabic (Fusha)',
	iraqi: 'Iraqi Arabic',
	khaleeji: 'Khaleeji (Gulf) Arabic',
	saudi: 'Saudi Arabic (Hijazi)'
};

export function getDialectName(dialect: string): string {
	return DIALECT_DISPLAY_NAMES[dialect] ?? dialect;
}

// Shared output-format rules — identical for every dialect.
const FORMAT_RULES = `
- "arabic" must be CLEAN (no diacritics). "arabicTashkeel" is the same text WITH diacritics for pronunciation.
- "wordAlignments": one entry PER WORD in the arabic sentence, in order, each with that word's english gloss and transliteration.`;

// Per-dialect phonology / lexicon / grammar guidance.
const DIALECT_PHONOLOGY: Record<string, string> = {
	'egyptian-arabic': `Write in authentic EGYPTIAN COLLOQUIAL ARABIC (Masri) as actually spoken — NOT Modern Standard Arabic.
- No case inflection (iʿrab); word endings do not change for case.
- qaf is usually a glottal stop (ʔ): قلم→ ʔalam. Use everyday colloquial words: now = دلوقتي, what = إيه, went = راح.
- Present-tense verbs start with b- (بيروح/بتروح); future starts with ha- (هيروح).
- Flexible, conversational word order.`,

	levantine: `Write in authentic LEVANTINE ARABIC (Shami — Syrian/Lebanese/Palestinian/Jordanian) as actually spoken — NOT Modern Standard Arabic.
- No case inflection; word endings do not change for case.
- qaf is usually a glottal stop (ʔ) in urban speech: قلب→ ʔalb. Everyday words: now = هلّق, what = شو, like this = هيك.
- Present-tense verbs take the b- prefix (بروح/بتروح); future uses رح (رح روح).
- Negation with ما (ما بعرف); flexible, conversational word order.`,

	darija: `Write in authentic MOROCCAN DARIJA as actually spoken — NOT Modern Standard Arabic.
- No case inflection. Heavy vowel reduction and consonant clusters are normal.
- Present/continuous uses كا/تا prefix (كانمشي = I go/am going); future uses غادي/غا (غادي نمشي).
- Everyday words: now = دابا, what = شنو/آش, I want = بغيت, good = مزيان. Some French loanwords are natural.
- Negation with ما...ش (ماكانمشيش); conversational word order.`,

	iraqi: `Write in authentic IRAQI ARABIC (Baghdadi) as actually spoken — NOT Modern Standard Arabic.
- No case inflection; word endings do not change for case.
- qaf is often g and kaf is often ch in everyday words (gaal, chaan, baachir), but keep the standard spelling (ق، ك) so learners can type it; show the pronunciation in transliteration only.
- Ongoing actions take da- (دا يروح / ديروح); future uses راح (راح أروح).
- Everyday words: now = هسّه, what = شنو, how = شلون, there is / isn't = أكو / ماكو, very = كلش, good = زين.
- Negation with ما for verbs (ما أعرف) and مو for everything else (مو زين); conversational word order.`,

	khaleeji: `Write in authentic GULF ARABIC (Khaleeji, Emirati/Kuwaiti) as actually spoken — NOT Modern Standard Arabic.
- No case inflection; word endings do not change for case.
- qaf is usually g and jeem is often y in speech, but keep the standard spelling (ق، ج، ك); show the pronunciation in transliteration only.
- Ongoing actions use قاعد (قاعد أكتب); future uses the b- prefix (بروح = I will go).
- Everyday words: now = الحين, what = شو / شنو, I want = أبي, a lot / very = وايد, good = زين, also = بعد.
- Negation with ما for verbs (ما أدري) and مب / مو for everything else; conversational word order.`,

	saudi: `Write in authentic SAUDI HIJAZI ARABIC (Jeddah/Mecca) as actually spoken — NOT Modern Standard Arabic and NOT Najdi.
- No case inflection; word endings do not change for case.
- qaf is usually g (keep ق in writing); ث is said and written ت (تلاتة) and ذ as د (هادا).
- Present-tense verbs take the b- prefix (بيروح / بروح); future uses the ح- prefix (حروح).
- Everyday words: now = دحين, what = إيش, I want = أبغى, very = مرّة, like this = كدا, good = كويس.
- Negation with ما for verbs (ما أدري) and مو for everything else (مو كدا); conversational word order.`,

	fusha: `Write in clear MODERN STANDARD ARABIC (Fusha) — formal, correct written/spoken standard.
- Use proper Standard Arabic grammar and vocabulary (this is the one variety that IS standard, not colloquial).
- Keep sentences natural and level-appropriate; avoid overly archaic or literary constructions for lower levels.
- Present tense is the imperfect (يذهب); future uses سـ / سوف (سيذهب).`
};

// MSA words that leak into dialect output, each paired with what a native speaker says.
const MSA_TO_DIALECT: Record<string, [msa: string, dialect: string][]> = {
	'egyptian-arabic': [
		['هذا / هذه', 'ده / دي'],
		['ماذا', 'إيه'],
		['لماذا', 'ليه'],
		['كيف', 'إزاي'],
		['أين', 'فين'],
		['الآن', 'دلوقتي'],
		['سوف / سـ', 'هـ (هروح)'],
		['ليس / لا (with verbs)', 'مش / ما...ش (مش عارف، ماروحتش)'],
		['يريد / أريد', 'عايز / عايزة'],
		['الذي / التي', 'اللي'],
		['يوجد / لا يوجد', 'فيه / مفيش'],
		['جداً', 'أوي / خالص'],
		['أيضاً', 'كمان'],
		['فقط', 'بس']
	],
	levantine: [
		['هذا / هذه', 'هاد / هاي (هيدا / هيدي)'],
		['ماذا', 'شو'],
		['لماذا', 'ليش'],
		['أين', 'وين'],
		['الآن', 'هلّق'],
		['سوف / سـ', 'رح (رح روح)'],
		['ليس / لا (with verbs)', 'مش / ما (ما بعرف)'],
		['يريد / أريد', 'بدّو / بدّي'],
		['الذي / التي', 'اللي'],
		['يوجد / لا يوجد', 'في / ما في'],
		['جداً', 'كتير'],
		['أيضاً', 'كمان'],
		['فقط', 'بس']
	],
	darija: [
		['هذا / هذه', 'هاد / هادي'],
		['ماذا', 'شنو / آش'],
		['لماذا', 'علاش'],
		['كيف', 'كيفاش'],
		['أين', 'فين'],
		['الآن', 'دابا'],
		['سوف / سـ', 'غادي / غا (غادي نمشي)'],
		['ليس / لا (with verbs)', 'ماشي / ما...ش (ماعرفتش)'],
		['يريد / أريد', 'بغا / بغيت'],
		['الذي / التي', 'اللي'],
		['يوجد / لا يوجد', 'كاين / ماكاينش'],
		['جيد', 'مزيان'],
		['كثير / جداً', 'بزاف'],
		['فقط', 'غير']
	],
	iraqi: [
		['ماذا', 'شنو'],
		['لماذا', 'ليش'],
		['كيف', 'شلون'],
		['أين', 'وين'],
		['الآن', 'هسّه'],
		['سوف / سـ', 'راح (راح أروح)'],
		['ليس', 'مو (مو زين)'],
		['يوجد / لا يوجد', 'أكو / ماكو'],
		['جداً', 'كلش'],
		['كثير', 'هواية'],
		['جيد', 'زين'],
		['أيضاً', 'هم'],
		['غداً', 'باكر (baachir)'],
		['الذي / التي', 'اللي']
	],
	khaleeji: [
		['ماذا', 'شو / شنو'],
		['لماذا', 'ليش'],
		['أين', 'وين'],
		['الآن', 'الحين'],
		['أريد / يريد', 'أبي / يبي'],
		['سوف / سـ', 'بـ (بروح)'],
		['ليس', 'مب / مو'],
		['لا أعرف', 'ما أدري'],
		['جداً / كثير', 'وايد'],
		['جيد', 'زين'],
		['أيضاً', 'بعد'],
		['غداً', 'باكر'],
		['الذي / التي', 'اللي'],
		['فقط', 'بس']
	],
	saudi: [
		['هذا / هذه', 'هادا / هادي'],
		['ماذا', 'إيش'],
		['لماذا', 'ليش'],
		['أين', 'فين'],
		['الآن', 'دحين'],
		['أريد / يريد', 'أبغى / يبغى'],
		['سوف / سـ', 'حـ (حروح)'],
		['ليس', 'مو (مو كدا)'],
		['لا أعرف', 'ما أدري'],
		['جداً', 'مرّة'],
		['جيد', 'كويس'],
		['هكذا', 'كدا'],
		['أيضاً', 'كمان'],
		['الذي / التي', 'اللي']
	]
};

// Natural sentences, plus one MSA sentence rewritten the way a native speaker says it.
const DIALECT_EXAMPLES: Record<string, string> = {
	'egyptian-arabic': `- إنت رايح فين دلوقتي؟ (Where are you going now?)
- مش عارف أعمل إيه، الشغل كتير أوي النهارده. (I don't know what to do, there's so much work today.)
- هنروح نتغدى برّه بكرة. (We'll go out for lunch tomorrow.)
- Wrong (MSA): ماذا تريد أن تأكل الآن؟ → Right: عايز تاكل إيه دلوقتي؟`,

	levantine: `- وين رايح هلّق؟ (Where are you going now?)
- ما بعرف شو بدي اعمل، في شغل كتير اليوم. (I don't know what to do, there's so much work today.)
- رح نروح نتغدى برّا بكرا. (We'll go out for lunch tomorrow.)
- Wrong (MSA): ماذا تريد أن تأكل الآن؟ → Right: شو بدك تاكل هلّق؟`,

	darija: `- فين غادي دابا؟ (Where are you going now?)
- ماعرفتش شنو ندير، كاينة بزاف ديال الخدمة اليوم. (I don't know what to do, there's so much work today.)
- غادي نتغداو برا غدا. (We'll go out for lunch tomorrow.)
- Wrong (MSA): ماذا تريد أن تأكل الآن؟ → Right: آش بغيتي تاكل دابا؟`,

	iraqi: `- وين رايح هسّه؟ (Where are you going now?)
- ما أعرف شسوّي، أكو شغل هواية اليوم. (I don't know what to do, there's so much work today.)
- باكر راح نطلع نتغدى برّه. (We'll go out for lunch tomorrow.)
- Wrong (MSA): ماذا تريد أن تأكل الآن؟ → Right: شتريد تاكل هسّه؟`,

	khaleeji: `- وين رايح الحين؟ (Where are you going now?)
- ما أدري شو أسوّي، عندي شغل وايد اليوم. (I don't know what to do, I have so much work today.)
- باكر بنطلع نتغدى برّا. (We'll go out for lunch tomorrow.)
- Wrong (MSA): ماذا تريد أن تأكل الآن؟ → Right: شو تبي تاكل الحين؟`,

	saudi: `- فين رايح دحين؟ (Where are you going now?)
- ما أدري إيش أسوّي، عندي شغل كتير اليوم. (I don't know what to do, I have so much work today.)
- بكرة حنطلع نتغدى برّا. (We'll go out for lunch tomorrow.)
- Wrong (MSA): ماذا تريد أن تأكل الآن؟ → Right: إيش تبغى تاكل دحين؟`
};

/**
 * How to write naturally in a dialect, without the lesson-specific output rules.
 * Used by prompts whose JSON has no tashkeel or word-alignment fields.
 */
export function getDialectStyle(dialect: string): string {
	return (
		DIALECT_PHONOLOGY[dialect] ??
		`Write in authentic ${getDialectName(
			dialect
		)} as it is actually spoken by native speakers — natural and conversational, not stiff or overly formal.`
	);
}

/**
 * The system instruction for any call that writes Arabic in a dialect: the style
 * guide, the MSA words to avoid, and example sentences. Fusha gets the style only.
 */
export function getDialectSystemInstruction(dialect: string): string {
	const parts = [getDialectStyle(dialect)];
	const swaps = MSA_TO_DIALECT[dialect];
	if (swaps) {
		parts.push(
			`Never use these Modern Standard Arabic words in Arabic you write; use the everyday ${getDialectName(dialect)} word instead:\n` +
				swaps.map(([msa, local]) => `- ${msa} → ${local}`).join('\n')
		);
	}
	const examples = DIALECT_EXAMPLES[dialect];
	if (examples) {
		parts.push(`Examples of the register to write in:\n${examples}`);
	}
	return parts.join('\n\n');
}

/** Output-format rules for lesson JSON with tashkeel and word-alignment fields. */
export function getLessonFormatRules(): string {
	return FORMAT_RULES.trim();
}
