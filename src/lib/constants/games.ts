/**
 * The games on /learn/game: hub cards, page copy, SEO and FAQs.
 *
 * Plain data (no Svelte or $app imports) so seo.ts, the sitemap and tests can
 * read it. The hub lists only what is in here, so a game appears once it ships.
 */

export interface Faq {
	question: string;
	answer: string;
}

export interface GameInfo {
	slug: string;
	name: string;
	/** The page's h1 — worded for the search it should rank for. */
	heading: string;
	emoji: string;
	tagline: string;
	skills: string[];
	levels: string;
	access: 'free-to-try' | 'subscriber';
	accent: string;
	deep: string;
	seo: { title: string; description: string };
	intro: string;
	howToPlay: string[];
	faqs: Faq[];
}

export const GAMES: GameInfo[] = [
	{
		slug: 'word-match',
		name: 'Word Match',
		heading: 'Arabic Word Match',
		emoji: '🃏',
		tagline: 'Flip the cards and pair each Arabic word with its meaning.',
		skills: ['Vocabulary', 'Memory'],
		levels: 'Beginner',
		access: 'free-to-try',
		accent: '#0ea5e9',
		deep: '#0369a1',
		seo: {
			title: 'Arabic Word Match - Free Memory Card Game | Parallel Arabic',
			description:
				'A free Arabic memory game. Flip the cards, match each Arabic word to its English meaning, and hear it spoken. Egyptian, Levantine, Darija and Fusha.'
		},
		intro:
			'A memory game for Arabic vocabulary. Every word is on the board twice: once in Arabic, once in English. Turn over two cards at a time and find the pairs in as few moves as you can.',
		howToPlay: [
			'Pick a dialect and a theme, then choose Easy (6 pairs) or Hard (8 pairs).',
			'Tap a card to turn it over, then tap a second one.',
			'If the Arabic word and the English meaning belong together, they stay face up. If not, they turn back over, so remember where they were.',
			'Clear the board in as few moves as you can, then play again for a new set of words.'
		],
		faqs: [
			{
				question: 'How do I play Arabic Word Match?',
				answer:
					'Turn over two cards. If one is an Arabic word and the other is its English meaning, the pair stays face up. If not, both turn back over. The game ends when every pair is found, and your score is the number of moves it took.'
			},
			{
				question: 'What is the difference between Easy and Hard?',
				answer:
					'Easy has 6 pairs, about two or three minutes of play. Hard has 8 pairs, which is more to remember and takes three to five minutes.'
			},
			{
				question: 'Can I hear the words?',
				answer:
					'Yes, for most themes. Egyptian, Levantine and Moroccan Darija words come with recordings by native speakers; the list at the end of each board lets you play them. Premium adds audio for every word, including Fusha.'
			},
			{
				question: 'Why are the words different in each dialect?',
				answer:
					'Because the dialects really do use different words. A tomato is طماطم in Egypt, بندورة in the Levant and ماطيشة in Morocco. Pick the dialect you are learning and the board uses its words.'
			}
		]
	},
	{
		slug: 'word-scramble',
		name: 'Word Scramble',
		heading: 'Arabic Word Scramble',
		emoji: '🔤',
		tagline: 'Put the letters back in order and watch them join into a word.',
		skills: ['Spelling', 'Letters'],
		levels: 'Beginner–Intermediate',
		access: 'free-to-try',
		accent: '#8b5cf6',
		deep: '#6d28d9',
		seo: {
			title: 'Arabic Word Scramble - Unscramble the Letters | Parallel Arabic',
			description:
				'Unscramble Arabic words letter by letter and see how the letters join as you go. Free spelling practice in Egyptian, Levantine, Darija and Fusha.'
		},
		intro:
			'A spelling game for Arabic words. You get the meaning and the letters, shuffled. Tap them back into order, and the answer joins up as you go, the way Arabic letters connect in real writing.',
		howToPlay: [
			'Pick a dialect and a theme. Each set has five words, from short to long.',
			'Read the meaning, then tap the letters in the order you think they go. The word builds from right to left.',
			'Undo takes back the last letter. Stuck? A hint places the next correct letter, and Skip shows the answer.',
			'Finish the set to see which words you unscrambled on your own.'
		],
		faqs: [
			{
				question: 'Arabic letters change shape. How do the tiles work?',
				answer:
					'Each tile shows a letter on its own, the way it looks in the alphabet. When you place it, it joins the letters around it and takes the shape it has inside the word. Watching that happen is half the point of the game.'
			},
			{
				question: 'Is there a timer?',
				answer:
					'No. Take as long as you need. The score counts the words you solved without a hint or a skip.'
			},
			{
				question: 'Can I type instead of tapping?',
				answer:
					'Yes. With an Arabic keyboard layout, typing a letter places the matching tile and Backspace takes the last one back.'
			}
		]
	},
	{
		slug: 'word-guess',
		name: 'Word Guess',
		heading: 'Arabic Word Guess (Hangman)',
		emoji: '🔎',
		tagline: 'Find the hidden Arabic word one letter at a time.',
		skills: ['Spelling', 'Letters', 'Vocabulary'],
		levels: 'Beginner–Intermediate',
		access: 'free-to-try',
		accent: '#f59e0b',
		deep: '#b45309',
		seo: {
			title: 'Arabic Hangman Game - Guess the Word | Parallel Arabic',
			description:
				'Arabic hangman: guess the hidden word one letter at a time, with its English meaning as the clue. Free in Egyptian, Levantine, Darija and Fusha.'
		},
		intro:
			'Arabic hangman, without the gallows. You know what the word means and how many letters it has. Guess its letters one at a time before you run out of misses.',
		howToPlay: [
			'Pick a dialect and a theme. The meaning of the hidden word is your clue.',
			'Tap a letter. If it is in the word, every place it appears is filled in.',
			'Six wrong letters and the word is revealed.',
			'Each word ends with its spelling, transliteration and, where there is a recording, how it sounds.'
		],
		faqs: [
			{
				question: 'Is this Arabic hangman?',
				answer:
					'Yes, the same idea: guess the letters of a hidden word before your misses run out. You get six misses per word, and there is no gallows.'
			},
			{
				question: 'Do I need to find hamza and taa marbuta separately?',
				answer:
					'No. Letters that are written differently but learned together share a key: ا also fills in أ, إ and آ; ه fills in ة; ي fills in ى; and ء fills in ئ and ؤ.'
			},
			{
				question: 'Can I use my computer keyboard?',
				answer:
					'Yes, with an Arabic keyboard layout. Each letter you type counts as a guess, and Enter moves on to the next word.'
			}
		]
	},
	{
		slug: 'sentence-scramble',
		name: 'Sentence Scramble',
		heading: 'Arabic Sentence Scramble',
		emoji: '🧩',
		tagline: 'Put the words of an Arabic sentence back in the right order.',
		skills: ['Grammar', 'Word order'],
		levels: 'Beginner–Advanced',
		access: 'subscriber',
		accent: '#ec4899',
		deep: '#9d174d',
		seo: {
			title: 'Arabic Sentence Scramble - Word Order Game | Parallel Arabic',
			description:
				'Rebuild Arabic sentences from their scrambled words. Fresh sentences at your level in Egyptian, Levantine, Darija or Fusha, with audio and transliteration.'
		},
		intro:
			'A word-order game for Arabic. You see what a sentence means in English and its words in a jumble. Tap them into the right order and learn how a sentence in your dialect is put together.',
		howToPlay: [
			'Pick a dialect and a level, then start a round of eight sentences.',
			'Read the English, then tap the Arabic words in order. The sentence builds from right to left.',
			'Tap a placed word to send it back. When all the words are in, the sentence is checked.',
			'Words in the wrong place are highlighted. Fix them, or show the answer and move on.'
		],
		faqs: [
			{
				question: "Isn't Arabic word order flexible?",
				answer:
					'Often it is, especially in speech. The sentences in this game are chosen to have one natural order, so the answer is not up for debate. They are short, everyday sentences, not lists or phrases that could go either way.'
			},
			{
				question: 'Can I hear the sentences?',
				answer:
					'Yes. Once a sentence is solved you can play it aloud in your dialect, and read its transliteration.'
			},
			{
				question: 'What level are the sentences?',
				answer:
					'You choose. Beginner sentences are three to six words of everyday Arabic; advanced ones run up to ten words with richer vocabulary.'
			}
		]
	}
];

/** The multiple-choice / listening / speaking quiz, listed on the hub beside the games. */
export const QUIZ_CARD = {
	slug: 'quiz',
	name: 'Vocabulary Quiz',
	emoji: '📝',
	tagline: 'Fresh sentences at your level, as multiple choice, listening or speaking rounds.',
	skills: ['Reading', 'Listening', 'Speaking'],
	levels: 'A1–C2',
	access: 'subscriber' as const,
	accent: '#22c55e',
	deep: '#15803d'
};

export const GAMES_HUB_FAQS: Faq[] = [
	{
		question: 'Are the Arabic games free?',
		answer:
			'The word games are free to try: play three rounds of each a day without an account, and three more a day once you sign up. Premium unlocks unlimited rounds and every other game, including the quiz.'
	},
	{
		question: 'Which dialects can I play in?',
		answer:
			'Egyptian Arabic, Levantine, Moroccan Darija and Modern Standard Arabic. The words change with the dialect you pick, so you are not learning Fusha vocabulary with an Egyptian accent bolted on.'
	},
	{
		question: 'Do I need to know the Arabic alphabet first?',
		answer:
			'It helps. The word games show every word in Arabic script next to its meaning, so they are good practice for reading once you know the letters. The interactive alphabet takes about an hour and makes everything after it easier.'
	},
	{
		question: 'Which game should I start with?',
		answer:
			'Word Match, if you are new to a topic: it introduces the words and asks you only to recognise them. Move on to the quiz once the words look familiar.'
	},
	{
		question: 'Are these games good for children?',
		answer:
			'They work for any age, though the vocabulary is chosen for adult learners: food, family, travel, work. There is no timer and nothing to lose, so they suit a slow pace.'
	}
];

/** A game's page path. Typed as a path so it can go straight into `resolve()`. */
export function gameHref(slug: string): `/learn/game/${string}` {
	return `/learn/game/${slug}`;
}

export function getGame(slug: string): GameInfo | undefined {
	return GAMES.find((g) => g.slug === slug);
}
