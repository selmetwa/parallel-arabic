import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

// Function to improve Arabic text using the Egyptian Arabic model (NileChat4)
async function improveArabicWithEgyptianModel(
	arabicText: string,
	sendProgress: (message: string) => void
): Promise<string> {
	try {
		sendProgress(`🔍 Validating Arabic with NileChat4: "${arabicText.substring(0, 30)}..."`);
		
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

		const finalText = improvedText.trim();
		if (finalText !== arabicText) {
			sendProgress(`✅ Improved: "${arabicText}" → "${finalText.substring(0, 30)}..."`);
		}
		return finalText;
	} catch (error) {
		console.error('Failed to improve Arabic with Egyptian model:', error);
		sendProgress(`⚠️ NileChat4 validation failed, using original text`);
		return arabicText;
	}
}

// Function to update transliteration and English to match improved Arabic
async function updateTranslations(
	improvedArabic: string,
	originalEnglish: string,
	originalTransliteration: string,
	openai: OpenAI
): Promise<{ english: string; transliteration: string }> {
	try {
		const completion = await openai.chat.completions.create({
			messages: [{
				role: 'system',
				content: `Given this Egyptian Arabic sentence: "${improvedArabic}"
				
				Please provide:
				1. An accurate English translation
				2. An accurate transliteration using only English alphabet letters
				
				Make sure the transliteration reflects authentic Egyptian pronunciation.
				
				Return ONLY a JSON object in this exact format:
				{
					"english": "the english translation",
					"transliteration": "the transliteration"
				}
				
				No other text or explanation.`
			}],
			response_format: { type: 'json_object' },
			model: 'gpt-4o-mini',
			temperature: 0.3,
		});

		const response = completion.choices[0].message?.content;
		if (response) {
			const data = JSON.parse(response);
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
	const openai = new OpenAI({ apiKey: env['OPEN_API_KEY'] });

	// Create a readable stream for Server-Sent Events
	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			
			function sendProgress(message: string) {
				const data = JSON.stringify({ type: 'progress', message }) + '\n\n';
				controller.enqueue(encoder.encode(`data: ${data}`));
			}

			try {
				// Read the lesson template
				sendProgress('📖 Reading lesson template...');
				let template = '';
				try {
					// Try different possible paths
					const possiblePaths = [
						join(process.cwd(), 'static', 'rules', 'lessons', 'lesson1-template.md'),
						join(process.cwd(), '..', 'static', 'rules', 'lessons', 'lesson1-template.md'),
					];
					
					const templatePath = possiblePaths.find(p => {
						try {
							return readFileSync(p, 'utf-8').length > 0;
						} catch {
							return false;
						}
					});
					
					if (templatePath) {
						template = readFileSync(templatePath, 'utf-8');
						sendProgress('✅ Template loaded successfully');
					} else {
						sendProgress('⚠️ Could not find template file, using default structure');
					}
				} catch (templateError) {
					sendProgress('⚠️ Could not read template file, using default structure');
					console.error('Template read error:', templateError);
				}

				sendProgress('🤖 Generating lesson structure with ChatGPT...');
				
				// Create prompt based on template
				const templateSection = template 
					? `\n\nUse this lesson template as a guide:\n\n${template}\n\n`
					: '';
				
				const prompt = `You are an expert Arabic language teacher creating a beginner lesson for Egyptian Arabic.${templateSection}

Create Lesson 1: Introduction and common phrases following the template structure.

The lesson should have 4 sub-lessons as outlined in the template:
1. Sublesson 1: Greetings, thank you and goodbye (10-15 words/phrases)
2. Sublesson 2: Masculine vs Feminine (introduce masc vs fem for nouns and verbs)
3. Sublesson 3: Introducing yourself (my name is, I'm this old, I do this, I like this, nationality, etc.)
4. Sublesson 4: Numbers 1-20 (practice numbers, single, dual, and plural, basic questions with numbers like age, phone number, etc.)

For each sub-lesson, provide:
- 10-15 phrases/words with Arabic, English, and transliteration
- 3-5 brief explanations in English (with Arabic examples where helpful)
- Practice exercises that MUST include:
  * At least 1 SPEAKING exercise (type: "speaking") - for practicing pronunciation using speech-to-text
  * At least 1 WRITING exercise (type: "writing") - for practicing writing using Arabic virtual keyboard
  * At least 1 SENTENCE PRACTICE exercise (type: "sentence-practice") - example sentences using the words/phrases
  * Additional exercises can be: multiple-choice, fill-in-blank, translation, matching, listening

IMPORTANT REQUIREMENTS FOR EXERCISES:
- Speaking exercises: Include the Arabic phrase to practice, English instruction, and transliteration
- Writing exercises: Include the English word/phrase to write in Arabic, with correct answer and transliteration
- Sentence practice: Include example sentences using the vocabulary, with Arabic, English, and transliteration
- Use authentic Egyptian Arabic dialect (not Modern Standard Arabic)
- No diacritics in Arabic text
- Transliterations should use only English alphabet
- Make exercises interactive and educational
- Provide cultural context where helpful

Return the lesson as a JSON object matching this TypeScript interface:

interface Exercise {
	id: string;
	type: 'multiple-choice' | 'fill-in-blank' | 'translation' | 'matching' | 'listening' | 'speaking' | 'writing' | 'sentence-practice';
	question: { english: string; arabic?: string };
	options?: Array<{ arabic: string; english: string; transliteration: string; isCorrect: boolean }>;
	correctAnswer: string | string[];
	hint?: { english: string; arabic: string; transliteration: string };
	// For speaking exercises: include the target phrase to practice
	targetPhrase?: { arabic: string; english: string; transliteration: string };
	// For writing exercises: include the word/phrase to write
	wordToWrite?: { english: string; arabic: string; transliteration: string };
	// For sentence practice: include example sentences
	sentences?: Array<{ arabic: string; english: string; transliteration: string }>;
}

interface LessonContent {
	title: { arabic: string; english: string; transliteration: string };
	phrases: Array<{ arabic: string; english: string; transliteration: string }>;
	explanations?: Array<{ english: string; arabic?: string }>;
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
	level: 'beginner' | 'intermediate' | 'advanced';
	subLessons: SubLesson[];
}

Return ONLY the JSON object, no other text.`;

				const completion = await openai.chat.completions.create({
					messages: [{ role: 'system', content: prompt }],
					response_format: { type: 'json_object' },
					model: 'gpt-4o-mini',
					temperature: 0.7,
				});

				const responseContent = completion.choices[0].message?.content;
				if (!responseContent) {
					throw new Error('No response from OpenAI');
				}

				sendProgress('✅ Lesson structure generated by ChatGPT');
				sendProgress('🔍 Validating Arabic text with NileChat4...');

				let lesson = JSON.parse(responseContent);

				// Improve all Arabic text with NileChat4 model
				// Calculate total items for progress tracking
				let totalItems = 1; // lesson title
				if (lesson.subLessons && Array.isArray(lesson.subLessons)) {
					for (const subLesson of lesson.subLessons) {
						totalItems += 2; // sub-lesson title, content title
						totalItems += subLesson.content?.phrases?.length || 0; // phrases
						totalItems += subLesson.exercises?.length || 0; // exercises
						// Add items for exercise-specific Arabic content
						if (subLesson.exercises) {
							for (const exercise of subLesson.exercises) {
								if (exercise.type === 'speaking' && exercise.targetPhrase?.arabic) totalItems += 1;
								if (exercise.type === 'writing' && exercise.wordToWrite?.arabic) totalItems += 1;
								if (exercise.type === 'sentence-practice' && exercise.sentences) {
									totalItems += exercise.sentences.length;
								}
							}
						}
					}
				}
				let currentItem = 0;

				// Improve lesson title
				if (lesson.title?.arabic) {
					currentItem++;
					sendProgress(`[${currentItem}/${totalItems}] Validating lesson title...`);
					const original = lesson.title.arabic;
					lesson.title.arabic = await improveArabicWithEgyptianModel(lesson.title.arabic, sendProgress);
					const translations = await updateTranslations(
						lesson.title.arabic,
						lesson.title.english || '',
						lesson.title.transliteration || '',
						openai
					);
					if (translations.english) lesson.title.english = translations.english;
					if (translations.transliteration) lesson.title.transliteration = translations.transliteration;
				}

				// Improve sub-lessons
				if (lesson.subLessons && Array.isArray(lesson.subLessons)) {
					for (let i = 0; i < lesson.subLessons.length; i++) {
						const subLesson = lesson.subLessons[i];
						sendProgress(`📚 Processing sub-lesson ${i + 1}/${lesson.subLessons.length}: ${subLesson.title?.english || subLesson.id}`);

						// Improve sub-lesson title
						if (subLesson.title?.arabic) {
							currentItem++;
							sendProgress(`[${currentItem}/${totalItems}] Validating sub-lesson title...`);
							subLesson.title.arabic = await improveArabicWithEgyptianModel(subLesson.title.arabic, sendProgress);
							const translations = await updateTranslations(
								subLesson.title.arabic,
								subLesson.title.english || '',
								subLesson.title.transliteration || '',
								openai
							);
							if (translations.english) subLesson.title.english = translations.english;
							if (translations.transliteration) subLesson.title.transliteration = translations.transliteration;
						}

						// Improve content title
						if (subLesson.content?.title?.arabic) {
							currentItem++;
							sendProgress(`[${currentItem}/${totalItems}] Validating content title...`);
							subLesson.content.title.arabic = await improveArabicWithEgyptianModel(subLesson.content.title.arabic, sendProgress);
							const translations = await updateTranslations(
								subLesson.content.title.arabic,
								subLesson.content.title.english || '',
								subLesson.content.title.transliteration || '',
								openai
							);
							if (translations.english) subLesson.content.title.english = translations.english;
							if (translations.transliteration) subLesson.content.title.transliteration = translations.transliteration;
						}

						// Improve phrases
						if (subLesson.content?.phrases && Array.isArray(subLesson.content.phrases)) {
							for (let j = 0; j < subLesson.content.phrases.length; j++) {
								const phrase = subLesson.content.phrases[j];
								if (phrase.arabic) {
									currentItem++;
									sendProgress(`[${currentItem}/${totalItems}] Validating phrase ${j + 1}/${subLesson.content.phrases.length}...`);
									const original = phrase.arabic;
									phrase.arabic = await improveArabicWithEgyptianModel(phrase.arabic, sendProgress);
									const translations = await updateTranslations(
										phrase.arabic,
										phrase.english || '',
										phrase.transliteration || '',
										openai
									);
									if (translations.english) phrase.english = translations.english;
									if (translations.transliteration) phrase.transliteration = translations.transliteration;
								}
							}
						}

						// Improve exercise questions and options
						if (subLesson.exercises && Array.isArray(subLesson.exercises)) {
							for (let j = 0; j < subLesson.exercises.length; j++) {
								const exercise = subLesson.exercises[j];
								currentItem++;
								sendProgress(`[${currentItem}/${totalItems}] Validating exercise ${j + 1}/${subLesson.exercises.length}...`);

								// Improve question Arabic
								if (exercise.question?.arabic) {
									exercise.question.arabic = await improveArabicWithEgyptianModel(exercise.question.arabic, sendProgress);
								}

								// Improve options
								if (exercise.options && Array.isArray(exercise.options)) {
									for (const option of exercise.options) {
										if (option.arabic) {
											option.arabic = await improveArabicWithEgyptianModel(option.arabic, sendProgress);
											const translations = await updateTranslations(
												option.arabic,
												option.english || '',
												option.transliteration || '',
												openai
											);
											if (translations.english) option.english = translations.english;
											if (translations.transliteration) option.transliteration = translations.transliteration;
										}
									}
								}

								// Improve correct answer if it's Arabic
								if (typeof exercise.correctAnswer === 'string' && /[\u0600-\u06FF]/.test(exercise.correctAnswer)) {
									exercise.correctAnswer = await improveArabicWithEgyptianModel(exercise.correctAnswer, sendProgress);
								} else if (Array.isArray(exercise.correctAnswer)) {
									exercise.correctAnswer = await Promise.all(
										exercise.correctAnswer.map(async (ans) => {
											if (typeof ans === 'string' && /[\u0600-\u06FF]/.test(ans)) {
												return await improveArabicWithEgyptianModel(ans, sendProgress);
											}
											return ans;
										})
									);
								}

								// Improve hints
								if (exercise.hint?.arabic) {
									exercise.hint.arabic = await improveArabicWithEgyptianModel(exercise.hint.arabic, sendProgress);
									const translations = await updateTranslations(
										exercise.hint.arabic,
										exercise.hint.english || '',
										exercise.hint.transliteration || '',
										openai
									);
									if (translations.english) exercise.hint.english = translations.english;
									if (translations.transliteration) exercise.hint.transliteration = translations.transliteration;
								}

								// Improve speaking exercise target phrase
								if (exercise.type === 'speaking' && exercise.targetPhrase?.arabic) {
									currentItem++;
									sendProgress(`[${currentItem}/${totalItems}] Validating speaking exercise target phrase...`);
									exercise.targetPhrase.arabic = await improveArabicWithEgyptianModel(exercise.targetPhrase.arabic, sendProgress);
									const translations = await updateTranslations(
										exercise.targetPhrase.arabic,
										exercise.targetPhrase.english || '',
										exercise.targetPhrase.transliteration || '',
										openai
									);
									if (translations.english) exercise.targetPhrase.english = translations.english;
									if (translations.transliteration) exercise.targetPhrase.transliteration = translations.transliteration;
								}

								// Improve writing exercise word to write
								if (exercise.type === 'writing' && exercise.wordToWrite?.arabic) {
									currentItem++;
									sendProgress(`[${currentItem}/${totalItems}] Validating writing exercise word...`);
									exercise.wordToWrite.arabic = await improveArabicWithEgyptianModel(exercise.wordToWrite.arabic, sendProgress);
									const translations = await updateTranslations(
										exercise.wordToWrite.arabic,
										exercise.wordToWrite.english || '',
										exercise.wordToWrite.transliteration || '',
										openai
									);
									if (translations.english) exercise.wordToWrite.english = translations.english;
									if (translations.transliteration) exercise.wordToWrite.transliteration = translations.transliteration;
								}

								// Improve sentence practice sentences
								if (exercise.type === 'sentence-practice' && exercise.sentences && Array.isArray(exercise.sentences)) {
									for (let k = 0; k < exercise.sentences.length; k++) {
										const sentence = exercise.sentences[k];
										if (sentence.arabic) {
											currentItem++;
											sendProgress(`[${currentItem}/${totalItems}] Validating sentence practice sentence ${k + 1}/${exercise.sentences.length}...`);
											sentence.arabic = await improveArabicWithEgyptianModel(sentence.arabic, sendProgress);
											const translations = await updateTranslations(
												sentence.arabic,
												sentence.english || '',
												sentence.transliteration || '',
												openai
											);
											if (translations.english) sentence.english = translations.english;
											if (translations.transliteration) sentence.transliteration = translations.transliteration;
										}
									}
								}
							}
						}
					}
				}

				sendProgress('✅ Lesson generated and validated successfully!');
				
				// Send final lesson data
				const finalData = JSON.stringify({ type: 'complete', lesson }) + '\n\n';
				controller.enqueue(encoder.encode(`data: ${finalData}`));
				controller.close();

			} catch (e) {
				console.error('Error generating lesson:', e);
				const errorData = JSON.stringify({ 
					type: 'error', 
					message: e instanceof Error ? e.message : 'Failed to generate lesson' 
				}) + '\n\n';
				controller.enqueue(encoder.encode(`data: ${errorData}`));
				controller.close();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
		},
	});
};

