/**
 * Copy for the /learn/game/quiz setup page (moved from /learn/game, which is
 * now the games hub).
 *
 * The page ranked around position 22 for "arabic games", "arabic language
 * games" and "arabic word game" because it was a configuration screen with no
 * h1 and nothing to read. This is the content a visitor arriving from search
 * needs before they will start a game.
 */
export const GAME_MODE_INFO = [
	{
		icon: '📝',
		title: 'Multiple choice',
		body: 'See an Arabic word and pick the English meaning, or the other way round. The fastest way to work through a topic and find out which words have not stuck yet.'
	},
	{
		icon: '🎧',
		title: 'Listening',
		body: 'Hear a whole sentence spoken in your dialect and choose what it means, from four readings that differ by one thing — a tense, who is speaking, whether it was negated. This is the mode that closes the gap between recognising words on the page and catching them in conversation.'
	},
	{
		icon: '🎤',
		title: 'Speaking',
		body: 'Say the word out loud and get scored on whether you were understood. Useful for the sounds English does not have — ع, ح, ق and the emphatic letters.'
	}
];

/**
 * Quiz-only questions. The general ones (is it free, which dialects, the
 * alphabet) live on the games hub, in GAMES_HUB_FAQS, so the two pages don't
 * emit the same FAQ markup.
 */
export const QUIZ_FAQS = [
	{
		question: 'Can I quiz myself on my saved words?',
		answer:
			'Yes, in sentence rounds. Turn on "Use Your Review Words" and the quiz writes its sentences around the words you have saved: all of them, or only the ones due for review.'
	},
	{
		question: 'How does speaking mode score me?',
		answer:
			'You say the word or sentence, and what you said is compared with the target letter by letter. A word passes at 60% and a sentence at 50%, and you can try again as often as you like or skip.'
	},
	{
		question: 'What does listening mode test?',
		answer:
			'Whether you understood a whole sentence, not whether you caught one word. You hear the sentence and pick its meaning from four readings that differ in one detail: the tense, who is speaking, or whether it was negated.'
	}
];
