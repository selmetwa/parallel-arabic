/**
 * Multiple-choice question building, shared by the vocabulary game and the
 * public vocabulary pages.
 *
 * Lifted out of `src/routes/learn/game/play/+page.svelte`. Note that it mixes
 * direction per question — asking only ever one way lets people pattern-match
 * the shape of the answer instead of reading it.
 */

export type QuizDirection = 'arabic-to-english' | 'english-to-arabic';

export interface QuizWord {
	arabic_word: string;
	english_word: string;
}

export interface MultipleChoice {
	options: string[];
	correctAnswer: string;
	type: QuizDirection;
}

/**
 * Build one question for `word`, drawing three wrong options from `allWords`.
 *
 * `allWords` should be the whole pool the word came from — a topic, a category,
 * a page's related words — so the distractors are plausible rather than random.
 *
 * The direction is random unless pinned. Listening rounds pin it to
 * `arabic-to-english`, since the prompt is audio and the answer has to be the
 * gloss.
 */
export function buildMultipleChoice(
	word: QuizWord,
	allWords: QuizWord[],
	direction?: QuizDirection
): MultipleChoice {
	const type: QuizDirection =
		direction ?? (Math.random() > 0.5 ? 'arabic-to-english' : 'english-to-arabic');
	const askingForEnglish = type === 'arabic-to-english';

	const correctAnswer = askingForEnglish ? word.english_word : word.arabic_word;

	// Dedupe on the text that will actually be shown, not on the headword.
	// Frequency lists carry several words per gloss — awi and geddan both mean
	// "very" — and offering two options that read identically makes the question
	// unanswerable, or worse, marks a right answer wrong.
	const seen = new Set([correctAnswer]);
	const wrongAnswers: string[] = [];

	for (const other of [...allWords].sort(() => Math.random() - 0.5)) {
		if (wrongAnswers.length === 3) break;
		if (other.arabic_word === word.arabic_word) continue;

		const option = askingForEnglish ? other.english_word : other.arabic_word;
		if (seen.has(option)) continue;

		seen.add(option);
		wrongAnswers.push(option);
	}

	const options = [...wrongAnswers, correctAnswer].sort(() => Math.random() - 0.5);

	return { options, correctAnswer, type };
}
