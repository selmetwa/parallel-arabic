import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseJsonFromGeminiResponse } from '$lib/utils/gemini-json-parser';
import { createLessonSchema, createTranslationUpdateSchema } from '$lib/utils/gemini-schemas';

// Function to improve Arabic text using the Egyptian Arabic model (Nile4B)
async function improveArabicWithEgyptianModel(arabicText: string): Promise<string> {
	try {
		console.log('Improving Arabic with Egyptian model...');
		
		const prompt = `الرجاء ترجمة النص العربي التالي إلى اللهجة المصرية الأصيلة. احتفظ بنفس المعنى ولكن استخدم الكلمات والتعبيرات المصرية الشائعة:

${arabicText}`;

		const response = await fetch('https://selmetwa--nilechat-generator-api-generate.modal.run', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				prompt: prompt,
				max_tokens: 2000
			})
		});

		if (!response.ok) {
			throw new Error(`Egyptian model request failed: ${response.status} ${response.statusText}`);
		}

		const result = await response.json();
		console.log('Egyptian Arabic model response received');
		
		// Extract text from response
		let improvedText = '';
		if (typeof result === 'string') {
			improvedText = result;
		} else if (result.response) {
			improvedText = result.response;
		} else if (result.text) {
			improvedText = result.text;
		} else if (result.content) {
			improvedText = result.content;
		} else {
			improvedText = JSON.stringify(result);
		}

		return improvedText.trim();
	} catch (error) {
		console.error('Failed to improve Arabic with Egyptian model:', error);
		// Return original text if improvement fails
		return arabicText;
	}
}

// Function to update transliteration and English to match improved Arabic
async function updateTranslations(
	improvedArabic: string,
	originalEnglish: string,
	originalTransliteration: string,
	ai: GoogleGenAI
): Promise<{ english: string; transliteration: string }> {
	try {
		const prompt = `Given this Egyptian Arabic sentence: "${improvedArabic}"

Please provide:
1. An accurate English translation
2. An accurate transliteration using only English alphabet letters

Make sure the transliteration reflects authentic Egyptian pronunciation.

Return ONLY a JSON object in this exact format:
{
	"english": "the english translation",
	"transliteration": "the transliteration"
}

No other text or explanation.`;

		const translationUpdateSchema = createTranslationUpdateSchema();
		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash',
			contents: prompt,
			// @ts-expect-error - generationConfig is valid but types may be outdated
			generationConfig: {
				temperature: 0.3,
				maxOutputTokens: 8000,
				responseMimeType: 'application/json',
				responseJsonSchema: translationUpdateSchema.jsonSchema
			}
		});

		const content = response.text;
		if (content) {
			const data = parseJsonFromGeminiResponse(content, translationUpdateSchema.zodSchema);
			return {
				english: data.english || originalEnglish,
				transliteration: data.transliteration || originalTransliteration
			};
		}
	} catch (updateError) {
		console.error('Failed to update translations:', updateError);
	}

	return {
		english: originalEnglish,
		transliteration: originalTransliteration
	};
}

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env['GEMINI_API_KEY'];
	if (!apiKey) {
		return error(500, { message: 'GEMINI_API_KEY is not configured' });
	}
	
	const ai = new GoogleGenAI({ apiKey });

	try {
		// Read the lesson template
		let template = '';
		try {
			const templatePath = join(process.cwd(), 'static', 'rules', 'lessons', 'lesson-template.md');
			template = readFileSync(templatePath, 'utf-8');
		} catch (templateError) {
			console.log('Could not read template file, using default structure');
		}

		const templateSection = template 
			? `\n\nUse this lesson template as a guide:\n\n${template.substring(0, 3000)}...\n\n`
			: '';

		const prompt = `You are an expert Arabic language teacher creating a beginner lesson for Egyptian Arabic.${templateSection}

Create Lesson 1 — Beginner: Greetings & Everyday Basics

The lesson should have 5 sub-lessons:

1.1 Greeting People
- Basic greetings (أهلاً، إزيّك؟، عامل إيه؟)
- Replying politely
- Time-of-day greetings (صباح الخير، مساء الخير)

1.2 Introducing Yourself
- Saying your name
- Asking someone's name
- Nationality & language basics

1.3 Polite Expressions
- Please, thank you, excuse me
- Saying yes/no
- Apologizing

1.4 Numbers 1–20
- Counting
- Basic questions with numbers (age, phone number)

1.5 Essential Survival Phrases
- I don't understand
- Can you repeat?
- How do I say ___ in Arabic?

For each sub-lesson, provide:
- 10-15 phrases with Arabic, English, and transliteration
- 2-3 brief explanations in English
- 3-5 interactive exercises (multiple choice, fill-in-blank, translation, matching)

IMPORTANT REQUIREMENTS:
- Use authentic Egyptian Arabic dialect (not Modern Standard Arabic)
- No diacritics in Arabic text
- Transliterations should use only English alphabet
- Make exercises interactive and educational
- Provide cultural context where helpful

Return the lesson as a JSON object matching this TypeScript interface:

interface Exercise {
	id: string;
	type: 'multiple-choice' | 'fill-in-blank' | 'translation' | 'matching';
	question: { english: string; arabic?: string };
	options?: Array<{ arabic: string; english: string; transliteration: string; isCorrect: boolean }>;
	correctAnswer: string | string[];
	hint?: { english: string; arabic: string; transliteration: string };
}

interface LessonContent {
	title: { arabic: string; english: string; transliteration: string };
	phrases: Array<{ arabic: string; english: string; transliteration: string }>;
	explanations?: Array<{ english: string }>;
}

interface SubLesson {
	id: string;
	title: { arabic: string; english: string; transliteration: string };
	content: LessonContent;
	exercises: Exercise[];
}

interface Lesson {
	id: string;
	title: { arabic: string; english: string; transliteration: string };
	level: 'beginner';
	subLessons: SubLesson[];
}

Return ONLY the JSON object, no other text.`;

		const lessonSchema = createLessonSchema();
		const response = await ai.models.generateContent({
			model: 'gemini-2.5-flash',
			contents: prompt,
			// @ts-expect-error - generationConfig is valid but types may be outdated
			generationConfig: {
				temperature: 0.7,
				maxOutputTokens: 15000, // Large token limit for complex lesson structures
				responseMimeType: 'application/json',
				responseJsonSchema: lessonSchema.jsonSchema
			}
		});

		const responseContent = response.text;
		if (!responseContent) {
			throw new Error('No response from Gemini');
		}

		let lesson = parseJsonFromGeminiResponse(responseContent, lessonSchema.zodSchema);

		// Improve all Arabic text with Nile4B model
		console.log('Improving Arabic content with Egyptian model...');

		// Improve lesson title
		if (lesson.title?.arabic) {
			lesson.title.arabic = await improveArabicWithEgyptianModel(lesson.title.arabic);
			const translations = await updateTranslations(
				lesson.title.arabic,
				lesson.title.english || '',
				lesson.title.transliteration || '',
				ai
			);
			if (translations.english) lesson.title.english = translations.english;
			if (translations.transliteration) lesson.title.transliteration = translations.transliteration;
		}

		// Improve sub-lessons
		if (lesson.subLessons && Array.isArray(lesson.subLessons)) {
			for (const subLesson of lesson.subLessons) {
				// Improve sub-lesson title
				if (subLesson.title?.arabic) {
					subLesson.title.arabic = await improveArabicWithEgyptianModel(subLesson.title.arabic);
					const translations = await updateTranslations(
						subLesson.title.arabic,
						subLesson.title.english || '',
						subLesson.title.transliteration || '',
						ai
					);
					if (translations.english) subLesson.title.english = translations.english;
					if (translations.transliteration) subLesson.title.transliteration = translations.transliteration;
				}

				// Improve content title
				if (subLesson.content?.title?.arabic) {
					subLesson.content.title.arabic = await improveArabicWithEgyptianModel(subLesson.content.title.arabic);
					const translations = await updateTranslations(
						subLesson.content.title.arabic,
						subLesson.content.title.english || '',
						subLesson.content.title.transliteration || '',
						ai
					);
					if (translations.english) subLesson.content.title.english = translations.english;
					if (translations.transliteration) subLesson.content.title.transliteration = translations.transliteration;
				}

				// Improve phrases
				if (subLesson.content?.phrases && Array.isArray(subLesson.content.phrases)) {
					for (const phrase of subLesson.content.phrases) {
						if (phrase.arabic) {
							phrase.arabic = await improveArabicWithEgyptianModel(phrase.arabic);
							const translations = await updateTranslations(
								phrase.arabic,
								phrase.english || '',
								phrase.transliteration || '',
								ai
							);
							if (translations.english) phrase.english = translations.english;
							if (translations.transliteration) phrase.transliteration = translations.transliteration;
						}
					}
				}

				// Improve exercise questions and options
				if (subLesson.exercises && Array.isArray(subLesson.exercises)) {
					for (const exercise of subLesson.exercises) {
						// Improve question Arabic
						if (exercise.question?.arabic) {
							exercise.question.arabic = await improveArabicWithEgyptianModel(exercise.question.arabic);
						}

						// Improve options
						if (exercise.options && Array.isArray(exercise.options)) {
							for (const option of exercise.options) {
								if (option.arabic) {
									option.arabic = await improveArabicWithEgyptianModel(option.arabic);
									const translations = await updateTranslations(
										option.arabic,
										option.english || '',
										option.transliteration || '',
										ai
									);
									if (translations.english) option.english = translations.english;
									if (translations.transliteration) option.transliteration = translations.transliteration;
								}
							}
						}

						// Improve correct answer if it's Arabic
						if (typeof exercise.correctAnswer === 'string' && /[\u0600-\u06FF]/.test(exercise.correctAnswer)) {
							exercise.correctAnswer = await improveArabicWithEgyptianModel(exercise.correctAnswer);
						} else if (Array.isArray(exercise.correctAnswer)) {
							exercise.correctAnswer = await Promise.all(
								exercise.correctAnswer.map(async (ans) => {
									if (typeof ans === 'string' && /[\u0600-\u06FF]/.test(ans)) {
										return await improveArabicWithEgyptianModel(ans);
									}
									return ans;
								})
							);
						}

						// Improve hints
						if (exercise.hint?.arabic) {
							exercise.hint.arabic = await improveArabicWithEgyptianModel(exercise.hint.arabic);
							const translations = await updateTranslations(
								exercise.hint.arabic,
								exercise.hint.english || '',
								exercise.hint.transliteration || '',
								ai
							);
							if (translations.english) exercise.hint.english = translations.english;
							if (translations.transliteration) exercise.hint.transliteration = translations.transliteration;
						}
					}
				}
			}
		}

		console.log('✅ Lesson generated and improved with Egyptian Arabic model');

		return json({ lesson });

	} catch (e) {
		console.error('Error generating lesson:', e);
		return error(500, { message: 'Failed to generate lesson' });
	}
};

