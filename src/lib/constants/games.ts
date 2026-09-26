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
