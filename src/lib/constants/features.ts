/**
 * The /features landing pages: one per feature, each with screenshots, copy,
 * SEO and FAQs.
 *
 * Plain data (no Svelte or $app imports) so seo.ts, the sitemap and tests can
 * read it. Screenshots live in static/images/feature-pages/ and are captured by
 * scripts/capture-feature-screenshots.ts (tutor-chat, speak-score and
 * sentences-trace are converted from the /about page's images instead).
 *
 * Each page targets a different search from the tool it links to: /tutor ranks
 * for "AI Arabic tutor", this page for "Arabic conversation practice". The
 * alphabet and Anki decks already have landing pages of their own, so they
 * appear in the grid (FEATURE_LINKS) but get no page here.
 */

import type { Pathname } from '$app/types';
import { GAMES, QUIZ_CARD } from './games';

export interface Faq {
	question: string;
	answer: string;
}

export interface FeatureShot {
	src: string;
	w: number;
	h: number;
	alt: string;
	/** A screen recording to play in place of the image (which becomes its poster). */
	video?: string;
}

export interface FeatureSection {
	title: string;
	body: string;
	shot?: FeatureShot;
}

export interface FeatureInfo {
	slug: string;
	/** Short name for cards and breadcrumbs. */
	name: string;
	emoji: string;
	/** The page's h1, worded for the search it should rank for. */
	heading: string;
	lede: string;
	/** One line for the feature grid. */
	blurb: string;
	seo: { title: string; description: string };
	hero: FeatureShot;
	sections: FeatureSection[];
	app: { href: Pathname; label: string };
	faqs: Faq[];
}

const shot = (name: string, w: number, h: number, alt: string, video?: string): FeatureShot => ({
	src: `/images/feature-pages/${name}.webp`,
	w,
	h,
	alt,
	...(video && { video: `/images/feature-pages/${video}.mp4` })
});

export const FEATURES: FeatureInfo[] = [
	{
		slug: 'arabic-conversation-practice',
		name: 'Conversation Practice',
		emoji: '💬',
		heading: 'Arabic conversation practice for everyday situations',
		lede: 'Speak Arabic out loud with a tutor that answers back in your dialect. Pick a situation, like ordering at a café or catching a taxi, and hold a real conversation with corrections as you go.',
		blurb: 'Hold spoken conversations in your dialect and get corrected as you go.',
		seo: {
			// /tutor ranks for "AI Arabic tutor"; this page stays off those words.
			title: 'Arabic Conversation Practice: Everyday Role-Plays | Parallel Arabic',
			description:
				'Practice speaking Arabic in everyday role-plays like ordering food or taking a taxi, in Egyptian, Levantine or MSA, with replies glossed and your grammar corrected.'
		},
		hero: shot(
			'tutor',
			2200,
			1520,
			'The tutor start screen with beginner scenarios such as Introducing Yourself, Ordering at a Café and Asking for Directions'
		),
		sections: [
			{
				title: 'Start from a situation, not a blank page',
				body: 'Beginner scenarios give the conversation a shape: introduce yourself, ask for directions, ask about prices, order at a restaurant. Or describe any situation you like, and the tutor teaches you the key words first, then practices it with you.'
			},
			{
				title: 'Every reply glossed word by word',
				body: 'The tutor answers in Arabic script with transliteration and English underneath, so you can follow along before you can read fluently. Switch the English off once you stop needing it.',
				shot: shot(
					'tutor-chat',
					2376,
					814,
					'A conversation with the tutor, with each Arabic word glossed in English and transliteration'
				)
			},
			{
				title: 'Corrections while you talk',
				body: 'Get a gender agreement or a verb form wrong and the tutor tells you, then carries on. You learn from the mistake without the conversation stopping for a grammar lecture.'
			}
		],
		app: { href: '/tutor', label: 'Start a conversation' },
		faqs: [
			{
				question: 'Which dialects can I practice with the tutor?',
				answer:
					'Egyptian Arabic, Levantine Arabic and Modern Standard Arabic. You can switch between them at the top of the conversation.'
			},
			{
				question: 'Can I practice a situation that is not in the list?',
				answer:
					'Yes. Describe what you want to talk about, like a doctor’s appointment or meeting your partner’s family, and the tutor teaches you the key words and sentences before you start.'
			},
			{
				question: 'I am a beginner. Is this too advanced for me?',
				answer:
					'No. The beginner scenarios use simple, everyday language, and every reply comes with transliteration and English so you are never lost.'
			},
			{
				question: 'Is conversation practice free?',
				answer:
					'The AI Tutor is part of Parallel Arabic Pro, which is $10 a month. You can create a free account and try the rest of the app first.'
			}
		]
	},
	{
		slug: 'arabic-reading-practice',
		name: 'Stories',
		emoji: '📖',
		heading: 'Arabic reading practice with graded stories',
		lede: 'Short stories written for your level and your dialect, with English and transliteration lined up under every sentence. Read along with the audio, and turn the helpers off as your reading gets stronger.',
		blurb: 'Graded stories in your dialect with translation and audio.',
		seo: {
			title: 'Arabic Reading Practice - Graded Stories with Translation | Parallel Arabic',
			description:
				'Improve your Arabic reading with short graded stories in Egyptian, Levantine, Moroccan Darija and Fusha. English and transliteration under every sentence, native-speed audio, and tap-to-translate on every word.'
		},
		hero: shot(
			'stories',
			2200,
			1640,
			'A story called At the Restaurant, with each sentence shown in Arabic, transliteration and English'
		),
		sections: [
			{
				title: 'Arabic, transliteration and English together',
				body: 'Each sentence shows all three, so a new word never leaves you stuck. Hide the English or the transliteration with one switch when you want to test yourself.'
			},
			{
				title: 'A library sorted by topic and level',
				body: 'Start with greetings, food, getting around or family, filter by dialect and CEFR level, or write your own story around the grammar and vocabulary you are working on.',
				shot: shot(
					'stories-library',
					2560,
					1800,
					'The story library with starter topics, a create-your-own option and stories filtered by dialect and level'
				)
			},
			{
				title: 'Listen while you read',
				body: 'Play the whole story or one sentence at a time. Hearing the words as you read them is how the spelling and the sound start to stick together.'
			}
		],
		app: { href: '/stories', label: 'Browse stories' },
		faqs: [
			{
				question: 'What level are the stories?',
				answer:
					'They are graded by CEFR level, starting at A1 for complete beginners. Filter the library by level to find ones that stretch you without losing you.'
			},
			{
				question: 'Which dialects are the stories in?',
				answer:
					'Egyptian Arabic, Levantine Arabic, Moroccan Darija and Modern Standard Arabic (Fusha).'
			},
			{
				question: 'Do I need to read Arabic script first?',
				answer:
					'No. Every sentence has transliteration, so you can start before you know the alphabet. Learning the letters alongside the stories makes both go faster.'
			},
			{
				question: 'Are the stories free?',
				answer:
					'Some are. Parallel Arabic Pro, at $10 a month, unlocks every story in every dialect and lets you create your own.'
			}
		]
	},
	{
		slug: 'tap-to-translate',
		name: 'Tap to Translate',
		emoji: '👆',
		heading: 'Tap any Arabic word to see what it means',
		lede: 'Stuck on a word? Tap it. You get its meaning in that sentence, how to say it, and how the other dialects say the same thing, and one more tap saves it for review.',
		blurb: 'Meaning in context, pronunciation and dialect forms for any word.',
		seo: {
			title: 'Tap to Translate Arabic Words in Context | Parallel Arabic',
			description:
				'Tap any word in an Arabic story to see what it means in that sentence, hear it, compare it across Egyptian, Levantine, Darija and Fusha, and save it to your spaced-repetition deck.'
		},
		hero: shot(
			'define',
			2200,
			1640,
			'The definition card for ترابيزة (table), with its transliteration, its definition and a note on what it means in the sentence'
		),
		sections: [
			{
				title: 'The meaning in this sentence, not every meaning',
				body: 'A dictionary gives you a list. The definition card explains what the word means right here, in the story you are reading, so you are not left guessing which sense applies.'
			},
			{
				title: 'Hear it and see it in the other dialects',
				body: 'Listen to the word, then compare it: ترابيزة in Egyptian is طاولة in Levantine, Darija and Fusha. You learn one word and pick up three more.',
				shot: shot(
					'compare-modal',
					2200,
					1800,
					'The dialect comparison for ترابيزة: Egyptian ترابيزة, and طاولة in Moroccan Darija, Levantine and Modern Standard Arabic'
				)
			},
			{
				title: 'Save it and it comes back',
				body: 'Tap Save and the word goes into your review deck. Spaced repetition brings it back just before you would forget it.'
			}
		],
		app: { href: '/stories', label: 'Try it in a story' },
		faqs: [
			{
				question: 'Can I look up a phrase, not just one word?',
				answer:
					'Yes. Drag across several words to select them, then define the whole phrase. That helps with expressions whose meaning is more than the sum of the words.'
			},
			{
				question: 'Does it work for every dialect?',
				answer:
					'Yes. Definitions and comparisons cover Egyptian, Levantine, Moroccan Darija and Modern Standard Arabic.'
			},
			{
				question: 'Where do saved words go?',
				answer:
					'Into your word bank, where you can see them all in one table and review them with spaced repetition.'
			}
		]
	},
	{
		slug: 'arabic-course',
		name: 'Structured Lessons',
		emoji: '🗺️',
		heading: 'A structured Arabic course from A1 to C2',
		lede: 'A step-by-step learning path in your dialect, from pronouns and numbers at A1 up to advanced conversation. Each lesson builds on the one before, and you always know what comes next.',
		blurb: 'A step-by-step learning path in your dialect, A1 to C2.',
		seo: {
			title: 'Online Arabic Course A1 to C2 - Egyptian, Levantine, Darija & Fusha | Parallel Arabic',
			description:
				'A structured Arabic course with a clear learning path. Step-by-step lessons from beginner to advanced in Egyptian Arabic, Levantine, Moroccan Darija or Modern Standard Arabic, at your own pace.'
		},
		hero: shot(
			'lessons',
			2048,
			1800,
			'The Egyptian Arabic learning path, with lessons on independent pronouns, demonstratives and numbers from 1 to 10'
		),
		sections: [
			{
				title: 'A path, not a pile of lessons',
				body: 'Lessons are laid out in order, level by level, so you never have to work out what to study next. The Egyptian path alone runs to 125 lessons.'
			},
			{
				title: 'Grammar and vocabulary together',
				body: 'Each lesson teaches a pattern and the words to use it with: pronouns, then demonstratives, then numbers, family, colours and days of the week.'
			},
			{
				title: 'Or build a lesson around your own words',
				body: 'Want a lesson on the vocabulary for your new job, or the words from last week’s stories? Create a custom lesson on any topic.'
			}
		],
		app: { href: '/lessons', label: 'Start a lesson' },
		faqs: [
			{
				question: 'Which dialects have a course?',
				answer:
					'Egyptian Arabic, Levantine Arabic, Moroccan Darija and Modern Standard Arabic each have their own learning path.'
			},
			{
				question: 'Is the course free?',
				answer:
					'You can start for free. Parallel Arabic Pro, at $10 a month, unlocks every lesson in every dialect.'
			}
		]
	},
	{
		slug: 'arabic-spaced-repetition',
		name: 'Spaced Repetition',
		emoji: '🧠',
		heading: 'Spaced repetition for Arabic vocabulary',
		lede: 'Every word you save comes back for review just before you would forget it. The ones you find hard come back sooner, and the ones you know well wait longer.',
		blurb: 'Saved words come back right before you would forget them.',
		seo: {
			title: 'Arabic Spaced Repetition Flashcards - Remember Every Word | Parallel Arabic',
			description:
				'Review Arabic vocabulary with spaced repetition. Save words from stories and lessons, rate how well you remembered each one, and let the schedule bring it back at the right time. Four dialects.'
		},
		hero: shot(
			'review',
			2048,
			1440,
			'A review card for إزيك, meaning how are you, with Easy, Medium and Hard buttons'
		),
		sections: [
			{
				title: 'Rate it, and the schedule adjusts',
				body: 'See the word, try to recall it, then reveal the answer and mark it Easy, Medium or Hard. Hard words come back sooner; easy ones wait longer before you see them again.'
			},
			{
				title: 'Hints, audio and dialect comparison on every card',
				body: 'Ask for a hint before you give up, play the pronunciation, or check how the word is said in the other dialects without leaving the review.'
			},
			{
				title: 'Words you chose, from what you read',
				body: 'Your deck is built from the words you saved while reading and practicing, so you are reviewing vocabulary you have already met in context.'
			}
		],
		app: { href: '/review', label: 'Review your words' },
		faqs: [
			{
				question: 'What is spaced repetition?',
				answer:
					'A way of scheduling reviews so that each one happens just as you are about to forget. Each successful review pushes the next one further out, which makes words stick with far fewer repetitions than cramming.'
			},
			{
				question: 'How is this different from Anki?',
				answer:
					'It works the same way, but the cards are made for you when you save a word, with audio and transliteration, so there is nothing to build by hand. If you prefer Anki, you can download our decks too.'
			},
			{
				question: 'Is review free?',
				answer:
					'Spaced-repetition review is part of Parallel Arabic Pro, which is $10 a month. Saving words to your word bank is free.'
			}
		]
	},
	{
		slug: 'arabic-pronunciation-practice',
		name: 'Pronunciation',
		emoji: '🎙️',
		heading: 'Arabic pronunciation practice with instant feedback',
		lede: 'Read a sentence out loud and see straight away how close you were. Practice sentences are made for your dialect and level, and can use the words from your review deck.',
		blurb: 'Say a sentence out loud and see how close you were.',
		seo: {
			title: 'Arabic Pronunciation Practice with Instant Feedback | Parallel Arabic',
			description:
				'Practice Arabic pronunciation by reading sentences out loud and getting a score back instantly. Pick your dialect, your level from A1 to C2 and the grammar you want to drill.'
		},
		hero: shot(
			'speak-score',
			1202,
			957,
			'Speaking practice scoring a spoken Arabic sentence at 100 percent'
		),
		sections: [
			{
				title: 'Speak, and get a score back',
				body: 'Say the sentence and you get a score for how close you were. Try again until it comes out clean.'
			},
			{
				title: 'Sentences at your level',
				body: 'Choose Egyptian, Levantine, Darija or Fusha, a level from A1 to C2, and optionally a focus such as past tense, plurals or numbers. You get fresh sentences every time.',
				shot: shot(
					'speak',
					2048,
					1800,
					'Speaking practice setup: pick a dialect, a difficulty level from A1 to C2 and optional focus topics'
				)
			},
			{
				title: 'Practice the words you are learning',
				body: 'Switch on “Use your review words” and the sentences are built from your own vocabulary, so pronunciation practice doubles as review.'
			}
		],
		app: { href: '/speak', label: 'Practice speaking' },
		faqs: [
			{
				question: 'Do I need a special microphone?',
				answer: 'No. Your phone or laptop microphone is enough.'
			},
			{
				question: 'Which dialects can I practice?',
				answer:
					'Egyptian Arabic, Levantine Arabic, Moroccan Darija and Modern Standard Arabic.'
			},
			{
				question: 'Is pronunciation practice free?',
				answer: 'Yes, speaking practice is included in the free plan.'
			}
		]
	},
	{
		slug: 'arabic-writing-practice',
		name: 'Writing Practice',
		emoji: '✍️',
		heading: 'Arabic writing practice',
		lede: 'Type full sentences on a built-in Arabic keyboard, put scrambled words back in order, or trace them letter by letter. Practice sentences are made for your level and the grammar you want to drill.',
		blurb: 'Type, unscramble or trace sentences on a built-in keyboard.',
		seo: {
			title: 'Arabic Writing Practice - Type Sentences in Arabic Script | Parallel Arabic',
			description:
				'Practice writing Arabic with sentences made for your level. Type on a built-in Arabic keyboard, reorder scrambled words or trace letter by letter, in Egyptian, Levantine, Darija or Fusha.'
		},
		hero: shot(
			'sentences-trace',
			1238,
			868,
			'Tracing an Arabic sentence on the built-in keyboard'
		),
		sections: [
			{
				title: 'No Arabic keyboard needed',
				body: 'The on-screen keyboard shows every letter, so you can write Arabic on any computer. Trace mode walks you through a sentence letter by letter while you learn the layout.'
			},
			{
				title: 'Choose what you drill',
				body: 'Pick a level from A1 to C2 and a focus like verb conjugation, plurals, the future tense or possessive suffixes. Add your own vocabulary, or use the words from your review deck.',
				shot: shot(
					'sentences',
					2048,
					1800,
					'Sentence practice setup: difficulty level, focus topics, custom vocabulary and practice mode'
				)
			},
			{
				title: 'Writing or multiple choice',
				body: 'Type the answer out yourself, or switch to a multiple-choice quiz when you want a quicker round.'
			}
		],
		app: { href: '/sentences', label: 'Practice writing' },
		faqs: [
			{
				question: 'Can I practice if I cannot read Arabic yet?',
				answer:
					'Start with the alphabet first. Once you know the letters, trace mode is a gentle way into writing whole words.'
			},
			{
				question: 'Do I need to install an Arabic keyboard?',
				answer: 'No. The built-in keyboard works in the browser on any device.'
			},
			{
				question: 'Which dialects are the sentences in?',
				answer:
					'Egyptian Arabic, Levantine Arabic, Moroccan Darija and Modern Standard Arabic.'
			}
		]
	},
	{
		slug: 'arabic-verb-conjugation-practice',
		name: 'Verb Conjugation',
		emoji: '🔁',
		heading: 'Arabic verb conjugation practice',
		lede: 'Drill verb forms in past, present and future, affirmative and negative, until they come without thinking. Look up any verb, or work through the full Egyptian Arabic reference tables.',
		blurb: 'Drill past, present and future until the forms are automatic.',
		seo: {
			title: 'Arabic Verb Conjugation Practice - Drills & Tables | Parallel Arabic',
			description:
				'Practice conjugating Arabic verbs in the past, present and future tense, affirmative and negative. Quizzes and reference tables for Egyptian, Levantine, Moroccan Darija and Modern Standard Arabic.'
		},
		hero: shot(
			'conjugations',
			2048,
			2000,
			'A conjugation quiz for the Egyptian verb راح مع, to accompany, asking for the past tense of I'
		),
		sections: [
			{
				title: 'Quiz yourself form by form',
				body: 'You get a pronoun and a tense; pick the right form from four. Narrow it to one tense, or mix everything once you are confident.'
			},
			{
				title: 'Any verb, any dialect',
				body: 'Type a verb in English, such as “to write” or “to go”, and get its full conjugation in Egyptian, Levantine, Darija or Fusha.'
			},
			{
				title: 'Full reference tables',
				body: 'Switch from Practice to Reference Table to see every form at once, with transliteration. Egyptian Arabic verbs each have their own page.'
			}
		],
		app: { href: '/conjugations', label: 'Drill verbs' },
		faqs: [
			{
				question: 'Which tenses are covered?',
				answer: 'Past, present and future, each in the affirmative and the negative.'
			},
			{
				question: 'Do dialect verbs really conjugate differently from Fusha?',
				answer:
					'Yes. Egyptian adds بـ before present-tense verbs and هـ for the future, Levantine uses رح for the future, and all the dialects drop the dual forms that Fusha keeps.'
			},
			{
				question: 'Where are the Egyptian verb tables?',
				answer: 'At /egyptian-arabic/conjugations, with a page for each verb.'
			}
		]
	},
	{
		slug: 'compare-arabic-dialects',
		name: 'Dialect Comparison',
		emoji: '🌍',
		heading: 'Compare Arabic dialects side by side',
		lede: 'See how any word is said in Egyptian, Levantine, Moroccan Darija and Fusha at once. Learn one dialect well, and understand speakers of the others.',
		blurb: 'One word in Egyptian, Levantine, Darija and Fusha at once.',
		seo: {
			title: 'Compare Arabic Dialects - Egyptian, Levantine, Darija & Fusha | Parallel Arabic',
			description:
				'Compare any Arabic word or phrase across Egyptian, Levantine, Moroccan Darija and Modern Standard Arabic, with audio and transliteration. Plus side-by-side guides to how each pair of dialects differs.'
		},
		hero: shot(
			'compare-modal',
			2200,
			1800,
			'One word compared across Egyptian, Levantine, Moroccan Darija and Modern Standard Arabic, with audio for each'
		),
		sections: [
			{
				title: 'From any word, anywhere in the app',
				body: 'Tap a word in a story or a review card and hit Compare Dialects. Each version comes with transliteration and audio.'
			},
			{
				title: 'Guides to each pair of dialects',
				body: 'Egyptian vs Levantine, Levantine vs Darija, Darija vs Fusha and the rest: how the sounds, the grammar and everyday words differ, with the same phrases side by side.',
				shot: shot(
					'dialect-compare',
					2200,
					1800,
					'Egyptian Arabic vs Levantine Arabic: a table of the differences in pronunciation, tenses and common words'
				)
			},
			{
				title: 'Why it helps',
				body: 'Most Arabic speakers understand more than one dialect. Knowing the common swaps, like إيه and شو for “what”, makes other dialects far less of a shock.'
			}
		],
		app: { href: '/egyptian-arabic-vs-levantine', label: 'Compare Egyptian and Levantine' },
		faqs: [
			{
				question: 'Which dialects can I compare?',
				answer:
					'Egyptian Arabic, Levantine Arabic, Moroccan Darija and Modern Standard Arabic (Fusha).'
			},
			{
				question: 'Which two dialects are closest?',
				answer:
					'Egyptian and Levantine. The grammar is nearly parallel and most everyday vocabulary overlaps. Moroccan Darija is the furthest from the others.'
			},
			{
				question: 'Should I learn Fusha or a dialect?',
				answer:
					'A dialect if you want to talk to people, Fusha if you want to read news and books. Comparing them side by side makes it easier to learn one after the other.'
			}
		]
	},
	{
		slug: 'import-arabic-vocabulary',
		name: 'Import Words',
		emoji: '📥',
		heading: 'Import your Arabic word lists',
		lede: 'Already have a vocabulary list from a class, a textbook or another app? Paste it in or upload a CSV, give the Arabic, the English or both, and the rest is filled in for you.',
		blurb: 'Paste a list or upload a CSV, and the rest is filled in.',
		seo: {
			title: 'Import Arabic Vocabulary from CSV or a Word List | Parallel Arabic',
			description:
				'Turn any Arabic vocabulary list into review cards. Upload a CSV or TXT file or paste a list, and the missing translation and transliteration are filled in for you.'
		},
		hero: shot(
			'import',
			2048,
			1720,
			'The Import Words dialog, with Egyptian Arabic selected and a drop zone for a CSV or TXT file'
		),
		sections: [
			{
				title: 'Whatever format you have',
				body: 'A CSV with arabic, english and transliteration columns works, and so does a plain text file with one word or phrase per line. Or just paste the list in.'
			},
			{
				title: 'Missing fields filled in',
				body: 'Give only the Arabic and you get the English and the transliteration. Give only the English and you get the Arabic, in the dialect you picked.'
			},
			{
				title: 'Straight into review',
				body: 'Imported words go into your word bank and your spaced-repetition deck, ready for stories, sentences and practice built around them.'
			}
		],
		app: { href: '/review/import', label: 'Import words' },
		faqs: [
			{
				question: 'What file formats can I upload?',
				answer: 'CSV and TXT files up to 500KB. You can also paste text directly.'
			},
			{
				question: 'Do I need to include transliteration?',
				answer:
					'No. Transliteration is optional, and a plain list of Arabic words with one per line is enough.'
			},
			{
				question: 'Which dialect should I choose?',
				answer:
					'The one your list is in. It decides how missing Arabic is filled in and how the words are pronounced.'
			}
		]
	},
	{
		slug: 'arabic-vocabulary-tracker',
		name: 'Word Bank',
		emoji: '🗂️',
		heading: 'Track every Arabic word you learn',
		lede: 'Every word and sentence you save in one table, with the English, the transliteration, its dialect and where it is in your review schedule.',
		blurb: 'Every saved word in one table, with its review status.',
		seo: {
			title: 'Arabic Vocabulary Tracker - Your Words in One Place | Parallel Arabic',
			description:
				'Keep all your Arabic vocabulary in one searchable table: Arabic, English, transliteration, dialect and review status. Sort by what is due and turn your words into sentences and stories.'
		},
		hero: shot(
			'all-words',
			2560,
			1720,
			'A table of saved words with their English, transliteration, dialect and review status'
		),
		sections: [
			{
				title: 'See what you know, and what is due',
				body: 'Each word shows whether it is new or learning, how many times you have reviewed it and when it is next due. Sort by any of them.'
			},
			{
				title: 'Search and tidy up',
				body: 'Find a word in seconds, and remove the ones you no longer need so review stays focused.'
			},
			{
				title: 'Put your words to work',
				body: 'Generate practice sentences from your list, or import more words from a file.'
			}
		],
		app: { href: '/review/all-words', label: 'See your words' },
		faqs: [
			{
				question: 'How do words get into my word bank?',
				answer:
					'Save them while you read stories and practice, or import a list from a file.'
			},
			{
				question: 'Can I keep words from more than one dialect?',
				answer: 'Yes. Each word is tagged with its dialect.'
			},
			{
				question: 'Is the word bank free?',
				answer: 'Yes. Saving words and seeing them all in one place is part of the free plan.'
			}
		]
	},
	{
		// /learn/game/room-hunt ranks for the game itself; this page is for
		// "learn Arabic in 3D" and "order food in Arabic".
		slug: 'learn-arabic-in-3d',
		name: 'Room Hunt 3D',
		emoji: '🏠',
		heading: 'Learn Arabic in 3D: words around the house, and ordering a meal',
		lede: 'Step into a 3D kitchen, bathroom or restaurant. Learn what everything is called in your dialect, find things when you hear "Where is the…?", then sit down and order dinner from a waiter, in Arabic.',
		blurb: 'Learn household words in 3D rooms and order dinner from a waiter.',
		seo: {
			title: 'Learn Arabic in 3D: Home Words & Ordering Food | Parallel Arabic',
			description:
				'Learn the Arabic for things in the kitchen, bathroom and restaurant inside a 3D room, then order a meal from a waiter. Egyptian, Levantine, Darija and Fusha.'
		},
		hero: shot(
			'room-hunt-order-served',
			2560,
			1440,
			'Ordering a meal in Room Hunt: the waiter says "Here you go, enjoy your meal" in Egyptian Arabic with transliteration and English, and the fish and tea you ordered are on the table',
			'room-hunt-order'
		),
		sections: [
			{
				title: 'Four new words at a time',
				body: 'Each lesson teaches four things in the room. The view turns to each one, it glows, you hear its name and see it written, and you tap it to move on. A kitchen takes four short lessons, not one long list.',
				shot: shot(
					'room-hunt-learn',
					2560,
					1440,
					'A Room Hunt lesson teaching the Egyptian word for stove, بوتاجاز, with the stove glowing',
					'room-hunt-lesson'
				)
			},
			{
				title: '"Where is the stove?"',
				body: 'Then the game asks for them, mixed with words you already know, the way someone would ask: فين البوتاجاز؟ in Cairo, وين الغاز؟ in Beirut. You find it and tap it. Every question is recorded, so you hear it as well as read it.',
				shot: shot(
					'room-hunt-find',
					2560,
					1440,
					'A Find it question in the kitchen: "Where is the stove?" in Egyptian Arabic, with transliteration and English'
				)
			},
			{
				title: 'Wrong taps still teach you something',
				body: 'Tap the wrong thing and it tells you what you tapped, so a miss is one more word. Miss twice and the right object glows. Anything you missed comes back a few questions later, while it is fresh.',
				shot: shot(
					'room-hunt-hint',
					2560,
					1440,
					'After two wrong taps, the stove glows amber and the card says the last tap was the cupboard'
				)
			},
			{
				title: 'Name it, or say it',
				body: 'Switch to Name it and the game turns it around: an object glows and you pick its name from four, or press the microphone and say it out loud.',
				shot: shot(
					'room-hunt-name',
					2560,
					1440,
					'Name it mode in the bathroom: the washing machine glows and four Egyptian Arabic words are offered, with a Say it button'
				)
			},
			{
				title: 'Order a meal from the waiter',
				body: 'In the restaurant you can sit down and order. The waiter walks over and talks to you in your dialect, with the Arabic, transliteration and English on screen. You answer by picking a reply or saying it. Some replies fit the moment and some do not, like asking for the bill before you have sat down.',
				shot: shot(
					'room-hunt-order-waiter',
					2560,
					1440,
					'The waiter welcomes you to the restaurant in Egyptian Arabic while you reply شكرا'
				)
			},
			{
				title: 'You get what you ordered',
				body: 'Tea or water, fish, chicken or soup, cake or no cake: the waiter goes to the kitchen and brings exactly that to your table. At the end you get the bill, your order in Arabic, and every phrase you used, ready to save.',
				shot: shot(
					'room-hunt-order-receipt',
					2560,
					1440,
					'The end of the meal: your order in Arabic (tea, fish, cake) and the phrases you used, each with audio and a save button'
				)
			},
			{
				title: 'Four dialects, every word recorded',
				body: 'Egyptian, Levantine, Moroccan Darija and Modern Standard Arabic each use their own words: the fridge is a tallaga in Cairo and a barrad in Beirut. Every word, question and line of the waiter has a recording.'
			},
			{
				title: 'Easy, Normal or Hard',
				body: 'Easy shows the English and points the way. Normal keeps the Arabic and transliteration. Hard is listening only: you hear the question and the words appear after you answer.'
			}
		],
		app: { href: '/learn/game/room-hunt', label: 'Step into the kitchen' },
		faqs: [
			{
				question: 'Is Room Hunt a real 3D game?',
				answer:
					'Yes. It runs in your browser with no download. You stand in the middle of a room and drag to look around, or use the arrow keys, and it goes fullscreen when a lesson starts.'
			},
			{
				question: 'What do I say to the waiter?',
				answer:
					'You greet them, order a drink and a main, answer when they ask about dessert, ask for the bill and say goodbye. Each turn offers a few replies; pick one or say it. The lines change with your dialect.'
			},
			{
				question: 'Does it work on a phone?',
				answer:
					'Yes. Drag with one finger to look around and tap to choose. The rooms are small, so they load quickly on mobile data.'
			},
			{
				question: 'How many words does it teach?',
				answer:
					'Thirty-nine everyday things across the three rooms, from the fridge and the sink to forks, bread and tea, plus about twenty restaurant phrases.'
			}
		]
	},
	{
		// /learn/game ranks for "Arabic games"; this page stays off those words.
		slug: 'learn-arabic-by-playing',
		name: 'Games',
		emoji: '🎮',
		heading: 'Practice Arabic spelling, vocabulary and grammar by playing',
		lede: 'Five short games for vocabulary, spelling and grammar, in Egyptian, Levantine, Moroccan Darija and Fusha. A round takes a few minutes, and every game has two free rounds with no account needed.',
		blurb: 'Word scramble, odd one out and more, in four dialects.',
		seo: {
			title: 'Learn Arabic by Playing: Spelling & Grammar Practice | Parallel Arabic',
			description:
				'Practice Arabic by playing: unscramble words and sentences, spot the odd one out or the grammar mistake, or quiz yourself. In Egyptian, Levantine, Darija and Fusha.'
		},
		hero: shot(
			'games',
			2200,
			1520,
			'The games hub with Word Scramble, Odd One Out, Spot the Mistake, Sentence Scramble and the Vocabulary Quiz'
		),
		// One row per game, from the same data as the hub, so the two never drift.
		// Plain names, not each game's h1, so these don't compete with the game pages.
		sections: [
			...GAMES.map((g) => ({ title: g.name, body: g.intro, shot: g.shot })),
			{
				title: QUIZ_CARD.name,
				body: 'A quiz built fresh each time, in your dialect and at your level. Answer by reading, listening or speaking, with single words or whole sentences.',
				shot: QUIZ_CARD.shot
			}
		],
		app: { href: '/learn/game', label: 'Play a game' },
		faqs: [
			{
				question: 'Do games actually help you learn Arabic?',
				answer:
					'Yes, as practice. Every round makes you recall a word, a spelling or a word order rather than just recognise it, and recalling is what makes vocabulary stick. Pair them with reading and speaking, which the games do not replace.'
			},
			{
				question: 'How long does a round take?',
				answer:
					'A few minutes. A round is five words in Word Scramble, eight sentences in Sentence Scramble, and ten puzzles or sentences in the others.'
			},
			{
				question: 'Do the words I get wrong come back?',
				answer:
					'Sign in and they do: the words you miss come back later in your review, so a bad round still teaches you something.'
			},
			{
				question: 'How are the games different from each other?',
				answer:
					'Word Scramble trains spelling and how letters join. Odd One Out trains meaning and grammar patterns. Spot the Mistake and Sentence Scramble train grammar and word order in full sentences. The Vocabulary Quiz mixes reading, listening and speaking.'
			}
		]
	}
];

export function getFeature(slug: string): FeatureInfo | undefined {
	return FEATURES.find((f) => f.slug === slug);
}

export interface FeatureLink {
	href: Pathname;
	name: string;
	emoji: string;
	blurb: string;
}

/** The "explore more" grid: every feature page, plus features with pages elsewhere. */
export const FEATURE_LINKS: FeatureLink[] = [
	...FEATURES.map((f) => ({
		href: `/features/${f.slug}` as const,
		name: f.name,
		emoji: f.emoji,
		blurb: f.blurb
	})),
	{
		href: '/alphabet',
		name: 'Alphabet',
		emoji: '🔤',
		blurb: 'The 28 letters, their forms and sounds, with exercises.'
	},
	{
		href: '/anki-decks',
		name: 'Anki Decks',
		emoji: '🃏',
		blurb: 'Download vocabulary decks for every dialect.'
	}
];
