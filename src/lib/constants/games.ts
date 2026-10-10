/**
 * The games on /learn/game: hub cards, page copy, SEO and FAQs.
 *
 * Plain data (no Svelte or $app imports) so seo.ts, the sitemap and tests can
 * read it. The hub lists only what is in here, so a game appears once it ships.
 */

import type { Pathname } from '$app/types';

export interface Faq {
	question: string;
	answer: string;
}

/** A mid-round screenshot for the hub card, from scripts/capture-feature-screenshots.ts. */
export interface GameShot {
	src: string;
	w: number;
	h: number;
	alt: string;
}

export interface GameInfo {
	slug: string;
	/** Set when the game lives outside /learn/game (Scenarios has a page of its own). */
	path?: Pathname;
	/** Slug of the game's /features landing page, linked from the game page. */
	feature?: string;
	name: string;
	/** The page's h1 — worded for the search it should rank for. */
	heading: string;
	emoji: string;
	tagline: string;
	skills: string[];
	levels: string;
	accent: string;
	deep: string;
	shot: GameShot;
	seo: { title: string; description: string };
	intro: string;
	howToPlay: string[];
	faqs: Faq[];
}

export const GAMES: GameInfo[] = [
	{
		slug: 'room-hunt',
		feature: 'learn-arabic-in-3d',
		name: 'Room Hunt',
		heading: 'Arabic Room Hunt: Find the Object',
		emoji: '🏠',
		tagline: 'Step into a 3D kitchen, bathroom or restaurant and learn what everything is called.',
		skills: ['Vocabulary', 'Listening', 'Speaking'],
		levels: 'Beginner',
		accent: '#f59e0b',
		deep: '#b45309',
		shot: {
			src: '/images/feature-pages/game-room-hunt.webp',
			w: 2560,
			h: 1460,
			alt: 'A Room Hunt lesson: a 3D kitchen with the fridge labelled تلاجة and a card teaching the word'
		},
		seo: {
			title: 'Arabic Room Hunt - Learn Household Words in 3D | Parallel Arabic',
			description:
				'Look around a 3D kitchen, bathroom and restaurant and tap the object that matches the Arabic word. Egyptian, Levantine, Darija and Fusha.'
		},
		intro:
			'A vocabulary game set in real rooms. Step into a kitchen, a bathroom or a restaurant and learn what everything is called, a few words at a time, then find each thing when you hear "Where is the…?" in your dialect.',
		howToPlay: [
			'Pick a dialect and a room. Drag to look around, or use the arrow keys. Tap anything to hear its name.',
			'Start a lesson and the game goes fullscreen. It teaches four new words: each object glows, says its name, and you tap it to move on.',
			'Then it asks for them, mixed with words you already know. In Find it you tap the object; in Name it you pick or say its name.',
			'Miss one and it comes back a few questions later. Miss twice and the answer glows, but that one earns no XP.'
		],
		faqs: [
			{
				question: 'Which words does Room Hunt teach?',
				answer:
					'Everyday things around the house and at a meal out: the fridge, the stove, the sink, the mirror, plates, forks, bread, tea. Each dialect uses its own word, so the fridge is a tallaga in Cairo and a barrad in Beirut.'
			},
			{
				question: 'Does it work on a phone?',
				answer:
					'Yes. Drag with one finger to look around and tap to choose. The room loads once, and small things like forks have a generous tap area.'
			},
			{
				question: 'What do Easy, Normal and Hard change?',
				answer:
					'Easy shows the Arabic, the transliteration and the English, and an arrow points the way. Normal drops the English. Hard is listening only: you hear the question and find the object, and the words appear after you answer.'
			},
			{
				question: 'Can I practise ordering food in Arabic?',
				answer:
					'Yes. In the restaurant, choose Order a meal. You sit at a table and a waiter takes your order in your dialect: greet them, order a drink and a main, decide on dessert and ask for the bill. Whatever you order is brought to your table.'
			},
			{
				question: 'Can I practise speaking in Room Hunt?',
				answer:
					'Yes. In Name it mode an object glows and you can tap the microphone and say its name instead of picking from the list. Every word also has a recording you can replay as often as you like.'
			}
		]
	},
	{
		slug: 'scenarios',
		path: '/scenarios',
		name: 'Scenarios',
		heading: 'Arabic Conversation Practice: Taxi, Market, Pharmacy and More',
		emoji: '🗣️',
		tagline: 'Take a taxi, haggle at a market, see a pharmacist and check into a hotel, in Arabic.',
		skills: ['Speaking', 'Listening', 'Phrases'],
		levels: 'Beginner–Intermediate',
		accent: '#0ea5e9',
		deep: '#0369a1',
		shot: {
			src: '/images/feature-pages/game-scenarios.webp',
			w: 2560,
			h: 1440,
			alt: 'A Scenarios conversation at a market stall: the seller asks how many kilos in Egyptian Arabic, with your replies to choose from'
		},
		seo: {
			title: 'Arabic Conversation Practice: Real-Life Scenes | Parallel Arabic',
			description:
				'Practise everyday Arabic conversations in 3D: take a taxi, haggle at a market, visit a pharmacy, check into a hotel. In Egyptian, Levantine, Darija and Fusha.'
		},
		intro:
			'Short spoken conversations in places you will actually be. A taxi driver asks where you are going, a market seller tells you the price, a pharmacist asks what hurts. You answer in Arabic, and what you ask for turns up.',
		howToPlay: [
			'Pick a dialect and a scene: a restaurant, a taxi, a market, a pharmacy or a hotel.',
			'Press Start. The other person speaks first, with the Arabic, transliteration and English on screen and a recording you can replay.',
			'Answer by tapping one of the replies, or press the microphone and say it. Some replies do not fit the moment, and you will be asked again.',
			'What you ask for happens: the taxi drives you there, the seller bags your tomatoes. At the end you keep every phrase you used.'
		],
		faqs: [
			{
				question: 'Which situations can I practise?',
				answer:
					'Ordering a meal, taking a taxi (with directions and haggling the fare), buying fruit and vegetables at a market, describing symptoms at a pharmacy, and checking into a hotel. More are on the way.'
			},
			{
				question: 'Do I have to speak, or can I tap?',
				answer:
					'Either. Every turn offers a few replies to tap, and a microphone to say one instead. Hearing your reply played back in a native voice after you choose it is part of the practice.'
			},
			{
				question: 'Is the Arabic the same in every dialect?',
				answer:
					'No. Each scene is written separately for Egyptian, Levantine, Moroccan Darija and Modern Standard Arabic, so the taxi driver in Cairo says 3ala feen? and the one in Casablanca says fin ghadi?'
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
		accent: '#8b5cf6',
		deep: '#6d28d9',
		shot: {
			src: '/images/feature-pages/game-word-scramble.webp',
			w: 1568,
			h: 894,
			alt: 'A Word Scramble round: the English meaning, the word so far and the letter tiles left to place'
		},
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
		shot: {
			src: '/images/feature-pages/game-odd-one-out.webp',
			w: 1568,
			h: 708,
			alt: 'An Odd One Out puzzle: four Arabic words with transliteration, one of which does not belong'
		},
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
		shot: {
			src: '/images/feature-pages/game-spot-the-mistake.webp',
			w: 1568,
			h: 520,
			alt: 'A Spot the Mistake round: an Arabic sentence with its English meaning and one wrong word to find'
		},
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
		shot: {
			src: '/images/feature-pages/game-sentence-scramble.webp',
			w: 1568,
			h: 810,
			alt: 'A Sentence Scramble round: an English sentence and the Arabic words to tap into the right order'
		},
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
	},
	{
		slug: 'memory-pairs',
		name: 'Memory Pairs',
		heading: 'Arabic Memory Game: Match the Pairs',
		emoji: '🃏',
		tagline: 'Turn over cards and match each Arabic word to its meaning, or to its sound.',
		skills: ['Vocabulary', 'Reading', 'Listening'],
		levels: 'Beginner',
		accent: '#8b5cf6',
		deep: '#6d28d9',
		shot: {
			src: '/images/feature-pages/game-memory-pairs.webp',
			w: 1568,
			h: 900,
			alt: 'A Memory Pairs board: twelve cards, two turned over showing an Arabic word and its English meaning'
		},
		seo: {
			title: 'Arabic Memory Game - Match Words to Meanings | Parallel Arabic',
			description:
				'A free Arabic memory game: turn over cards and match each word to its English meaning or its recording. Egyptian, Levantine, Darija and Fusha, by theme.'
		},
		intro:
			'The card game you know, with Arabic words. Twelve cards, six pairs: turn two over at a time and find each Arabic word’s English meaning. Switch to Sound and match the word to its recording instead.',
		howToPlay: [
			'Pick a dialect and a theme, then choose Arabic ↔ English or Sound ↔ Arabic.',
			'Tap a card to turn it over, then tap another. If they are a pair, they stay face up.',
			'If they aren’t, they turn back over after a moment. Remember where they were.',
			'Clear the board in as few moves as you can. Six moves is a perfect game.'
		],
		faqs: [
			{
				question: 'Does a memory game actually help with Arabic vocabulary?',
				answer:
					'Yes. Every turn makes you read an Arabic word and recall what it means before you find its partner, and you see the same words several times in a few minutes. That repeated recall is what makes words stick.'
			},
			{
				question: 'What is the Sound mode?',
				answer:
					'Half the cards play a recording instead of showing text. You match what you hear to the written Arabic, which trains your ear and your reading at the same time. It appears for themes where every word has a recording.'
			},
			{
				question: 'Which words are on the cards?',
				answer:
					'Everyday words from the theme you pick, like food, animals, the body or the house, in the dialect you choose. Each new board leans towards words you haven’t just seen.'
			}
		]
	},
	{
		slug: 'speed-round',
		name: 'Speed Round',
		heading: 'Arabic Vocabulary Speed Quiz: 60 Seconds',
		emoji: '⚡',
		tagline: 'An Arabic word and a meaning: right or wrong? As many as you can in a minute.',
		skills: ['Vocabulary', 'Reading'],
		levels: 'Beginner–Intermediate',
		accent: '#eab308',
		deep: '#a16207',
		shot: {
			src: '/images/feature-pages/game-speed-round.webp',
			w: 1568,
			h: 900,
			alt: 'A Speed Round question: an Arabic word beside an English meaning, with Right and Wrong buttons and the clock running'
		},
		seo: {
			title: 'Arabic Vocabulary Speed Quiz - 60-Second Game | Parallel Arabic',
			description:
				'How many Arabic words can you check in 60 seconds? A fast true-or-false vocabulary game with streak bonuses, in Egyptian, Levantine, Darija and Fusha.'
		},
		intro:
			'Sixty seconds on the clock. You see an Arabic word next to an English meaning: is it right or wrong? Answer as fast as you can. Five right in a row doubles your points, ten triples them, and one miss resets the streak.',
		howToPlay: [
			'Pick a dialect and a theme, then press Start the clock.',
			'Read the Arabic word and the meaning beside it. Tap Right if they match, Wrong if they don’t.',
			'On a keyboard, use → or Y for right and ← or N for wrong.',
			'When the time is up you see your score, your best streak and the words you missed.'
		],
		faqs: [
			{
				question: 'Why play against the clock?',
				answer:
					'Knowing a word slowly isn’t the same as knowing it. In conversation you have a second or two to recognise it, and a timed round shows you which words you really know and which you are still working out.'
			},
			{
				question: 'How does the score work?',
				answer:
					'Each right answer is worth one point. From five in a row it is worth two, and from ten in a row three. A wrong answer costs nothing but resets the streak, so accuracy pays more than guessing.'
			},
			{
				question: 'Is my best score saved?',
				answer:
					'Yes, on this device, for each dialect and theme, so you have something to beat next time.'
			}
		]
	},
	{
		slug: 'listen-and-spell',
		name: 'Listen & Spell',
		heading: 'Arabic Listening Game: Hear It, Spell It',
		emoji: '👂',
		tagline: 'Hear an Arabic word and pick how it’s spelled. س or ص? ت or ط?',
		skills: ['Listening', 'Spelling'],
		levels: 'Beginner–Intermediate',
		accent: '#06b6d4',
		deep: '#0e7490',
		shot: {
			src: '/images/feature-pages/game-listen-and-spell.webp',
			w: 1568,
			h: 900,
			alt: 'A Listen & Spell question: a play button and four Arabic spellings of a word to choose from'
		},
		seo: {
			title: 'Arabic Listening & Spelling Game | Parallel Arabic',
			description:
				'Hear a native recording and pick the right Arabic spelling, with near-misses like س and ص or ت and ط to train your ear. Egyptian, Levantine, Darija and Fusha.'
		},
		intro:
			'A listening game for the letters that sound alike. Hear a word, recorded by a native speaker, and pick its spelling from four. One of the wrong answers is always close: the same word with س for ص, or ك for ق.',
		howToPlay: [
			'Pick a dialect and a theme, then press Play the word.',
			'Listen, as many times as you like, and tap the spelling you heard.',
			'The answer shows the word with its transliteration and meaning.',
			'After eight words, go over the ones you missed and play them again.'
		],
		faqs: [
			{
				question: 'Why are some of the wrong answers so close?',
				answer:
					'Because those are the letters learners actually confuse: س and ص, ت and ط, د and ض, ك and ق, ح and ه. Telling them apart by ear is what lets you spell a new word you hear, and look it up.'
			},
			{
				question: 'Do I have to type anything?',
				answer:
					'No. You only listen and tap. The game is about hearing the difference between sounds, not about using an Arabic keyboard.'
			},
			{
				question: 'Are the recordings real people?',
				answer:
					'Yes. Every word in the game has a recording, and themes without enough recorded words are left out.'
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
	deep: '#15803d',
	shot: {
		src: '/images/feature-pages/game-quiz.webp',
		w: 1456,
		h: 1490,
		alt: 'A Vocabulary Quiz question: fill in the blank in an Arabic sentence from four choices'
	}
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
			'They work for any age, though the vocabulary is chosen for adult learners: food, family, travel, work. Only Speed Round has a timer, so the rest suit a slow pace.'
	}
];

export function gameHref(slug: string): Pathname {
	return getGame(slug)?.path ?? (`/learn/game/${slug}` as Pathname);
}

export function getGame(slug: string): GameInfo | undefined {
	return GAMES.find((g) => g.slug === slug);
}
