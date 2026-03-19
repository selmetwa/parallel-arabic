/**
 * Daily challenge generation logic.
 * Called by both the cron job and the lazy-generation API endpoint.
 */

import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { generateContentWithRetry } from '$lib/utils/gemini-api-retry';
import { createStorySchema, createSentencesSchema } from '$lib/utils/gemini-schemas';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { uploadStoryToStorage } from '$lib/helpers/storage-helpers';
import { supabase } from '$lib/supabaseClient';
import { commonWords } from '$lib/constants/common-words';
import { v4 as uuidv4 } from 'uuid';

export type ChallengeType = 'story' | 'sentence';

export interface SavedWord {
	arabic_word: string;
	english_word: string;
	transliterated_word: string;
}

export interface GeneratedChallenge {
	challengeId: string;
}

const DIALECT_NAMES: Record<string, string> = {
	'egyptian-arabic': 'EGYPTIAN ARABIC',
	'fusha': 'MODERN STANDARD ARABIC (FUSHA)',
	'levantine': 'LEVANTINE ARABIC',
	'darija': 'MOROCCAN DARIJA',
};

const DIALECT_DESCRIPTIONS: Record<string, string> = {
	'egyptian-arabic': 'Please only use words commonly used in the Egyptian dialect, not Modern Standard Arabic or other dialects.',
	'fusha': 'Please use formal Modern Standard Arabic as used in news, literature, and official communications.',
	'levantine': 'Please use Levantine Arabic as spoken in Syria, Lebanon, Palestine, and Jordan.',
	'darija': 'Please use Moroccan Darija as spoken in Morocco.',
};

function getDialectName(dialect: string): string {
	return DIALECT_NAMES[dialect] ?? 'EGYPTIAN ARABIC';
}

function getDialectDescription(dialect: string): string {
	return DIALECT_DESCRIPTIONS[dialect] ?? DIALECT_DESCRIPTIONS['egyptian-arabic'];
}

/**
 * Deterministically pick challenge type based on user ID and day.
 * Alternates story/sentence so the same user gets different types on different days.
 */
export function determineChallengeType(userId: string, challengeDate: number): ChallengeType {
	const dayNumber = Math.floor(challengeDate / 86400000);
	const userHash = userId.charCodeAt(0) + userId.charCodeAt(userId.length - 1);
	return (dayNumber + userHash) % 2 === 0 ? 'story' : 'sentence';
}

/**
 * Get fallback common words for a dialect.
 * Egyptian common words are the only ones we have — used as a fallback for all dialects.
 */
function getCommonWordsFallback(): SavedWord[] {
	return commonWords.slice(0, 50).map((w) => ({
		arabic_word: w.word,
		english_word: w.en,
		transliterated_word: w.franco ?? ''
	}));
}

function getDifficultyDescription(level: string): string {
	switch (level?.toUpperCase()) {
		case 'A1': return 'A1 (Beginner) - Use very basic vocabulary and simple sentence structures';
		case 'A2': return 'A2 (Elementary) - Use elementary vocabulary with slightly more complex sentences';
		case 'B1': return 'B1 (Intermediate) - Use intermediate vocabulary and varied sentence structures';
		case 'B2': return 'B2 (Upper Intermediate) - Use upper intermediate vocabulary with complex sentence structures';
		case 'C1': return 'C1 (Advanced) - Use advanced vocabulary and sophisticated sentence structures';
		case 'C2': return 'C2 (Proficient) - Use proficient-level vocabulary and highly complex sentence structures';
		default:   return 'A1 (Beginner) - Use very basic vocabulary and simple sentence structures';
	}
}

const STORY_SCENARIOS = [
	'a family gathering over a meal',
	'a trip to the local market',
	'a conversation between neighbors',
	'a day at work or school',
	'planning a weekend trip',
	'a phone call with a friend',
	'a visit to a relative',
	'getting lost and asking for directions',
	'cooking a new dish for the first time',
	'a chance encounter with an old friend',
	'a busy morning before work',
	'shopping for new clothes',
	'a rainy afternoon at home',
	'a birthday celebration',
	'waiting at a café',
	'a problem that needs solving at home',
	'a sports event or game',
	'returning something to a shop',
	'a child asking endless questions',
	'planning a wedding or big event'
];

const NARRATIVE_APPROACHES = [
	'with vivid sensory details',
	'focusing on character emotions and reactions',
	'with natural, realistic dialogue',
	'emphasizing local cultural customs',
	'with a light humorous tone',
	'through the perspective of one character',
	'with a small unexpected twist at the end',
	'focusing on everyday routines',
	'highlighting generational differences',
	'with warmth and family dynamics'
];

const SENTENCE_THEMES = [
	'daily routines and habits',
	'food, cooking, and eating out',
	'family relationships and home life',
	'work, school, and ambitions',
	'travel, transportation, and directions',
	'weather and seasons',
	'shopping, money, and bargaining',
	'health, feelings, and the body',
	'technology and social media',
	'friendship and social interactions',
	'hobbies, sports, and free time',
	'culture, traditions, and celebrations',
	'neighborhood and community',
	'time, schedules, and plans',
	'emotions, opinions, and reactions'
];

function pickRandom<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function buildReviewWordsBlock(words: SavedWord[]): string {
	return words
		.map((w) => `Arabic: ${w.arabic_word}, English: ${w.english_word}, Transliteration: ${w.transliterated_word}`)
		.join('\n');
}

/**
 * Generate a daily challenge (story or sentence) for a user.
 */
export async function generateDailyChallenge(
	userId: string,
	dialect: string,
	savedWords: SavedWord[],
	challengeDate: number,
	proficiencyLevel: string = 'A1',
	type?: ChallengeType
): Promise<GeneratedChallenge | { error: string }> {
	const apiKey = env['GEMINI_API_KEY'];
	if (!apiKey) {
		return { error: 'GEMINI_API_KEY not configured' };
	}

	const ai = new GoogleGenAI({ apiKey });
	const challengeType = type ?? determineChallengeType(userId, challengeDate);

	// Use saved words if user has at least 3, otherwise fall back to common words
	const wordsToUse = savedWords.length >= 3 ? savedWords : [];
	const challengeWords = wordsToUse.slice(0, 10);
	const reviewWordsBlock = buildReviewWordsBlock(challengeWords);

	const dialectName = getDialectName(dialect);
	const dialectDescription = getDialectDescription(dialect);
	const difficultyDescription = getDifficultyDescription(proficiencyLevel);
	const timestamp = new Date().toISOString();
	const challengeId = uuidv4();

	try {
		if (challengeType === 'story') {
			return await generateStoryChallenge(
				ai, userId, dialect, dialectName, dialectDescription,
				reviewWordsBlock, challengeWords, challengeDate, challengeId,
				timestamp, difficultyDescription, proficiencyLevel
			);
		} else {
			return await generateSentenceChallenge(
				ai, userId, dialect, dialectName, dialectDescription,
				reviewWordsBlock, challengeWords, challengeDate, challengeId,
				timestamp, difficultyDescription
			);
		}
	} catch (e) {
		console.error('Challenge generation failed:', e);
		return { error: e instanceof Error ? e.message : 'Unknown error' };
	}
}

async function generateStoryChallenge(
	ai: GoogleGenAI,
	userId: string,
	dialect: string,
	dialectName: string,
	dialectDescription: string,
	reviewWordsBlock: string,
	challengeWords: SavedWord[],
	challengeDate: number,
	challengeId: string,
	timestamp: string,
	difficultyDescription: string,
	proficiencyLevel: string
): Promise<GeneratedChallenge | { error: string }> {
	const storySchema = createStorySchema(false);

	const scenario = pickRandom(STORY_SCENARIOS);
	const approach = pickRandom(NARRATIVE_APPROACHES);

	const basePrompt = `You are an Arabic language teacher creating a short daily challenge story for a learner.

Write a short 5-sentence story in ${dialectName} about: ${scenario} — ${approach}.

${dialectDescription}

CRITICAL REQUIREMENT: You MUST generate exactly 5 sentences. This is non-negotiable. Count your sentences and verify you have exactly 5.

DIFFICULTY LEVEL: ${difficultyDescription}.

REVIEW WORDS TO INCORPORATE: The following are words the user is actively learning. Incorporate a reasonable subset naturally into the story — do NOT force every word:
${reviewWordsBlock}

GUIDELINES:
- Stay focused on the scenario above — do not drift to a generic story
- Prioritize natural, comprehensible sentences over cramming in all words
- No diacritics in Arabic (no أَ إِ آ etc.)
- Transliterations must use only English alphabet characters
- No punctuation in Arabic sentences — only letters and spaces

Generation timestamp: ${timestamp}`;

	const schemaString = JSON.stringify(storySchema.jsonSchema, null, 2);
	const prompt = `${basePrompt}

CRITICAL: You must return a valid JSON object exactly matching this schema:
${schemaString}

IMPORTANT:
1. Return PURE JSON only.
2. Do NOT wrap the response in markdown code blocks (no \`\`\`json ... \`\`\`).
3. Do NOT include any explanations or other text.`;

	const response = await generateContentWithRetry(ai, {
		model: 'gemini-3-flash-preview',
		contents: prompt,
		// @ts-expect-error - generationConfig is valid but types may be outdated
		generationConfig: {
			temperature: 0.8,
			maxOutputTokens: 5000,
			responseMimeType: 'application/json',
			responseJsonSchema: storySchema.jsonSchema
		}
	});

	if (!response.text) {
		return { error: 'No content received from Gemini' };
	}

	const parsedStory = parseJsonFromGeminiResponse(response.text, storySchema.zodSchema);
	if (!parsedStory || !parsedStory.sentences) {
		return { error: 'Invalid story structure from Gemini' };
	}

	const storyId = uuidv4();
	const storageResult = await uploadStoryToStorage(storyId, parsedStory);
	if (!storageResult.success) {
		return { error: `Storage upload failed: ${storageResult.error}` };
	}

	const { error: storyInsertError } = await supabase
		.from('generated_story')
		.insert({
			id: storyId,
			user_id: userId,
			title: `daily-challenge-${challengeDate}_${dialect}`,
			description: 'Daily Challenge Story',
			difficulty: proficiencyLevel.toLowerCase(),
			story_body: storageResult.fileKey!,
			dialect,
			created_at: new Date().toISOString()
		});

	if (storyInsertError) {
		return { error: storyInsertError.message };
	}

	const { error: challengeInsertError } = await supabase
		.from('daily_challenge')
		.insert({
			id: challengeId,
			user_id: userId,
			challenge_date: challengeDate,
			challenge_type: 'story',
			dialect,
			story_id: storyId,
			used_word_ids: challengeWords.map((w) => w.arabic_word),
			bonus_xp: 10,
			created_at: Date.now()
		});

	if (challengeInsertError) {
		return { error: challengeInsertError.message };
	}

	console.log(`✅ Story challenge generated: ${challengeId} for user ${userId}`);
	return { challengeId };
}

async function generateSentenceChallenge(
	ai: GoogleGenAI,
	userId: string,
	dialect: string,
	dialectName: string,
	dialectDescription: string,
	reviewWordsBlock: string,
	challengeWords: SavedWord[],
	challengeDate: number,
	challengeId: string,
	timestamp: string,
	difficultyDescription: string
): Promise<GeneratedChallenge | { error: string }> {
	const sentencesSchema = createSentencesSchema();

	// Pick 3 distinct themes so each sentence is guaranteed to be different
	const shuffledThemes = [...SENTENCE_THEMES].sort(() => Math.random() - 0.5);
	const pickedThemes = shuffledThemes.slice(0, 3);

	const basePrompt = `Give me 3 sentences in ${dialectName} dialect for a daily language challenge.

DIFFICULTY LEVEL: ${difficultyDescription}.

THEME FOR EACH SENTENCE (each must match its assigned theme):
1. ${pickedThemes[0]}
2. ${pickedThemes[1]}
3. ${pickedThemes[2]}

REVIEW WORDS TO INCORPORATE: The following are words the user is actively learning. Incorporate a reasonable subset naturally — do NOT force every word:
${reviewWordsBlock}

GUIDELINES:
- Each sentence MUST be about its assigned theme above — do not reuse themes
- Prioritize natural, comprehensible sentences
- No diacritics in Arabic (no أَ إِ آ etc.)
- Transliterations must use only English alphabet characters
- No punctuation in Arabic sentences — only letters and spaces
- Use a mix of subjects (I, you, he, she, we) and tenses

${dialectDescription}

Generation timestamp: ${timestamp}

Return EXACTLY 3 sentences.`;

	const sentencesSchemaString = JSON.stringify(sentencesSchema.jsonSchema, null, 2);
	const prompt = `${basePrompt}

CRITICAL: You must return a valid JSON object exactly matching this schema:
${sentencesSchemaString}

IMPORTANT:
1. Return PURE JSON only.
2. Do NOT wrap the response in markdown code blocks (no \`\`\`json ... \`\`\`).
3. Do NOT include any explanations or other text.`;

	const response = await generateContentWithRetry(ai, {
		model: 'gemini-3-flash-preview',
		contents: prompt,
		// @ts-expect-error - generationConfig is valid but types may be outdated
		generationConfig: {
			temperature: 0.9,
			maxOutputTokens: 2000,
			responseMimeType: 'application/json',
			responseJsonSchema: sentencesSchema.jsonSchema
		}
	});

	if (!response.text) {
		return { error: 'No content received from Gemini' };
	}

	const parsed = parseJsonFromGeminiResponse(response.text, sentencesSchema.zodSchema);
	if (!parsed || !parsed.sentences) {
		return { error: 'Invalid sentences structure from Gemini' };
	}

	const sentences = parsed.sentences.slice(0, 3).map((s: { arabic: string; english: string; transliteration: string }) => ({
		arabic: s.arabic ?? '',
		english: s.english ?? '',
		transliteration: s.transliteration ?? ''
	}));

	const { error: challengeInsertError } = await supabase
		.from('daily_challenge')
		.insert({
			id: challengeId,
			user_id: userId,
			challenge_date: challengeDate,
			challenge_type: 'sentence',
			dialect,
			sentences,
			used_word_ids: challengeWords.map((w) => w.arabic_word),
			bonus_xp: 10,
			created_at: Date.now()
		});

	if (challengeInsertError) {
		return { error: challengeInsertError.message };
	}

	console.log(`✅ Sentence challenge generated: ${challengeId} for user ${userId}`);
	return { challengeId };
}
