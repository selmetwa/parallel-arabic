/**
 * The /demo pages: one short screen-recorded walkthrough per product area.
 * Each video also plays on its /features page (see `demosForFeature`).
 *
 * Plain data (no Svelte or $app imports) so the sitemap and the page loaders
 * can read it. Videos live in static/videos/demo/ and posters in
 * static/images/demo/. They are recorded and rendered outside this repo with
 * the devrel-video studio (Playwright capture + HyperFrames), so re-render
 * there and copy the web copy over; chapter times below are seconds into the
 * rendered video and come from the capture's recorded beats. Chapters are not
 * shown on the page; they become Clip markup so Google can show key moments.
 *
 * Each page targets "watch a demo" searches; the matching /features page
 * targets the feature itself, and the two link to each other.
 */

import type { Pathname } from '$app/types';
import type { Faq } from './features';

const BASE_URL = 'https://www.parallel-arabic.com';

export interface DemoChapter {
	/** Seconds into the video. */
	start: number;
	end: number;
	title: string;
}

export interface DemoInfo {
	slug: string;
	/** Short name for cards and breadcrumbs. */
	name: string;
	emoji: string;
	/** The page's h1, worded for the search it should rank for. */
	heading: string;
	lede: string;
	/** One line for the /demo index and the feature page caption. */
	blurb: string;
	seo: { title: string; description: string };
	video: {
		src: string;
		poster: string;
		/** Seconds. */
		duration: number;
		uploadDate: string;
	};
	chapters: DemoChapter[];
	/** The /features page this demo plays on, and the link back to it. */
	feature: { slug: string; label: string };
	app: { href: Pathname; label: string };
	faqs: Faq[];
}

const media = (slug: string, duration: number) => ({
	src: `/videos/demo/${slug}-demo.mp4`,
	poster: `/images/demo/${slug}-demo.jpg`,
	duration,
	uploadDate: '2026-11-04'
});

const chapters = (...rows: [number, number, string][]): DemoChapter[] =>
	rows.map(([start, end, title]) => ({ start, end, title }));

export const DEMOS: DemoInfo[] = [
	{
		slug: 'arabic-stories',
		name: 'Stories',
		emoji: '📖',
		heading: 'Arabic stories demo: read in your dialect with English and transliteration',
		lede: 'A 27-second look at reading in Parallel Arabic. Pick a story in your dialect, turn on English and transliteration under every word, and tap any word you don’t know for its meaning, root and how it is used in that sentence.',
		blurb: 'Pick a story, show the translation, tap a word for its meaning.',
		seo: {
			title: 'Arabic Stories Demo (Video) - Read with Translation | Parallel Arabic',
			description:
				'Watch a 27-second demo of reading Arabic stories in Parallel Arabic: Egyptian Arabic text with English and transliteration under every word, and instant definitions with the root.'
		},
		video: media('arabic-stories', 27.5),
		chapters: chapters(
			[3.9, 10.1, 'Stories in your dialect'],
			[10.4, 17.2, 'Arabic, English and transliteration side by side'],
			[17.5, 25.1, 'Tap any word for its meaning']
		),
		feature: { slug: 'arabic-reading-practice', label: 'More about Arabic reading practice' },
		app: { href: '/stories', label: 'Browse stories' },
		faqs: [
			{
				question: 'Can I hide the English while I read?',
				answer:
					'Yes. English, transliteration and tashkeel each have their own switch, so you can read with all the help on and turn it off as your reading improves.'
			},
			{
				question: 'What happens when I tap a word?',
				answer:
					'You get its meaning, its root letters and a note on how it is used in that sentence. You can listen to it, compare it across dialects and save it to your review list.'
			},
			{
				question: 'Which dialect is the story in the demo?',
				answer:
					'Egyptian Arabic. Stories are also available in Levantine Arabic, Moroccan Darija and Modern Standard Arabic, and you can create your own in Iraqi, Gulf and Saudi Arabic.'
			}
		]
	},
	{
		slug: 'arabic-games',
		name: 'Games',
		emoji: '🎮',
		heading: 'Arabic games demo: learn vocabulary by playing',
		lede: 'A 36-second look at the Parallel Arabic game library. Browse games from beginner to intermediate, then play a round of Memory Pairs: turn over cards and match each Arabic word to its English meaning. None of the games need an Arabic keyboard.',
		blurb: 'Browse the game library and clear a round of Memory Pairs.',
		seo: {
			title: 'Arabic Games Demo (Video) - Memory Pairs and More | Parallel Arabic',
			description:
				'Watch a 36-second demo of Parallel Arabic’s word games: browse 16 games in 7 dialects, then match Arabic words to their meanings in Memory Pairs. No typing needed.'
		},
		video: media('arabic-games', 35.7),
		chapters: chapters(
			[3.9, 15.2, 'Games for every level'],
			[15.5, 19.6, 'Match Arabic words to their meaning'],
			[19.9, 33.3, 'Every match earns XP']
		),
		feature: { slug: 'learn-arabic-by-playing', label: 'More about learning Arabic by playing' },
		app: { href: '/learn/game', label: 'Play a game' },
		faqs: [
			{
				question: 'Do I need to type in Arabic to play?',
				answer:
					'No. You play by tapping: turning over cards, picking letter tiles or choosing an answer. Shadowing also asks you to speak. None of the games need an Arabic keyboard.'
			},
			{
				question: 'Which dialects do the games cover?',
				answer:
					'Egyptian, Levantine, Moroccan Darija, Iraqi, Gulf, Saudi and Modern Standard Arabic. Pick your dialect at the top of any game.'
			},
			{
				question: 'Are the games free?',
				answer:
					'Your first three rounds are free, in any games you like, with no account needed. Sign up and you get five more; Premium unlocks unlimited rounds of everything.'
			}
		]
	},
	{
		slug: 'arabic-lessons',
		name: 'Lessons',
		emoji: '📚',
		heading: 'Arabic lessons demo: a step-by-step course in spoken Arabic',
		lede: 'A 37-second look at a Parallel Arabic lesson. Follow the Egyptian Arabic course path, open the Family Members lesson, read a short grammar note, learn four new words with audio, and test yourself straight away.',
		blurb: 'Open a course lesson, learn new words, then quiz yourself.',
		seo: {
			title: 'Arabic Lessons Demo (Video) - Structured Egyptian Arabic Course | Parallel Arabic',
			description:
				'Watch a 37-second demo of a Parallel Arabic lesson: the Egyptian Arabic course path, a short grammar note, new words with audio and transliteration, and a quick quiz.'
		},
		video: media('arabic-lessons', 37),
		chapters: chapters(
			[3.9, 8.7, 'A step-by-step course in your dialect'],
			[9, 15.7, 'Short grammar notes before you start'],
			[16, 19.8, 'Learn new words with audio'],
			[20.1, 34.6, 'Then quiz yourself']
		),
		feature: { slug: 'arabic-course', label: 'More about the Arabic course' },
		app: { href: '/lessons', label: 'Start a lesson' },
		faqs: [
			{
				question: 'Do I need to know the Arabic alphabet first?',
				answer:
					'No. Every word and example has transliteration, so you can start the course before you read Arabic script. Learning the letters alongside it helps.'
			},
			{
				question: 'Do the lessons teach grammar?',
				answer:
					'Yes. A lesson opens with a short note on the grammar it uses, like the possessive endings in Family Members, and links to the full article in the grammar guide.'
			},
			{
				question: 'Which dialect is the course in the demo?',
				answer:
					'Egyptian Arabic. Choose your dialect from the lessons page to follow its own course path.'
			}
		]
	},
	{
		slug: 'arabic-conversation-scenarios',
		name: 'Scenarios',
		emoji: '🚕',
		heading: 'Arabic conversation scenarios demo: take a taxi in Egyptian Arabic',
		lede: 'A 55-second ride through a Parallel Arabic scenario. Pick a place and a dialect, and the driver talks to you in Arabic, with transliteration and English. Tap a reply to answer, and what you ask for happens: the taxi drives where you tell it.',
		blurb: 'Take a taxi in Arabic: the driver talks, you tap a reply.',
		seo: {
			title: 'Arabic Conversation Practice Demo (Video) - Taxi Scenario | Parallel Arabic',
			description:
				'Watch a 55-second demo of Parallel Arabic’s conversation scenarios: a taxi ride in Egyptian Arabic where the driver speaks first and you answer by tapping a reply.'
		},
		video: media('arabic-conversation-scenarios', 54.6),
		chapters: chapters(
			[3.9, 11.7, 'Pick a place and your dialect'],
			[12, 15.8, 'The driver speaks first, in your dialect'],
			[16.1, 27.3, 'Tap a reply to answer'],
			[27.6, 51.6, 'What you ask for actually happens']
		),
		feature: { slug: 'arabic-conversation-practice', label: 'More about Arabic conversation practice' },
		app: { href: '/scenarios', label: 'Try a scenario' },
		faqs: [
			{
				question: 'Which places can I practise?',
				answer:
					'Ordering a meal, taking a taxi, shopping at the market, the pharmacy, checking in at a hotel, the café, the doctor’s, the airport and asking the way.'
			},
			{
				question: 'Do I have to speak, or can I tap?',
				answer:
					'Either. Tap one of the replies, or press the microphone and say it out loud. A wrong reply gets a gentle nudge and the right one is marked.'
			},
			{
				question: 'Can I make it harder?',
				answer:
					'Yes. Easy shows the English under every reply, Normal hides it, and Hard hides the other person’s words until you answer, so you have to listen.'
			}
		]
	},
	{
		slug: 'arabic-ai-tutor',
		name: 'AI Tutor',
		emoji: '💬',
		heading: 'AI Arabic tutor demo: a real conversation at a café',
		lede: 'A 33-second look at the Parallel Arabic AI Tutor. Pick a situation, learn its key words, then hold the conversation in your dialect. Every reply from the tutor comes with transliteration, English and a suggested answer you can use or change.',
		blurb: 'Order at a café with the AI Tutor, with a suggested reply every turn.',
		seo: {
			title: 'AI Arabic Tutor Demo (Video) - Speak Egyptian Arabic | Parallel Arabic',
			description:
				'Watch a 33-second demo of the Parallel Arabic AI Tutor: learn the key words, then order at a café in Egyptian Arabic with transliteration, English and a suggested reply every turn.'
		},
		video: media('arabic-ai-tutor', 33.3),
		chapters: chapters(
			[3.9, 6.5, 'Pick a situation to practise'],
			[6.8, 10.3, 'Learn the key words first'],
			[10.6, 16.4, 'Then hold a real conversation'],
			[16.7, 30.3, 'Corrections and a suggested reply every turn']
		),
		feature: { slug: 'arabic-conversation-practice', label: 'More about Arabic conversation practice' },
		app: { href: '/tutor', label: 'Start a conversation' },
		faqs: [
			{
				question: 'What can I talk to the tutor about?',
				answer:
					'Start with a guided situation like introducing yourself, ordering at a café, taking a taxi or asking for directions, or describe your own and practise that.'
			},
			{
				question: 'Do I have to type in Arabic?',
				answer:
					'No. You can speak, use the suggested reply, or type with the on-screen Arabic keyboard.'
			},
			{
				question: 'Can I see what the tutor is saying?',
				answer:
					'Yes. Switch on English and transliteration to see them under every line the tutor says.'
			}
		]
	},
	{
		slug: 'arabic-3d-room-hunt',
		name: 'Room Hunt',
		emoji: '🏠',
		heading: 'Learn Arabic in 3D demo: name everything in the kitchen',
		lede: 'A 40-second look at Room Hunt. Step into a 3D kitchen, learn four new words as each object lights up, then name whatever glows. Kitchen, bathroom and restaurant rooms, in your dialect.',
		blurb: 'Learn four words in a 3D kitchen, then name what glows.',
		seo: {
			title: 'Learn Arabic in 3D Demo (Video) - Room Hunt | Parallel Arabic',
			description:
				'Watch a 40-second demo of Room Hunt: learn Egyptian Arabic words for things in a 3D kitchen, then name each glowing object. Kitchen, bathroom and restaurant rooms.'
		},
		video: media('arabic-3d-room-hunt', 39.8),
		chapters: chapters(
			[3.9, 7.1, 'Step into a real room'],
			[7.4, 18.9, 'Learn four new words in the room'],
			[19.2, 36.8, 'Then name what glows']
		),
		feature: { slug: 'learn-arabic-in-3d', label: 'More about learning Arabic in 3D' },
		app: { href: '/learn/game/room-hunt', label: 'Step into the kitchen' },
		faqs: [
			{
				question: 'How does a Room Hunt lesson work?',
				answer:
					'It teaches four new words, lighting up each object as you meet it, then asks for them mixed with words you already know.'
			},
			{
				question: 'What is the difference between Find it and Name it?',
				answer:
					'In Find it you hear or read a word and tap the object in the room. In Name it an object glows and you pick its Arabic name, or say it.'
			},
			{
				question: 'Which rooms are there?',
				answer: 'A kitchen, a bathroom and a restaurant, each with its own set of words.'
			}
		]
	},
	{
		slug: 'arabic-dialect-comparison',
		name: 'Compare dialects',
		emoji: '🌍',
		heading: 'Compare Arabic dialects demo: one word in seven dialects',
		lede: 'A 30-second look at comparing dialects in Parallel Arabic. Tap a word in a story, and see how it is said in Egyptian, Levantine, Moroccan Darija, Iraqi, Gulf, Saudi and Fusha at once. Then read the side-by-side guides to each pair of dialects.',
		blurb: 'Tap a word and see it in seven dialects at once.',
		seo: {
			title: 'Compare Arabic Dialects Demo (Video) - Egyptian, Levantine, Darija | Parallel Arabic',
			description:
				'Watch a 30-second demo: tap عايز (want) in an Egyptian story and see it in Levantine (baddi), Darija, Iraqi, Gulf, Saudi and Fusha, then read the Egyptian vs Levantine guide.'
		},
		video: media('arabic-dialect-comparison', 29.6),
		chapters: chapters(
			[3.9, 9.2, 'Tap any word in a story'],
			[9.5, 16.2, 'See it in every dialect'],
			[16.5, 26.6, 'Guides to each pair of dialects']
		),
		feature: { slug: 'compare-arabic-dialects', label: 'More about comparing Arabic dialects' },
		app: { href: '/egyptian-arabic-vs-levantine', label: 'Compare Egyptian and Levantine' },
		faqs: [
			{
				question: 'Where can I compare a word across dialects?',
				answer:
					'From any word in a story or a review card: open its definition and tap Compare Dialects. Each version comes with transliteration and audio.'
			},
			{
				question: 'Which dialects are compared?',
				answer:
					'Egyptian, Levantine, Moroccan Darija, Iraqi, Gulf (Khaleeji), Saudi (Hijazi) and Modern Standard Arabic.'
			},
			{
				question: 'Should I learn more than one dialect?',
				answer:
					'Learn one well first. Knowing the common swaps, like عايز in Egyptian and بدي in Levantine for “I want”, makes the others much easier to follow.'
			}
		]
	},
	{
		slug: 'arabic-vocab-review',
		name: 'Vocab review',
		emoji: '🧠',
		heading: 'Arabic spaced repetition demo: review the words you saved',
		lede: 'A 26-second look at vocabulary review in Parallel Arabic. Your saved words come back when they are due. Try to recall each one, reveal the meaning, and rate how well you knew it so it returns at the right time.',
		blurb: 'Recall a word, reveal it, rate it, and it comes back on time.',
		seo: {
			title: 'Arabic Spaced Repetition Demo (Video) - Vocabulary Review | Parallel Arabic',
			description:
				'Watch a 26-second demo of Parallel Arabic’s spaced repetition review: recall Egyptian Arabic words and phrases, reveal the meaning and transliteration, and rate how well you knew them.'
		},
		video: media('arabic-vocab-review', 25.8),
		chapters: chapters(
			[3.9, 5.8, 'Your saved words, when they are due'],
			[6.1, 9.2, 'Try to recall it, then reveal'],
			[9.5, 22.8, 'Rate it, and it comes back at the right time']
		),
		feature: { slug: 'arabic-spaced-repetition', label: 'More about Arabic spaced repetition' },
		app: { href: '/review', label: 'Review your words' },
		faqs: [
			{
				question: 'Where do the review words come from?',
				answer:
					'Any word you save while reading stories, playing games or taking lessons, plus word lists you import or generate.'
			},
			{
				question: 'How do I rate a card?',
				answer:
					'After revealing it, pick Easy, Medium, Hard or Forgot. Easy words come back later; words you forgot come back soon.'
			},
			{
				question: 'Can I get a hint before revealing?',
				answer:
					'Yes. Show Hint gives you a clue, Listen plays the audio, and Compare Dialects shows the word in other dialects.'
			}
		]
	},
	{
		slug: 'arabic-vocab-import',
		name: 'Import words',
		emoji: '📥',
		heading: 'Import Arabic vocabulary demo: paste a word list',
		lede: 'A 21-second look at importing words into Parallel Arabic. Paste a list in English, Arabic or both, pick your dialect, and the missing Arabic, English and transliteration are filled in. The words go straight into your review.',
		blurb: 'Paste a word list and the missing pieces are filled in.',
		seo: {
			title: 'Import Arabic Vocabulary Demo (Video) - Paste a Word List | Parallel Arabic',
			description:
				'Watch a 21-second demo of importing vocabulary into Parallel Arabic: paste English, Arabic or both, and the missing Arabic, English and transliteration are filled in for review.'
		},
		video: media('arabic-vocab-import', 20.9),
		chapters: chapters(
			[3.9, 8.9, 'Paste any word list'],
			[9.2, 13.6, 'Missing Arabic, English and transliteration filled in'],
			[13.9, 17.9, 'Ready to review']
		),
		feature: { slug: 'import-arabic-vocabulary', label: 'More about importing Arabic vocabulary' },
		app: { href: '/review/import', label: 'Import words' },
		faqs: [
			{
				question: 'What formats can I import?',
				answer:
					'Paste text or upload a CSV or TXT file. One entry per line: Arabic only, English only, or Arabic, English and transliteration separated by commas, pipes or semicolons.'
			},
			{
				question: 'What happens to words already in my deck?',
				answer: 'They are skipped, so importing the same list twice does not create duplicates.'
			},
			{
				question: 'Which dialects can I import into?',
				answer:
					'Egyptian, Levantine, Moroccan Darija, Iraqi, Gulf, Saudi or Modern Standard Arabic. Pick one before importing.'
			}
		]
	}
];

export function getDemo(slug: string): DemoInfo | undefined {
	return DEMOS.find((d) => d.slug === slug);
}

/** The demos that play on a /features page. */
export function demosForFeature(featureSlug: string): DemoInfo[] {
	return DEMOS.filter((d) => d.feature.slug === featureSlug);
}

/**
 * VideoObject markup for a demo. On its own /demo page the chapters become
 * Clips, which link back to that page with ?t= (the page seeks there); other
 * pages embedding the video leave them out, since a Clip must be on its page.
 */
export function demoVideoObject(demo: DemoInfo, withClips = false) {
	const pageUrl = `${BASE_URL}/demo/${demo.slug}`;
	return {
		'@type': 'VideoObject',
		name: demo.heading,
		description: demo.seo.description,
		thumbnailUrl: [`${BASE_URL}${demo.video.poster}`],
		uploadDate: demo.video.uploadDate,
		duration: `PT${Math.round(demo.video.duration)}S`,
		contentUrl: `${BASE_URL}${demo.video.src}`,
		inLanguage: 'en',
		publisher: { '@type': 'Organization', name: 'Parallel Arabic', url: BASE_URL },
		...(withClips && {
			hasPart: demo.chapters.map((chapter) => ({
				'@type': 'Clip',
				name: chapter.title,
				startOffset: Math.floor(chapter.start),
				endOffset: Math.ceil(chapter.end),
				url: `${pageUrl}?t=${Math.floor(chapter.start)}`
			}))
		})
	};
}

/** FAQPage markup, for loaders that return their own structuredData (which replaces the layout's). */
export function faqPage(faqs: Faq[]) {
	return {
		'@type': 'FAQPage',
		mainEntity: faqs.map((faq) => ({
			'@type': 'Question',
			name: faq.question,
			acceptedAnswer: { '@type': 'Answer', text: faq.answer }
		}))
	};
}
