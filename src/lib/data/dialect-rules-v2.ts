/**
 * Per-dialect generation rules for v2 lessons.
 *
 * Each block tells Gemini how to write authentic, natural text for that dialect.
 * The shared FORMAT_RULES (clean arabic vs tashkeel, word alignments) are the
 * same for every dialect and appended automatically.
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
	khaleeji: 'Khaleeji (Gulf) Arabic'
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

	fusha: `Write in clear MODERN STANDARD ARABIC (Fusha) — formal, correct written/spoken standard.
- Use proper Standard Arabic grammar and vocabulary (this is the one variety that IS standard, not colloquial).
- Keep sentences natural and level-appropriate; avoid overly archaic or literary constructions for lower levels.
- Present tense is the imperfect (يذهب); future uses سـ / سوف (سيذهب).`
};

/** Returns the full rules block (phonology + shared format) for a dialect. */
export function getDialectRules(dialect: string): string {
	const phonology =
		DIALECT_PHONOLOGY[dialect] ??
		`Write in authentic ${getDialectName(dialect)} as it is actually spoken by native speakers — natural and conversational, not stiff or overly formal.`;
	return `${phonology}\n${FORMAT_RULES}`.trim();
}
