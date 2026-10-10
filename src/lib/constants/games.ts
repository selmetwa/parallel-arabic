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
		feature: 'arabic-role-play-practice',
		path: '/scenarios',
		name: 'Scenarios',
		heading: 'Arabic Conversation Practice: Taxi, Market, Pharmacy and More',
		emoji: '🗣️',
		tagline: 'Take a taxi, see a doctor, check in for a flight and order a coffee, in Arabic.',
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
				'Everyday Arabic conversations in 3D: a taxi, a market, a doctor, airport check-in, a café and more. In Egyptian, Levantine, Darija and Fusha.'
		},
		intro:
			'Short spoken conversations in places you will actually be. A taxi driver asks where you are going, a market seller tells you the price, a pharmacist asks what hurts. You answer in Arabic, and what you ask for turns up.',
		howToPlay: [
			'Pick a dialect and a scene: a restaurant, a taxi, a market, a pharmacy, a hotel, a café, a doctor’s office, an airport or a street where you ask the way.',
			'Press Start. The other person speaks first, with the Arabic, transliteration and English on screen and a recording you can replay.',
			'Answer by tapping one of the replies, or press the microphone and say it. Some replies do not fit the moment, and you will be asked again.',
			'What you ask for happens: the taxi drives you there, the seller bags your tomatoes. At the end you keep every phrase you used.'
		],
		faqs: [
			{
				question: 'Which situations can I practise?',
				answer:
					'Nine so far: ordering a meal, taking a taxi (with directions and haggling the fare), buying fruit and vegetables at a market, describing symptoms at a pharmacy, checking into a hotel, ordering at a café, seeing a doctor, checking in for a flight, and asking a stranger the way.'
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
		feature: 'arabic-spelling-practice',
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
		feature: 'arabic-vocabulary-puzzles',
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
		feature: 'arabic-grammar-practice',
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
		feature: 'arabic-sentence-building-practice',
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
		feature: 'arabic-memory-game-vocabulary',
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
			w: 1648,
			h: 1082,
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
		feature: 'arabic-flashcards-speed-practice',
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
			w: 1648,
			h: 806,
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
		feature: 'arabic-listening-spelling-practice',
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
			w: 1648,
			h: 760,
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
	},
	{
		slug: 'letter-hunt',
		feature: 'arabic-letter-forms-practice',
		name: 'Letter Hunt',
		heading: 'Arabic Letter Game: Beginning, Middle and End Forms',
		emoji: '🔡',
		tagline: 'Recognise every Arabic letter at the start, middle and end of a word, and by its sound.',
		skills: ['Alphabet', 'Reading', 'Listening'],
		levels: 'Absolute beginner',
		accent: '#14b8a6',
		deep: '#0f766e',
		shot: {
			src: '/images/feature-pages/game-letter-hunt.webp',
			w: 1648,
			h: 690,
			alt: 'A Letter Hunt question: the middle form of an Arabic letter, with four letters to choose from'
		},
		seo: {
			title: 'Arabic Letter Forms Game | Parallel Arabic',
			description:
				'Learn to recognise Arabic letters in every position: the start, middle and end of a word, plus the sound of each one. A free game for beginners.'
		},
		intro:
			'Most Arabic letters change shape depending on where they sit in a word. This game drills all of them: see a letter in its middle or end form and name it, pick how a letter is written at the start of a word, or hear a sound and find its letter.',
		howToPlay: [
			'Press Start. A round is ten letters, with three kinds of question mixed together.',
			'Name the letter from one of its forms, pick the right form for a position, or tap the letter you hear.',
			'The wrong answers are letters with the same body and different dots, the mix-ups that slow readers down.',
			'After each answer you see all of the letter’s forms. At the end, replay the sounds of any you missed.'
		],
		faqs: [
			{
				question: 'Why do Arabic letters have different forms?',
				answer:
					'Arabic is joined-up writing. Most letters connect to the next one, so they have a form for the start, the middle and the end of a word, plus one for when they stand alone. ب is ﺑ at the start, ﺒ in the middle and ﺐ at the end.'
			},
			{
				question: 'Which letters don’t join?',
				answer:
					'Six letters never connect to the letter after them: ا, د, ذ, ر, ز and و. They only have a standalone form and an end form, which is why the game never asks for their start or middle form.'
			},
			{
				question: 'Is this game the same for every dialect?',
				answer:
					'Yes. Egyptian, Levantine, Moroccan Darija and Modern Standard Arabic all use the same alphabet, so there’s no dialect to choose.'
			},
			{
				question: 'I don’t know any letters yet. Where should I start?',
				answer:
					'Go through the interactive alphabet first, which teaches each letter with its sound. Then come back here to practise recognising them quickly.'
			}
		]
	},
	{
		slug: 'dialect-match',
		feature: 'which-arabic-dialect-quiz',
		name: 'Dialect Match',
		heading: 'Which Arabic Dialect Is It? Egyptian, Levantine, Darija or Fusha',
		emoji: '🌍',
		tagline: 'Is it Egyptian, Levantine, Moroccan or Fusha? Read it or hear it, and guess.',
		skills: ['Dialects', 'Listening', 'Vocabulary'],
		levels: 'Beginner–Advanced',
		accent: '#6366f1',
		deep: '#4338ca',
		shot: {
			src: '/images/feature-pages/game-dialect-match.webp',
			w: 1648,
			h: 840,
			alt: 'A Dialect Match question: an Arabic word with its meaning, and buttons for Egyptian, Levantine, Darija and Fusha'
		},
		seo: {
			title: 'Which Arabic Dialect Is It? Dialect Quiz Game | Parallel Arabic',
			description:
				'Guess the dialect of an Arabic word, phrase or native recording: Egyptian, Levantine, Darija or Fusha. Then see all four side by side.'
		},
		intro:
			'The same thing is said four different ways. “What?” is إيه in Cairo, شو in Beirut, شنو in Casablanca and ماذا in Fusha. Read a word or hear a recording and say which dialect it is, or pick how one dialect says it. After every answer you see all four.',
		howToPlay: [
			'Press Start. A round is ten questions of three kinds, mixed.',
			'See a word or phrase and tap its dialect, or listen to a recording and do the same.',
			'Or get a meaning and a dialect, and pick that dialect’s way of saying it from four.',
			'After each answer, compare all four dialects and play the recordings.'
		],
		faqs: [
			{
				question: 'How different are the Arabic dialects?',
				answer:
					'Very, in everyday words. Egyptian, Levantine and Moroccan Darija share most of their grammar with Modern Standard Arabic but use different words for things people say all day: what, why, now, I want, good. Darija differs the most, mixing in Amazigh and French words.'
			},
			{
				question: 'Which dialect should I learn?',
				answer:
					'The one spoken by the people you want to talk to. Egyptian is the most widely understood thanks to films and TV, Levantine is spoken from Lebanon to Jordan, and Fusha is for reading, news and formal speech. This game shows you how much they overlap.'
			},
			{
				question: 'Where do the recordings come from?',
				answer:
					'Native recordings made for Parallel Arabic’s 3D Room Hunt game, in all four dialects. The rest of the questions are written words and phrases you read.'
			},
			{
				question: 'Do I need to know all four dialects to play?',
				answer:
					'No. It works best if you know one, because you learn the others by comparison. Even beginners pick up the giveaways quickly, like Darija’s دابا for “now”.'
			}
		]
	},
	{
		slug: 'fill-the-gap',
		feature: 'arabic-fill-in-the-blank-exercises',
		name: 'Fill the Gap',
		heading: 'Arabic Fill in the Blank: Sentence Practice',
		emoji: '✏️',
		tagline: 'One word is missing from each Arabic sentence. Pick the one that fits.',
		skills: ['Vocabulary', 'Reading', 'Grammar'],
		levels: 'Beginner–Advanced',
		accent: '#f97316',
		deep: '#c2410c',
		shot: {
			src: '/images/feature-pages/game-fill-the-gap.webp',
			w: 1648,
			h: 708,
			alt: 'A Fill the Gap question: an Arabic sentence with one word missing and four words to choose from'
		},
		seo: {
			title: 'Fill the Gap - Arabic Sentence Game | Parallel Arabic',
			description:
				'Pick the missing word in everyday Arabic sentences, then see why it fits. Fresh sentences at your level in Egyptian, Levantine, Darija and Fusha.'
		},
		intro:
			'Everyday Arabic sentences with one word missing. Read the sentence and its meaning, then pick the word that fits from four. Only one makes sense: the others are the wrong food, the wrong time or the wrong kind of word. Signed in, you can have the sentences built around words you’ve saved.',
		howToPlay: [
			'Pick a dialect and a level. Signed in, choose Any words or My saved words.',
			'Start a round of ten sentences. Read the Arabic, with the English underneath.',
			'Tap the word that fills the gap. The answer, transliteration and a short explanation appear.',
			'At the end, go back over the sentences you missed.'
		],
		faqs: [
			{
				question: 'Why fill in the blank instead of just reading?',
				answer:
					'Because it makes you use the words around the gap. To pick the right word you have to understand the rest of the sentence, which is reading for meaning, and you see each new word in context instead of on its own.'
			},
			{
				question: 'What does “My saved words” do?',
				answer:
					'It builds the round around words you have saved while reading or playing, so you meet them again in new sentences. It works best once you have saved ten or more words in that dialect.'
			},
			{
				question: 'Are the sentences different every time?',
				answer:
					'Yes. Every round is a fresh set of ten in your dialect and at your level, and you can play any sentence aloud once you’ve answered.'
			}
		]
	},
	{
		slug: 'shadowing',
		feature: 'arabic-shadowing-practice',
		name: 'Shadowing',
		heading: 'Arabic Shadowing: Listen, Repeat, Get a Score',
		emoji: '🎙️',
		tagline: 'Hear a native speaker, say it the same way, and see how close you got.',
		skills: ['Speaking', 'Listening', 'Pronunciation'],
		levels: 'Beginner–Intermediate',
		accent: '#d946ef',
		deep: '#a21caf',
		shot: {
			src: '/images/feature-pages/game-shadowing.webp',
			w: 1648,
			h: 880,
			alt: 'A Shadowing line: an Arabic sentence with transliteration and meaning, a Listen button, a Say it button and a score out of 100'
		},
		seo: {
			title: 'Arabic Shadowing Game - Repeat and Get a Score | Parallel Arabic',
			description:
				'Shadow native Arabic speakers: listen to a real line, repeat it out loud and get a score out of 100. Egyptian, Levantine, Darija and Fusha.'
		},
		intro:
			'Shadowing is the simplest speaking drill there is: listen to a native speaker and say exactly what they said, the way they said it. Every line here is a recorded phrase people actually use, from ordering in a café to asking a taxi driver to stop. Say it, and see a score out of 100.',
		howToPlay: [
			'Pick a dialect and a level, then press Start. Easy lines are a few words; Medium lines are whole sentences; Hard is the same sentences by ear, with the words hidden until you try.',
			'Listen to the line as often as you like, reading the Arabic, transliteration and meaning.',
			'Press Say it, repeat the line, and tap again to stop. You get a score and what we heard.',
			'Try again to beat your score, or move on. At the end, see every line with your best score.'
		],
		faqs: [
			{
				question: 'What is shadowing?',
				answer:
					'A way to practise speaking by imitating native audio straight after hearing it: same words, same rhythm, same melody. It trains your mouth and your ear together and builds the confidence to say whole phrases rather than one word at a time.'
			},
			{
				question: 'How is my pronunciation scored?',
				answer:
					'Your recording is transcribed and compared with the line you were repeating. Getting every word, in order, scores near 100. It checks the words you say, so a clear attempt with the right words scores well even with an accent.'
			},
			{
				question: 'Where do the lines come from?',
				answer:
					'They are recorded lines from the Scenarios conversations and the Room Hunt game: what a waiter, a taxi driver or a pharmacist says, and what you say back. Each one is short enough to repeat after a single listen.'
			},
			{
				question: 'Do I need a microphone?',
				answer:
					'Yes, a phone or laptop mic is fine. Without one, or once the free speaking practice runs out, you can still listen and repeat along without a score.'
			}
		]
	},
	{
		slug: 'verb-blitz',
		feature: 'arabic-verb-drills',
		name: 'Verb Blitz',
		heading: 'Arabic Verb Conjugation Game',
		emoji: '🔁',
		tagline: 'A verb, a person and a tense: pick the right form, in your dialect.',
		skills: ['Grammar', 'Verbs'],
		levels: 'Beginner–Intermediate',
		accent: '#0ea5e9',
		deep: '#0369a1',
		shot: {
			src: '/images/feature-pages/game-verb-blitz.webp',
			w: 1648,
			h: 844,
			alt: 'A Verb Blitz question: the verb عاش with the pronoun هي and Past, and four conjugated forms to choose from'
		},
		seo: {
			title: 'Arabic Verb Conjugation Game | Parallel Arabic',
			description:
				'Pick the right form of an Arabic verb for each person and tense, affirmative and negative. 72 verbs in Egyptian, Levantine, Darija and Fusha.'
		},
		intro:
			'Arabic verbs change for every person and tense: عاش is “he lived”, عاشت “she lived”, بيعيش “he lives”. Each question gives you a verb, a person and a tense, and you pick the right form from four. 72 everyday verbs, past, present and future, including the negative.',
		howToPlay: [
			'Pick a dialect and a tense, or Mixed, then press Start. A round is ten verbs.',
			'Read the verb, the person (أنا, هي, إحنا…) and the tense. Some questions are negative.',
			'Tap the form that fits. The wrong ones are the same verb for other people or tenses.',
			'The answer shows with its transliteration and meaning. At the end, go over the ones you missed.'
		],
		faqs: [
			{
				question: 'How are Arabic verbs conjugated?',
				answer:
					'By adding prefixes and endings to a stem. In the past tense the ending shows the person (fata7t, I opened; fata7it, she opened). In the present a prefix does it, plus a dialect marker: b- in Egyptian and Levantine, ka- in Darija.'
			},
			{
				question: 'Are the verbs the same in every dialect?',
				answer:
					'The patterns are close, the markers are not. The present is بيفتح in Cairo and Beirut and كيحل in Casablanca, the future is ه in Egyptian, رح in Levantine, غادي in Darija and سـ in Fusha. Each dialect has its own verb tables here.'
			},
			{
				question: 'Do I need to know the alphabet?',
				answer:
					'Yes. The forms are in Arabic script, with the transliteration shown once you answer. Fusha forms carry full vowel marks, because without them several people’s forms look identical.'
			},
			{
				question: 'Where can I see a verb’s full table?',
				answer:
					'The Egyptian verbs each have a conjugation page with every form, recorded. The other dialects’ tables are used in this game for now.'
			}
		]
	},
	{
		slug: 'daily-root',
		feature: 'arabic-root-words-daily-puzzle',
		name: 'Daily Root',
		heading: 'Daily Root: an Arabic Word Puzzle Like Wordle',
		emoji: '🌱',
		tagline: 'One Arabic root a day. Build the words that grow from it, in three tries each.',
		skills: ['Vocabulary', 'Roots', 'Spelling'],
		levels: 'Intermediate',
		accent: '#22c55e',
		deep: '#15803d',
		shot: {
			src: '/images/feature-pages/game-daily-root.webp',
			w: 1568,
			h: 1504,
			alt: 'The Daily Root puzzle: the root ك ت ب, English clues, and a row of green and yellow letter tiles'
		},
		seo: {
			title: 'Daily Root - Arabic Wordle-Style Word Puzzle | Parallel Arabic',
			description:
				'A free daily Arabic word puzzle: one three-letter root, five English clues. Build each word from letter tiles in three tries, then share your result.'
		},
		intro:
			'Most Arabic words grow from a root of three letters. ك ت ب is to do with writing, and from it come كاتب (writer), كتاب (book) and مكتب (office). Each day brings a new root and clues in English. Build each word from letter tiles. After a try, green means right letter, right place; yellow means right letter, wrong place.',
		howToPlay: [
			'Read today’s root and the first clue. The clue tells you the meaning and how many letters the word has.',
			'Tap letter tiles to spell the word. Two of the tiles are decoys.',
			'Press Check. Green letters are in the right place, yellow ones belong somewhere else. You get three tries per word.',
			'Finish all the clues and share your squares. A new root comes out every day at midnight UTC.'
		],
		faqs: [
			{
				question: 'How do Arabic roots work?',
				answer:
					'A set of usually three consonants that carries a core meaning. Arabic builds words by putting those letters into patterns: ma-…-a for a place (مدرسة, a school, from د ر س), …-a-…-i-… for a doer (كاتب, a writer, from ك ت ب). Learn the patterns and one root opens up a family of words.'
			},
			{
				question: 'Is it the same puzzle for everyone?',
				answer:
					'Yes. Everyone gets the same root on the same day, which is what makes the share squares worth comparing.'
			},
			{
				question: 'Which kind of Arabic is it in?',
				answer:
					'Modern Standard Arabic. Roots are shared by every dialect, so the same families turn up in Egyptian, Levantine and Darija too.'
			},
			{
				question: 'Do I need to type in Arabic?',
				answer:
					'No. You build each word by tapping letter tiles, so there is no keyboard to fight with.'
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
