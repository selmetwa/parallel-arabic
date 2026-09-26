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
	accent: string;
	deep: string;
	seo: { title: string; description: string };
	intro: string;
	howToPlay: string[];
	faqs: Faq[];
}

export const GAMES: GameInfo[] = [
	{
		slug: 'word-scramble',
		name: 'Word Scramble',
		heading: 'Arabic Word Scramble',
		emoji: '🔤',
		tagline: 'Put the letters back in order and watch them join into a word.',
		skills: ['Spelling', 'Letters'],
		levels: 'Beginner–Intermediate',
		accent: '#8b5cf6',
		deep: '#6d28d9',
		seo: {
			title: 'Arabic Word Scramble - Unscramble the Letters | Parallel Arabic',
			description:
				'Unscramble Arabic words letter by letter and see how the letters join as you go. Spelling practice in Egyptian, Levantine, Darija and Fusha.'
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
		slug: 'odd-one-out',
		name: 'Odd One Out',
		heading: 'Arabic Odd One Out',
		emoji: '🧠',
		tagline: 'Four Arabic words, one doesn’t belong. Spot it, then learn why.',
		skills: ['Vocabulary', 'Grammar'],
		levels: 'Beginner–Advanced',
		accent: '#10b981',
		deep: '#047857',
		seo: {
			title: 'Arabic Odd One Out - Word Puzzles | Parallel Arabic',
			description:
				'Arabic word puzzles: four words, one doesn’t belong. Spot it by meaning, gender, word type or shared root, then read why. Fresh puzzles in four dialects.'
		},
		intro:
			'Four Arabic words: three share something, one doesn’t. Sometimes it’s the meaning, sometimes the grammar: gender, singular or plural, or the three-letter root the words are built from. Every answer comes with the reason.',
		howToPlay: [
			'Pick a dialect and a level, then start a round of ten puzzles. They get harder as you go.',
			'Read the four words and tap the one that doesn’t belong.',
			'Every word’s meaning appears, with a line explaining the pattern.',
			'At the end, go back over the puzzles you missed and their explanations.'
		],
		faqs: [
			{
				question: 'What patterns do the puzzles use?',
				answer:
					'Five kinds: meaning (three fruits and a chair), gender (three masculine nouns and a feminine one), word type (three verbs and a noun), singular or plural, and shared root.'
			},
			{
				question: 'What is an Arabic root?',
				answer:
					'Most Arabic words are built from a root of three consonants that carries a core meaning. كتاب (book), مكتب (office) and كاتب (writer) all come from ك-ت-ب, to do with writing. Spotting roots is one of the fastest ways to guess new words.'
			},
			{
				question: 'Are the puzzles the same every time?',
				answer: 'No. Every round is a fresh set of ten, in the dialect and at the level you choose.'
			}
		]
	},
	{
		slug: 'spot-the-mistake',
		name: 'Spot the Mistake',
		heading: 'Spot the Mistake in Arabic',
		emoji: '🔍',
		tagline: 'One word in each Arabic sentence is wrong. Tap it and see the fix.',
		skills: ['Grammar', 'Reading'],
		levels: 'Beginner–Advanced',
		accent: '#f43f5e',
		deep: '#9f1239',
		seo: {
			title: 'Spot the Mistake - Arabic Grammar Game | Parallel Arabic',
			description:
				'An Arabic grammar game: each sentence has one wrong word. Tap it, see the corrected sentence and learn the rule. Fresh sentences in four dialects.'
		},
		intro:
			'Each Arabic sentence has one word that doesn’t fit: an adjective in the wrong gender, a verb that doesn’t match its subject, a plural that should be singular. Find it, then see the corrected sentence and the rule behind it.',
		howToPlay: [
			'Pick a dialect and a level, then start a round of ten sentences.',
			'Read the sentence, with its English meaning underneath, and tap the word that’s wrong.',
			'The correction appears over the wrong word, with the corrected sentence and a short explanation.',
			'At the end, review every corrected sentence and play any of them aloud.'
		],
		faqs: [
			{
				question: 'What kinds of mistakes are in the sentences?',
				answer:
					'The ones learners make most: an adjective that doesn’t agree with its noun, a verb in the wrong person, a singular where a plural belongs, and a possessive ending that points to the wrong person. Each one clashes with another word in the same sentence, so you can prove it.'
			},
			{
				question: 'Does the grammar change by dialect?',
				answer:
					'Some of it does. Verb prefixes and demonstratives differ between Egyptian, Levantine, Darija and Fusha, so the sentences and corrections follow the dialect you pick.'
			},
			{
				question: 'What level is Spot the Mistake for?',
				answer:
					'Any level. Beginner rounds use short everyday sentences; advanced rounds use longer sentences where the mismatch is further from the word it depends on.'
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
	accent: '#22c55e',
	deep: '#15803d'
};

export const GAMES_HUB_FAQS: Faq[] = [
	{
		question: 'Are the Arabic games free?',
		answer:
			'Every game gives you two free rounds, no account needed. Sign up and you get two more of each; Premium unlocks unlimited rounds of everything.'
	},
	{
		question: 'Which dialects can I play in?',
		answer:
			'Egyptian Arabic, Levantine, Moroccan Darija and Modern Standard Arabic. The words and sentences change with the dialect you pick, so you are not learning Fusha vocabulary with an Egyptian accent bolted on.'
	},
	{
		question: 'Do I need to know the Arabic alphabet first?',
		answer:
			'It helps. Every game is played in Arabic script, so knowing the letters makes them far easier. The interactive alphabet takes about an hour and makes everything after it easier.'
	},
	{
		question: 'Which game should I start with?',
		answer:
			'Word Scramble if you are new to reading Arabic: it shows you how letters join into words. Odd One Out and Spot the Mistake suit learners who can already read a little.'
	},
	{
		question: 'Are these games good for children?',
		answer:
			'They work for any age, though the vocabulary is chosen for adult learners: food, family, travel, work. There is no timer and nothing to lose, so they suit a slow pace.'
	}
];

export function gameHref(slug: string): `/learn/game/${string}` {
	return `/learn/game/${slug}`;
}

export function getGame(slug: string): GameInfo | undefined {
	return GAMES.find((g) => g.slug === slug);
}
