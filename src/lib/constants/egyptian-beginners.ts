/**
 * Content for /egyptian-arabic/beginners.
 *
 * An ordered path rather than a feature list: the query behind this page is
 * "where do I start", and the answer is a sequence. Each step points at the
 * free page that teaches it, so the page is a table of contents for the site
 * as much as it is an article.
 */

export interface LearningStep {
	title: string;
	weeks: string;
	body: string;
	href: string;
	linkLabel: string;
}

export const BEGINNERS_INTRO =
	'There is no shortage of Egyptian Arabic material; the problem is that most of it starts in the wrong place. Courses open with the alphabet and grammar tables, which is how the language is taught in universities and not how anyone has ever learned to speak it. What follows is the order that actually works, with the free page on this site that covers each step.';

export const LEARNING_STEPS: LearningStep[] = [
	{
		title: 'Learn to read the alphabet before anything else',
		weeks: 'Week 1–2',
		body: 'Do this first and do it properly. Twenty-eight letters, most of which change shape depending on where they sit in the word, and three of which are also the long vowels. It takes a couple of weeks and it is the only part of Arabic that is pure memorisation. Skipping it and relying on transliteration feels faster for a month and then stops you dead, because every real resource is written in Arabic script.',
		href: '/alphabet',
		linkLabel: 'The interactive alphabet'
	},
	{
		title: 'Fix the sounds that Egyptian changes',
		weeks: 'Week 2',
		body: 'Six pronunciation rules separate Egyptian from the Arabic in most textbooks, and learning them early stops you building a Fusha accent you will have to unlearn. ج is a hard g, ق is usually a glottal stop, and the two "th" letters are not pronounced "th". An afternoon on this saves months.',
		href: '/egyptian-arabic/pronunciation',
		linkLabel: 'Egyptian Arabic pronunciation'
	},
	{
		title: 'Get the first hundred words in',
		weeks: 'Week 3–6',
		body: 'The hundred most frequent words account for close to half of everything said in Egyptian Arabic, and roughly the first eighty of them are grammar — pronouns, particles, prepositions. You do not study those as vocabulary; you absorb them by seeing them constantly. What you do study deliberately starts a little further down the list, which is why the topic pages are grouped the way they are.',
		href: '/egyptian-arabic/vocabulary',
		linkLabel: 'Vocabulary by topic'
	},
	{
		title: 'Learn whole phrases, not words to assemble',
		weeks: 'Week 4–8',
		body: 'Greetings, ordering, asking prices, saying you do not understand. These come out of your mouth as single units in real conversation, and learning them as units is both faster and more accurate than building them from grammar. It is also the point where you can have a first exchange with someone, which matters more for staying motivated than any amount of study.',
		href: '/egyptian-arabic/phrases',
		linkLabel: 'The phrasebook'
	},
	{
		title: 'Add the present tense and the negative',
		weeks: 'Week 8–12',
		body: 'Now grammar earns its place. Egyptian marks the ordinary present with a b- on the front of the verb (baktib, "I write") and negates by wrapping the verb in ma...sh (makatabtish, "I did not write"). Those two patterns plus a few dozen verbs cover most of what you will want to say in a normal day.',
		href: '/egyptian-arabic/conjugations',
		linkLabel: 'Verb conjugations'
	},
	{
		title: 'Read something longer than a sentence',
		weeks: 'Month 3 onward',
		body: 'Graded stories are where the vocabulary stops being a list and starts being a language. Reading with the English alongside is not cheating at this stage; looking a word up twenty times is how it sticks.',
		href: '/egyptian-arabic/stories',
		linkLabel: 'Graded stories'
	},
	{
		title: 'Start speaking before you feel ready',
		weeks: 'Month 3 onward',
		body: 'The gap between people who can read Arabic and people who can speak it is almost entirely practice hours, and the reason most learners never close it is that the first conversations are uncomfortable. Practising with a tutor that does not get bored and is available at midnight removes the part that stops people.',
		href: '/tutor',
		linkLabel: 'Conversation practice'
	}
];

export const BEGINNERS_FAQS = [
	{
		question: 'Should I learn Egyptian Arabic or Modern Standard Arabic first?',
		answer:
			'If your goal is to talk to people, start with Egyptian Arabic. Modern Standard Arabic is the language of news, books and formal writing, and almost nobody speaks it conversationally. If your goal is to read Arabic literature or the Quran, start with Fusha.'
	},
	{
		question: 'How long does it take to hold a conversation in Egyptian Arabic?',
		answer:
			'With consistent daily practice, a simple conversation is realistic in three to six months, and comfortable conversation in one to two years. The alphabet takes two weeks. The single biggest variable is how early you start speaking rather than only reading.'
	},
	{
		question: 'Do I need to learn the Arabic script?',
		answer:
			'Yes, and early. Transliteration is inconsistent between resources, hides the vowel information you need, and locks you out of everything written for native speakers. The two weeks it costs is the best trade available in learning Arabic.'
	},
	{
		question: 'Is Egyptian Arabic a good first dialect?',
		answer:
			'For most learners, yes. It is the most widely understood dialect in the Arab world thanks to a century of Egyptian film and music, and it has more learning material than any other dialect. If you have a specific destination or family connection elsewhere, follow that instead.'
	},
	{
		question: 'Can I learn Egyptian Arabic for free?',
		answer:
			'The alphabet, the pronunciation guide, the vocabulary topic pages, the phrasebook and the conjugation tables on this site are all free and need no account. The paid part is the tutor, the graded stories and the spaced-repetition review that tracks what you have forgotten.'
	}
];
