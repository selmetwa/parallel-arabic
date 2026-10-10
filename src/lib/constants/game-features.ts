/**
 * A /features landing page for each game, next to its /learn/game page.
 *
 * The two pages aim at different searches: the game page at the game
 * ("Arabic memory game"), this page at what it teaches ("learn Arabic
 * vocabulary with memory cards"). Each links to the other. Plain data, like
 * features.ts, which lists these under the "Games" group.
 */
import type { FeatureInfo, FeatureShot } from './features';

const shot = (name: string, w: number, h: number, alt: string): FeatureShot => ({
	src: `/images/feature-pages/${name}.webp`,
	w,
	h,
	alt
});

type GameFeature = Omit<FeatureInfo, 'group'>;

const PAGES: GameFeature[] = [
	{
		slug: 'which-arabic-dialect-quiz',
		name: 'Dialect Match',
		emoji: '🌍',
		heading: 'Learn to tell the Arabic dialects apart',
		lede: 'Egyptian, Levantine, Moroccan Darija and Modern Standard Arabic say everyday things differently. Read or hear a word, guess the dialect, and see all four side by side after every answer.',
		blurb: 'Guess the dialect from a word or a recording.',
		seo: {
			title: 'Tell the Arabic Dialects Apart | Parallel Arabic',
			description:
				'Learn how Egyptian, Levantine, Moroccan Darija and Fusha differ by guessing the dialect of everyday words and native recordings, then comparing all four.'
		},
		hero: shot(
			'game-dialect-match',
			1648,
			840,
			'A Dialect Match question: an Arabic word and its meaning, with buttons for Egyptian, Levantine, Darija and Fusha'
		),
		sections: [
			{
				title: 'Every answer shows all four',
				body: 'Right or wrong, you see how each dialect says the same thing: أنا كويس in Cairo, أنا منيح in Beirut, لاباس in Casablanca and أنا بخير in Fusha. Recorded words have a play button for each.',
				shot: shot(
					'dialect-match-reveal',
					1648,
					1532,
					'After an answer: "I\'m fine" in Egyptian, Levantine, Darija and Fusha, one row each with transliteration'
				)
			},
			{
				title: 'Read it, hear it, or find it',
				body: 'Three kinds of question: see a word and name its dialect, listen to a native recording and do the same, or get a meaning and a dialect and pick the right form from four.'
			},
			{
				title: 'Only fair questions',
				body: 'Where two dialects write a word the same way, it is never asked about. Every question has one answer you can defend.'
			}
		],
		app: { href: '/learn/game/dialect-match', label: 'Play Dialect Match' },
		faqs: [
			{
				question: 'Can Egyptians and Moroccans understand each other?',
				answer:
					'Mostly, with effort. Egyptian is understood almost everywhere thanks to film and TV, but Darija is hard for other Arabs to follow because of its different vocabulary and faster, vowel-light speech. Fusha is the shared ground.'
			},
			{
				question: 'Is this useful if I only learn one dialect?',
				answer:
					'Yes. You will meet speakers of other dialects, and knowing the common swaps (shu for eh, hallaq for dilwa2ti) stops them from catching you out.'
			},
			{
				question: 'How many words are in the game?',
				answer:
					'Over seventy, from everyday words that differ by dialect, household words with recordings, and common phrases written for all four dialects.'
			}
		]
	},
	{
		slug: 'arabic-memory-game-vocabulary',
		name: 'Memory Pairs',
		emoji: '🃏',
		heading: 'Learn Arabic vocabulary with memory cards',
		lede: 'Turn over cards and match each Arabic word to its meaning, or to its recording. Six pairs a board, by theme and dialect, and every word comes back several times in a few minutes.',
		blurb: 'Match Arabic words to meanings or sounds on a card board.',
		seo: {
			title: 'Learn Arabic Vocabulary with Memory Cards | Parallel Arabic',
			description:
				'A memory card game for Arabic vocabulary: match words to their English meaning or their native recording, by theme, in Egyptian, Levantine, Darija or Fusha.'
		},
		hero: shot(
			'game-memory-pairs',
			1648,
			1082,
			'A Memory Pairs board with two cards turned over: an Arabic word and an English meaning'
		),
		sections: [
			{
				title: 'Recall, not recognition',
				body: 'To find a pair you have to read an Arabic word and remember what it means before you see the answer. That small act of recall, repeated a dozen times a board, is what moves a word into memory.'
			},
			{
				title: 'Match by sound',
				body: 'Switch to Sound and half the cards play a recording instead of showing English. You match what you hear to the written word, training your ear and your reading at once.'
			},
			{
				title: 'Words by theme',
				body: 'Food, animals, the body, the house and more, in the dialect you choose. Each new board leans towards words you haven’t just seen.'
			}
		],
		app: { href: '/learn/game/memory-pairs', label: 'Play Memory Pairs' },
		faqs: [
			{
				question: 'Is a memory game good for learning a language?',
				answer:
					'For vocabulary, yes. It makes you retrieve meanings again and again in a short time, which is what spaced practice does at a slower pace. Pair it with reading so you also see the words in sentences.'
			},
			{
				question: 'Can I save the words I meet?',
				answer:
					'Yes. At the end of a board every word is listed with its audio, and signed-in players can save any of them to review later.'
			},
			{
				question: 'Does it work on a phone?',
				answer: 'Yes. The board is three cards wide on a phone and four on a larger screen.'
			}
		]
	},
	{
		slug: 'arabic-flashcards-speed-practice',
		name: 'Speed Round',
		emoji: '⚡',
		heading: 'Fast Arabic flashcard practice: 60 seconds against the clock',
		lede: 'An Arabic word and an English meaning: right or wrong? Answer as many as you can in a minute. Streaks double and triple your points, and you see every word you missed at the end.',
		blurb: 'Right or wrong, as fast as you can, for one minute.',
		seo: {
			title: 'Arabic Flashcards Against the Clock | Parallel Arabic',
			description:
				'Timed Arabic vocabulary practice: does the word match the meaning? As many as you can in 60 seconds, with streak bonuses. Four dialects.'
		},
		hero: shot(
			'game-speed-round',
			1648,
			806,
			'A Speed Round question: an Arabic word beside an English meaning, with Right and Wrong buttons and the clock running'
		),
		sections: [
			{
				title: 'Know it fast, not just know it',
				body: 'In a real conversation you have a second to recognise a word. A timed round shows which words you know instantly and which still need a moment, and pushes the slow ones faster.'
			},
			{
				title: 'Streaks pay more than guesses',
				body: 'A right answer is a point, two from five in a row, three from ten. A wrong one costs nothing but resets the streak, so careful beats quick-and-lucky.'
			},
			{
				title: 'Your best, per theme',
				body: 'Your best score is kept on your device for each dialect and theme, so there is always a number to beat.'
			}
		],
		app: { href: '/learn/game/speed-round', label: 'Start the clock' },
		faqs: [
			{
				question: 'Can I use a keyboard?',
				answer: 'Yes: → or Y for right, ← or N for wrong. Your hands never leave the keys.'
			},
			{
				question: 'How are the wrong pairs chosen?',
				answer:
					'A wrong pair shows the meaning of another word from the same theme, so you can’t rule it out just because it is about something else entirely.'
			},
			{
				question: 'Is it good for beginners?',
				answer:
					'Once you know a theme’s words a little, yes. Start with the theme you have studied most, and use Memory Pairs first for brand-new words.'
			}
		]
	},
	{
		slug: 'arabic-letter-forms-practice',
		name: 'Letter Hunt',
		emoji: '🔡',
		heading: 'Practise Arabic letter forms: beginning, middle and end',
		lede: 'Most Arabic letters change shape with their place in a word. Drill every form until you recognise it on sight: name a letter from its middle form, pick how it starts a word, or find it by its sound.',
		blurb: 'Recognise every letter in every position, and by sound.',
		seo: {
			title: 'Arabic Letter Forms: Initial, Medial, Final | Parallel Arabic',
			description:
				'Practise the initial, medial and final forms of all 28 Arabic letters, plus their sounds. Short rounds with look-alike letters as the wrong answers.'
		},
		hero: shot(
			'game-letter-hunt',
			1648,
			690,
			'A Letter Hunt question: an Arabic letter in one of its joined forms, with four letters to choose from'
		),
		sections: [
			{
				title: 'The look-alikes are the point',
				body: 'The wrong answers are letters with the same body and different dots: ب, ت, ث, ن and ي, or ج, ح and خ. Telling them apart quickly is what makes reading feel easy.',
				shot: shot(
					'letter-hunt-reveal',
					1648,
					966,
					'After an answer: the letter’s standalone, initial, medial and final forms side by side'
				)
			},
			{
				title: 'Shapes and sounds',
				body: 'Some questions show a form, some ask for one, and some play a letter’s sound for you to find. After every answer you see all of the letter’s forms.'
			},
			{
				title: 'The same in every dialect',
				body: 'All the dialects and Fusha share one alphabet, so there is nothing to choose: press Start and play.'
			}
		],
		app: { href: '/learn/game/letter-hunt', label: 'Start Letter Hunt' },
		faqs: [
			{
				question: 'How long does it take to learn the Arabic letter forms?',
				answer:
					'A few days of short practice for most learners. The shapes follow a pattern: most letters lose their tail at the start and in the middle of a word, and six never join to the next letter.'
			},
			{
				question: 'Which letters don’t connect?',
				answer:
					'ا, د, ذ, ر, ز and و. They join to the letter before them but not the one after, so they only have a standalone and an end form.'
			},
			{
				question: 'Should I learn the alphabet first?',
				answer:
					'Meet the letters first in the interactive alphabet, which teaches each one with its sound. Letter Hunt is the practice that makes them stick.'
			}
		]
	},
	{
		slug: 'arabic-listening-spelling-practice',
		name: 'Listen & Spell',
		emoji: '👂',
		heading: 'Arabic listening practice: hear a word, pick its spelling',
		lede: 'Hear a native speaker say a word and choose how it is spelled. One wrong answer is always the same word with a sound-alike letter swapped, س for ص or ك for ق, so you learn to hear the difference.',
		blurb: 'Hear a word, choose the spelling. No typing.',
		seo: {
			title: 'Arabic Listening and Spelling Practice | Parallel Arabic',
			description:
				'Train your ear for the Arabic letters that sound alike: hear a native recording and pick the right spelling. No keyboard needed. Four dialects.'
		},
		hero: shot(
			'game-listen-and-spell',
			1648,
			760,
			'A Listen & Spell question: a play button and four Arabic spellings to choose from'
		),
		sections: [
			{
				title: 'The letters that trip people up',
				body: 'س and ص, ت and ط, د and ض, ك and ق, ح and ه. The near-miss spelling in each question swaps one of these, so every right answer is your ear doing the work.',
				shot: shot(
					'listen-and-spell-reveal',
					1648,
					1112,
					'After an answer: the word with its transliteration and meaning'
				)
			},
			{
				title: 'No keyboard',
				body: 'You listen and tap. The game is about hearing sounds and connecting them to letters, not about finding keys on an Arabic layout.'
			},
			{
				title: 'Real recordings',
				body: 'Every word is a recording, and themes without enough recorded words are left out, so you never get a synthetic voice.'
			}
		],
		app: { href: '/learn/game/listen-and-spell', label: 'Play Listen & Spell' },
		faqs: [
			{
				question: 'Why can’t I hear the difference between س and ص?',
				answer:
					'English has no "heavy" consonants, so at first ص sounds like a plain s. It is said with the back of the tongue raised, which darkens the vowels around it. Listening for the vowels is the trick, and it gets easier quickly.'
			},
			{
				question: 'Is the spelling the same in every dialect?',
				answer:
					'The letters are, but the words differ. Each dialect has its own recordings and vocabulary here.'
			},
			{
				question: 'What level is it for?',
				answer: 'Anyone who can read the Arabic letters. The words are everyday vocabulary by theme.'
			}
		]
	},
	{
		// The conjugation tables have their own page (arabic-verb-conjugation-practice);
		// this one is about drilling the forms.
		slug: 'arabic-verb-drills',
		name: 'Verb Blitz',
		emoji: '🔁',
		heading: 'Arabic verb drills: every person, every tense',
		lede: 'Pick the right form of an everyday verb for a person and a tense, affirmative or negative. 72 verbs with full tables in Egyptian, Levantine, Moroccan Darija and Modern Standard Arabic.',
		blurb: '72 verbs, every person and tense, in four dialects.',
		seo: {
			title: 'Arabic Verb Drills in Four Dialects | Parallel Arabic',
			description:
				'Drill 72 everyday Arabic verbs for every person in the past, present and future, negative included. Egyptian, Levantine, Darija and Fusha.'
		},
		hero: shot(
			'game-verb-blitz',
			1648,
			844,
			'A Verb Blitz question: a verb, a pronoun and a tense, with four conjugated forms to choose from'
		),
		sections: [
			{
				title: 'One verb, every person',
				body: 'Each question names a verb, a person (أنا, هي, إحنا…) and a tense. The wrong answers are the same verb for other people or tenses, so you learn the endings and prefixes, not the meanings.',
				shot: shot(
					'verb-blitz-reveal',
					1648,
					1150,
					'After an answer in Levantine: the right future form highlighted, with its meaning'
				)
			},
			{
				title: 'Each dialect’s own markers',
				body: 'The present is بيفتح in Cairo and Beirut and كيحل in Casablanca. The future is ه in Egyptian, رح in Levantine, غادي in Darija and سـ in Fusha. Every dialect has its own tables, not Fusha with an accent.'
			},
			{
				title: 'Negatives too',
				body: 'About a third of the questions are negative: ما…ش in Egyptian and Darija, ما in Levantine, and ما, لا or لن in Fusha depending on the tense.'
			}
		],
		app: { href: '/learn/game/verb-blitz', label: 'Play Verb Blitz' },
		faqs: [
			{
				question: 'Are Arabic verbs hard to conjugate?',
				answer:
					'Less than they look. Each tense uses one set of prefixes and endings for almost every verb, so after a handful of verbs the pattern carries you. The irregulars, like "to come", are the ones to learn by heart.'
			},
			{
				question: 'Which verbs are included?',
				answer:
					'72 everyday verbs, from to be, to go and to come to to apologise for, to compare and to punish, each with past, present and future in the affirmative and negative.'
			},
			{
				question: 'Why does Fusha have vowel marks and the dialects don’t?',
				answer:
					'In Fusha, "I opened", "you opened" and "she opened" are all written فتحت without them. The marks keep the forms apart. Dialect forms differ in their letters, so they are written the way people text.'
			}
		]
	},
	{
		slug: 'arabic-fill-in-the-blank-exercises',
		name: 'Fill the Gap',
		emoji: '✏️',
		heading: 'Arabic fill-in-the-blank exercises at your level',
		lede: 'Everyday sentences with one word missing. Read the sentence and its meaning, pick the word that fits from four, and see why. Fresh sentences every round, and you can build them around words you have saved.',
		blurb: 'Pick the missing word in everyday sentences.',
		seo: {
			title: 'Arabic Fill in the Blank Exercises | Parallel Arabic',
			description:
				'Practise Arabic vocabulary in context with fill-in-the-blank sentences at your level, built fresh each round or around your saved words. Four dialects.'
		},
		hero: shot(
			'game-fill-the-gap',
			1648,
			708,
			'A Fill the Gap question: an Arabic sentence with a blank, its English meaning, and four words to choose from'
		),
		sections: [
			{
				title: 'Words in context',
				body: 'To fill a gap you have to understand the words around it. Every right answer is reading for meaning, and every new word arrives inside a sentence you can reuse.',
				shot: shot(
					'fill-the-gap-reveal',
					1648,
					1086,
					'After an answer: the completed sentence with transliteration and a one-line explanation'
				)
			},
			{
				title: 'Your saved words, in new sentences',
				body: 'Signed in, choose My saved words and the round is written around words you have saved while reading or playing, so you meet them again somewhere new.'
			},
			{
				title: 'Your level',
				body: 'Beginner rounds use short everyday sentences; advanced ones use longer sentences and less common words.'
			}
		],
		app: { href: '/learn/game/fill-the-gap', label: 'Play Fill the Gap' },
		faqs: [
			{
				question: 'Are fill-in-the-blank exercises good for learning Arabic?',
				answer:
					'They are one of the best ways to practise vocabulary, because you meet each word with the words it is used with. That makes it easier to use the word yourself.'
			},
			{
				question: 'Could more than one answer fit?',
				answer:
					'The English meaning settles it: only one choice makes the sentence mean what the English says. If you think two fit, the explanation says why one doesn’t.'
			},
			{
				question: 'Can I hear the sentences?',
				answer: 'Premium members can play every sentence aloud in their dialect once it is answered.'
			}
		]
	},
	{
		slug: 'arabic-shadowing-practice',
		name: 'Shadowing',
		emoji: '🎙️',
		heading: 'Arabic shadowing practice with native recordings',
		lede: 'Listen to a native speaker, repeat the line straight after, and get a score out of 100. Short, real phrases from cafés, taxis, pharmacies and markets, in your dialect.',
		blurb: 'Hear a native line, repeat it, get a score.',
		seo: {
			title: 'Arabic Shadowing Practice with Native Audio | Parallel Arabic',
			description:
				'The shadowing technique for Arabic: listen to native recordings of everyday phrases, repeat them out loud, and get a pronunciation score. Four dialects.'
		},
		hero: shot(
			'game-shadowing',
			1648,
			880,
			'A Shadowing line: an Arabic phrase with transliteration and meaning, a Listen button and a Say it button'
		),
		sections: [
			{
				title: 'What shadowing is',
				body: 'You copy a native speaker as closely as you can: the words, the rhythm, the melody. It is the fastest way to stop translating in your head and start saying whole phrases.'
			},
			{
				title: 'A score you can beat',
				body: 'Your recording is transcribed and compared with the line. Try again as often as you like; the best score for each line is kept for the round.'
			},
			{
				title: 'Lines people actually say',
				body: 'Every line comes from the Scenarios conversations and Room Hunt: what a waiter, a driver or a doctor says, and what you say back.'
			}
		],
		app: { href: '/learn/game/shadowing', label: 'Start shadowing' },
		faqs: [
			{
				question: 'Does shadowing improve your accent?',
				answer:
					'It improves rhythm and fluency first, and the accent follows. Copying whole phrases teaches you where the stress falls and how words run together, which single-word practice can’t.'
			},
			{
				question: 'How long should I shadow each day?',
				answer: 'Ten minutes is plenty. A round is six lines, and repeating a line a few times is part of the method.'
			},
			{
				question: 'What if I don’t have a microphone?',
				answer:
					'You can still listen and repeat along, which is shadowing too. The score needs a mic, and the free speaking practice is limited.'
			}
		]
	},
	{
		slug: 'arabic-root-words-daily-puzzle',
		name: 'Daily Root',
		emoji: '🌱',
		heading: 'A daily puzzle for Arabic root words',
		lede: 'Arabic builds families of words from three-letter roots. Each day brings one root and five clues: build each word from letter tiles, Wordle style, and share your result.',
		blurb: 'One root a day: build the words that grow from it.',
		seo: {
			title: 'Arabic Root Words: A Daily Puzzle | Parallel Arabic',
			description:
				'Learn how Arabic root words work with a free daily puzzle: one three-letter root, five words to build from tiles, Wordle-style hints, and a result to share.'
		},
		hero: shot(
			'game-daily-root',
			1568,
			1504,
			'The Daily Root puzzle: the root ك ت ب, five English clues, and a first try marked in green and grey'
		),
		sections: [
			{
				title: 'One root, a family of words',
				body: 'ك ت ب is to do with writing: كاتب (writer), كتاب (book), مكتب (office), مكتبة (library). Learn the root and the patterns, and you can guess new words before you look them up.'
			},
			{
				title: 'Wordle-style hints',
				body: 'After each try, green means right letter in the right place and yellow means the letter belongs somewhere else. Three tries per word.'
			},
			{
				title: 'Same puzzle for everyone',
				body: 'A new root every day at midnight UTC, the same for every player, so your squares are worth comparing.'
			}
		],
		app: { href: '/learn/game/daily-root', label: 'Play today’s root' },
		faqs: [
			{
				question: 'What are Arabic root words?',
				answer:
					'Most Arabic words come from a root of three consonants that carries a core meaning. Patterns of vowels and extra letters turn the root into specific words: a doer, a place, a thing, an action.'
			},
			{
				question: 'Do roots work in the dialects too?',
				answer:
					'Yes. The puzzle uses Modern Standard Arabic, but the same roots run through Egyptian, Levantine and Darija, often with the same patterns.'
			},
			{
				question: 'Is Daily Root free?',
				answer: 'Yes, for everyone, every day. Signed-in players also earn XP for each word.'
			}
		]
	},
	{
		slug: 'arabic-spelling-practice',
		name: 'Word Scramble',
		emoji: '🔤',
		heading: 'Arabic spelling practice: put the letters in order',
		lede: 'See a meaning, hear the word, and rebuild it from scrambled letters. The letters join up as you place them, which is how you learn what Arabic words look like.',
		blurb: 'Rebuild Arabic words from scrambled letters.',
		seo: {
			title: 'Arabic Spelling Practice with Letter Tiles | Parallel Arabic',
			description:
				'Practise Arabic spelling by rebuilding words from scrambled letters and watching them join up. Everyday vocabulary by theme in four dialects.'
		},
		hero: shot(
			'game-word-scramble',
			1568,
			894,
			'A Word Scramble round: an English meaning and the scrambled Arabic letters to place'
		),
		sections: [
			{
				title: 'Watch the letters join',
				body: 'Each letter you place joins onto the last, the way it would in handwriting. Building words yourself is the quickest way to learn how the joined forms fit together.'
			},
			{
				title: 'Hints that teach',
				body: 'Stuck? A hint keeps the right start of the word and places the next letter, so you see where you went wrong.'
			}
		],
		app: { href: '/learn/game/word-scramble', label: 'Play Word Scramble' },
		faqs: [
			{
				question: 'How do I learn to spell in Arabic?',
				answer:
					'Arabic spelling is mostly regular: once you know the letters, words are written as they sound, apart from the short vowels, which are usually left out. Rebuilding words teaches you which letters carry the long vowels.'
			},
			{
				question: 'Can I type instead of tapping?',
				answer: 'Yes, on an Arabic keyboard. Typing ا can place أ or إ, so you don’t need every variant.'
			}
		]
	},
	{
		slug: 'arabic-vocabulary-puzzles',
		name: 'Odd One Out',
		emoji: '🧠',
		heading: 'Arabic vocabulary puzzles: find the odd one out',
		lede: 'Four Arabic words, one doesn’t belong. Sometimes it is the meaning, sometimes the grammar: gender, number, word type or the root the words come from. Every answer explains the pattern.',
		blurb: 'Four words, one doesn’t fit. Learn why.',
		seo: {
			title: 'Arabic Vocabulary Puzzles: Odd One Out | Parallel Arabic',
			description:
				'Sharpen your Arabic vocabulary and grammar with odd-one-out puzzles by meaning, gender, number and root, each explained. Four dialects.'
		},
		hero: shot(
			'game-odd-one-out',
			1568,
			708,
			'An Odd One Out puzzle: four Arabic words with transliteration'
		),
		sections: [
			{
				title: 'Patterns, not just meanings',
				body: 'Some puzzles are three fruits and a chair. Others hide a feminine noun among masculine ones, a verb among nouns, or a word from a different root. You start noticing the patterns everywhere.',
				shot: shot(
					'odd-one-out-reveal',
					1648,
					1088,
					'After an answer: every word’s meaning, and a line explaining the pattern'
				)
			},
			{
				title: 'Gets harder as you go',
				body: 'A round is ten puzzles at your level, ordered from easy to hard.'
			}
		],
		app: { href: '/learn/game/odd-one-out', label: 'Play Odd One Out' },
		faqs: [
			{
				question: 'What makes these puzzles good for vocabulary?',
				answer:
					'You have to think about what each word means and how it behaves, not just recognise it. That deeper processing is what makes words stick.'
			},
			{
				question: 'What level are they?',
				answer: 'Beginner to advanced; you choose the level before each round.'
			}
		]
	},
	{
		slug: 'arabic-grammar-practice',
		name: 'Spot the Mistake',
		emoji: '🔍',
		heading: 'Arabic grammar practice: find and fix the mistake',
		lede: 'Each sentence has one wrong word: an adjective in the wrong gender, a verb that doesn’t match its subject, a plural that should be singular. Find it, then read the corrected sentence and the rule.',
		blurb: 'One wrong word per sentence. Find it and learn the rule.',
		seo: {
			title: 'Arabic Grammar Practice: Find the Mistake | Parallel Arabic',
			description:
				'Practise Arabic grammar by spotting agreement mistakes in everyday sentences: gender, verb person, number and pronoun endings. Fresh sentences in four dialects.'
		},
		hero: shot(
			'game-spot-the-mistake',
			1568,
			520,
			'A Spot the Mistake round: an Arabic sentence with its English meaning and one wrong word to find'
		),
		sections: [
			{
				title: 'Mistakes you can prove',
				body: 'Every mistake clashes with another word in the same sentence, so you can always point to why it is wrong: the noun it should agree with is right there.'
			},
			{
				title: 'The mistakes learners make',
				body: 'Gender agreement, verb endings, singular and plural, and possessive endings: the four things that most often give a learner away.'
			}
		],
		app: { href: '/learn/game/spot-the-mistake', label: 'Play Spot the Mistake' },
		faqs: [
			{
				question: 'Is Arabic grammar the same in every dialect?',
				answer:
					'The agreement rules are close, but verb prefixes, negation and demonstratives differ. The sentences and corrections follow the dialect you pick.'
			},
			{
				question: 'Do I need to know grammar terms?',
				answer: 'No. The explanations point to the words that clash, in plain English.'
			}
		]
	},
	{
		slug: 'arabic-sentence-building-practice',
		name: 'Sentence Scramble',
		emoji: '🧩',
		heading: 'Arabic sentence building: put the words in order',
		lede: 'See what a sentence means, then tap its scrambled Arabic words into the right order. A short, hands-on way to learn how sentences in your dialect are put together.',
		blurb: 'Rebuild Arabic sentences from scrambled words.',
		seo: {
			title: 'Arabic Sentence Building Practice | Parallel Arabic',
			description:
				'Learn Arabic word order by rebuilding everyday sentences from scrambled words, with audio and transliteration. Fresh sentences at your level in four dialects.'
		},
		hero: shot(
			'game-sentence-scramble',
			1568,
			810,
			'A Sentence Scramble round: an English sentence and the Arabic words to tap into order'
		),
		sections: [
			{
				title: 'Word order you can feel',
				body: 'Where does the adjective go? What comes after the verb? Building sentences yourself answers those questions faster than reading a rule.'
			},
			{
				title: 'Hear the finished sentence',
				body: 'Once a sentence is solved you can play it aloud in your dialect and read its transliteration.'
			}
		],
		app: { href: '/learn/game/sentence-scramble', label: 'Play Sentence Scramble' },
		faqs: [
			{
				question: 'Isn’t Arabic word order free?',
				answer:
					'It is flexible, but not free. The sentences here are chosen to have one natural order, so the answer is never a matter of taste.'
			},
			{
				question: 'How long are the sentences?',
				answer: 'Three to six words at beginner level, up to ten at advanced.'
			}
		]
	},
	{
		slug: 'arabic-vocabulary-quiz',
		name: 'Vocabulary Quiz',
		emoji: '📝',
		heading: 'An Arabic vocabulary quiz you can read, hear or speak',
		lede: 'A quiz built fresh each time, in your dialect and at your level. Answer by reading, by listening, or by saying the answer out loud, with single words or whole sentences.',
		blurb: 'Read, listen or speak your answers.',
		seo: {
			title: 'Arabic Vocabulary Quiz: Read, Listen, Speak | Parallel Arabic',
			description:
				'Test your Arabic vocabulary with quizzes built for your dialect and level: multiple choice, listening or speaking, single words or sentences.'
		},
		hero: shot(
			'game-quiz',
			1456,
			1490,
			'A Vocabulary Quiz question: fill in the blank in an Arabic sentence from four choices'
		),
		sections: [
			{
				title: 'Three ways to answer',
				body: 'Multiple choice for reading, listening rounds where you hear the word first, and speaking rounds where you say the answer out loud.'
			},
			{
				title: 'Built for your level',
				body: 'Pick a level from A1 to C2 and a topic, and the quiz is written for it, in your dialect.'
			}
		],
		app: { href: '/learn/game/quiz', label: 'Take a quiz' },
		faqs: [
			{
				question: 'How is this different from the other games?',
				answer:
					'The quiz mixes skills and levels in one place and can test you on whole sentences. The other games each drill one thing in depth.'
			},
			{
				question: 'Do missed words come back?',
				answer: 'Signed in, yes: the words you miss go into your review.'
			}
		]
	},
	{
		slug: 'arabic-role-play-practice',
		name: 'Scenarios',
		emoji: '🗣️',
		heading: 'Arabic role-play practice in everyday situations',
		lede: 'Nine short conversations in 3D: order at a café, see a doctor, check in at the airport, ask the way, take a taxi and more. Someone speaks to you in your dialect; you answer by tapping or by speaking, and what you ask for happens.',
		blurb: 'Nine everyday conversations in 3D, in your dialect.',
		seo: {
			title: 'Arabic Role-Play: Café, Doctor, Airport | Parallel Arabic',
			description:
				'Role-play everyday Arabic in 3D: a café, a doctor’s visit, airport check-in, asking the way, a taxi, a market. Four dialects.'
		},
		hero: shot(
			'game-scenarios',
			2560,
			1440,
			'A Scenarios conversation at a market stall, with replies to choose from'
		),
		sections: [
			{
				title: 'Order a coffee the way you like it',
				body: 'At the café the barista asks what you want, what size, sugar or not, and whether you’ll have a croissant. Whatever you order appears on the counter.',
				shot: shot(
					'scenario-cafe',
					2560,
					1440,
					'At the café: the barista asks "small or large?" in Egyptian Arabic, with your replies to choose from'
				)
			},
			{
				title: 'Explain what hurts',
				body: 'At the doctor’s you say what’s wrong and since when, answer questions about a fever, and leave with a prescription and advice.',
				shot: shot(
					'scenario-doctor',
					2560,
					1440,
					'At the doctor’s: the doctor asks how long you have had it, in Levantine Arabic'
				)
			},
			{
				title: 'Check in for a flight',
				body: 'Passport, destination, bags, a window or aisle seat, and the gate: the whole check-in, in Arabic.',
				shot: shot(
					'scenario-airport',
					2560,
					1440,
					'At the airport: the check-in agent asks where you are flying to, in Moroccan Darija'
				)
			},
			{
				title: 'Some answers don’t fit',
				body: 'Every turn has a reply or two that make no sense in the moment, like asking for the bill before you have ordered. Pick one and you’re asked again, so you have to understand the question.'
			}
		],
		app: { href: '/scenarios', label: 'Start a conversation' },
		faqs: [
			{
				question: 'Which situations are there?',
				answer:
					'A restaurant, a taxi, a fruit and vegetable market, a pharmacy, a hotel, a café, a doctor’s office, an airport check-in, and asking a stranger the way.'
			},
			{
				question: 'Can I speak my answers?',
				answer:
					'Yes. Every turn has replies to tap and a microphone to say one instead, and every line is recorded so you hear a native voice.'
			},
			{
				question: 'Is it the same conversation in every dialect?',
				answer:
					'The situations are, the words aren’t. Each line is written separately for Egyptian, Levantine, Moroccan Darija and Fusha.'
			}
		]
	}
];

export const GAME_FEATURES: FeatureInfo[] = PAGES.map((page) => ({ ...page, group: 'games' }));
