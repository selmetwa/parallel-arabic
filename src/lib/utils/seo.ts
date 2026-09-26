import { getGame } from '$lib/constants/games';

export interface PageMeta {
	title: string;
	description: string;
	image?: string;
	url?: string;
	type?: 'website' | 'article';
	noindex?: boolean;
}

const baseUrl = 'https://www.parallel-arabic.com';
const defaultImage = `${baseUrl}/images/banner.png`;

const DIALECTS = ['egyptian-arabic', 'levantine', 'darija', 'fusha'] as const;
type DialectSlug = (typeof DIALECTS)[number];

/** "an Egyptian Arabic story" vs "a Levantine Arabic story". */
function indefiniteArticle(word: string): string {
	return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

export function formatDialectName(dialect: string): string {
	const dialectMap: Record<string, string> = {
		'egyptian-arabic': 'Egyptian Arabic',
		levantine: 'Levantine Arabic',
		darija: 'Moroccan Darija',
		fusha: 'Modern Standard Arabic'
	};
	return dialectMap[dialect] || dialect;
}

/**
 * Per-dialect copy. The four dialect landing pages previously shared one
 * description template, which made them near-duplicates of each other.
 */
const DIALECT_META: Record<DialectSlug, { title: string; description: string }> = {
	'egyptian-arabic': {
		title: 'Learn Egyptian Arabic Online - Lessons, Stories & Verb Conjugations | Parallel Arabic',
		description:
			'Learn Egyptian Arabic (Masri), the most widely understood dialect in the Arab world. Interactive lessons, graded stories, a searchable vocabulary explorer, full verb conjugation tables, and AI conversation practice.'
	},
	levantine: {
		title:
			'Learn Levantine Arabic Online - Syrian, Lebanese, Jordanian & Palestinian | Parallel Arabic',
		description:
			'Learn Levantine Arabic (Shami) as spoken in Syria, Lebanon, Jordan and Palestine. Greetings like marhaba and keefak, graded stories, vocabulary, and AI conversation practice in the Levantine dialect.'
	},
	darija: {
		title: 'Learn Moroccan Darija Online - Lessons, Stories & Vocabulary | Parallel Arabic',
		description:
			'Learn Moroccan Darija, the Arabic of Morocco. Interactive lessons, graded stories, a vocabulary explorer with Amazigh and French loanwords, and AI conversation practice in Darija.'
	},
	fusha: {
		title: 'Learn Fusha (Modern Standard Arabic) Online - Lessons & Vocabulary | Parallel Arabic',
		description:
			'Learn Fusha, Modern Standard Arabic: the written and formal Arabic used across news, books and the Quran. Interactive lessons, graded reading, vocabulary, and AI conversation practice in MSA.'
	}
};

/**
 * Paths that must never be indexed: private, per-user, transactional, or
 * legacy duplicates. Matched as prefixes.
 */
const NOINDEX_PREFIXES = [
	'/profile',
	'/review',
	'/history',
	'/leaderboard',
	'/map',
	'/self-study',
	'/challenge',
	'/login',
	'/signup',
	'/auth',
	'/password-reset',
	'/admin-panel',
	'/email-sender',
	'/generate-lesson',
	'/lessons-new',
	'/lessons/custom',
	'/videos-new',
	'/about-old',
	'/pricing/checkout',
	'/pricing/canceled',
	'/pricing/error',
	'/pricing/subscribed',
	'/learn/game/play'
];

export function isNoindexPath(pathname: string): boolean {
	const path = pathname.replace(/\/+$/, '') || '/';
	return NOINDEX_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

/** Meta for one of the games under /learn/game, from its entry in GAMES. */
function gamePageMeta(slug: string | undefined): PageMeta {
	const game = slug ? getGame(slug) : undefined;
	if (!game) {
		return {
			title: 'Arabic Games | Parallel Arabic',
			description: 'Free Arabic word games in four dialects.',
			url: `${baseUrl}/learn/game`,
			type: 'website'
		};
	}
	return {
		title: game.seo.title,
		description: game.seo.description,
		url: `${baseUrl}/learn/game/${game.slug}`,
		type: 'website'
	};
}

export function getPageMeta(page: string, data?: any): PageMeta {
	const dialectSlug = (data?.dialect ?? '') as string;
	const dialectName = formatDialectName(dialectSlug);

	const pages: Record<string, PageMeta> = {
		home: {
			title: 'Parallel Arabic - Learn Arabic Dialects with an AI Tutor',
			description:
				'Learn Egyptian Arabic, Levantine, Moroccan Darija, and Modern Standard Arabic through interactive lessons, graded stories, and spaced repetition. Practise speaking with an AI Arabic tutor.',
			url: baseUrl,
			type: 'website'
		},
		about: {
			title: 'About Parallel Arabic - Why We Teach Arabic Dialects',
			description:
				'Parallel Arabic teaches the Arabic people actually speak. Read why we built a platform around Egyptian, Levantine, Darija and Fusha side by side, and who makes it.',
			url: `${baseUrl}/about`,
			type: 'website'
		},
		tutor: {
			title: 'AI Arabic Tutor - Speak Arabic with AI | Parallel Arabic',
			description:
				'Practise Arabic conversation with an AI tutor that talks back. Speak Egyptian, Levantine, Moroccan Darija or Modern Standard Arabic, get corrections in real time, and build fluency without a scheduled lesson.',
			url: `${baseUrl}/tutor`,
			type: 'website'
		},
		keyboard: {
			title: 'Arabic Keyboard Online - Type Arabic with Diacritics | Parallel Arabic',
			description:
				'A free online Arabic keyboard. Type Arabic letters, add harakat and diacritics (fatha, kasra, damma, shadda, sukun, tanween), and copy the result anywhere. No download, works on phone and desktop.',
			url: `${baseUrl}/keyboard`,
			type: 'website'
		},
		'mobile-app': {
			title: 'Parallel Arabic for iPhone & iPad - Download on the App Store',
			description:
				'Get Parallel Arabic on your phone, free on the App Store. Lessons, stories, vocabulary review and the AI Arabic tutor, with progress that syncs with the web app. On Android, install the web app to your home screen.',
			url: `${baseUrl}/mobile-app`,
			type: 'website'
		},
		game: {
			title: 'Arabic Games - Free Vocabulary & Word Games | Parallel Arabic',
			description:
				'Arabic games in four dialects: word scramble, odd one out, spot the mistake, sentence scramble and a vocabulary quiz. Two free rounds of each.',
			url: `${baseUrl}/learn/game`,
			type: 'website'
		},
		'game-quiz': {
			title: 'Arabic Vocabulary Quiz - Multiple Choice, Listening & Speaking | Parallel Arabic',
			description:
				'An Arabic vocabulary quiz built fresh each time, in your dialect and at your level. Answer by reading, listening or speaking, in words or whole sentences.',
			url: `${baseUrl}/learn/game/quiz`,
			type: 'website'
		},
		'game-page': gamePageMeta(data?.slug),
		alphabet: {
			title: 'Interactive Arabic Alphabet - Learn All 28 Letters | Parallel Arabic',
			description:
				'An interactive Arabic alphabet. Hear every one of the 28 letters, see its isolated, initial, medial and final forms, learn the articulation groups, and practise recognising each letter.',
			url: `${baseUrl}/alphabet`,
			type: 'website'
		},
		'alphabet-learn': {
			title: 'Learn the Arabic Letters One by One | Parallel Arabic',
			description:
				'Work through the Arabic alphabet letter by letter with audio, connecting forms and pronunciation notes for each of the 28 letters.',
			url: `${baseUrl}/alphabet/learn`,
			type: 'website'
		},
		'alphabet-practice': {
			title: 'Arabic Alphabet Practice - Test Your Letter Recognition | Parallel Arabic',
			description:
				'Practise the Arabic alphabet: recognise letters by sight and sound, and drill the forms letters take at the start, middle and end of a word.',
			url: `${baseUrl}/alphabet/practice`,
			type: 'website'
		},
		'alphabet-practice-handwriting': {
			title: 'Arabic Handwriting Practice - Write the Letters | Parallel Arabic',
			description:
				'Practise writing Arabic letters by hand in the browser. Trace each of the 28 letters in every connecting form and check your stroke order.',
			url: `${baseUrl}/alphabet/practice/handwriting`,
			type: 'website'
		},
		'alphabet-practice-keyboard': {
			title: 'Arabic Typing Practice - Learn the Arabic Keyboard | Parallel Arabic',
			description:
				'Learn where the Arabic letters sit on the keyboard and build typing speed with guided drills.',
			url: `${baseUrl}/alphabet/practice/keyboard`,
			type: 'website'
		},
		lessons: {
			title: data?.dialect
				? `${dialectName} Lessons - Learn ${dialectName} Step by Step | Parallel Arabic`
				: 'Arabic Lessons - All Dialects | Parallel Arabic',
			description: data?.dialect
				? `Interactive ${dialectName} lessons covering vocabulary, grammar and conversation, ordered so each one builds on the last.`
				: 'Interactive Arabic lessons for every dialect. Vocabulary, grammar and conversation practice in Egyptian, Levantine, Moroccan Darija and Modern Standard Arabic.',
			url: `${baseUrl}/lessons${data?.dialect ? `/${data.dialect}` : ''}`,
			type: 'website'
		},
		lesson: {
			title: data?.title
				? `${data.title} - Arabic Lesson | Parallel Arabic`
				: 'Arabic Lesson | Parallel Arabic',
			description:
				data?.description ||
				'Learn Arabic through an interactive lesson with vocabulary, grammar notes and conversation practice.',
			url: data?.id ? `${baseUrl}/lessons/${data.id}` : `${baseUrl}/lessons`,
			type: 'article'
		},
		'lessons-structured': {
			title: data?.dialect
				? `${dialectName} Curriculum - Structured Course | Parallel Arabic`
				: 'Structured Arabic Curriculum - Beginner to Fluent | Parallel Arabic',
			description: data?.dialect
				? `A structured ${dialectName} curriculum that takes you from the alphabet to real conversation, module by module.`
				: 'A structured Arabic curriculum, module by module, from the alphabet to real conversation. Available for Egyptian, Levantine, Darija and Fusha.',
			url: `${baseUrl}/lessons/structured${data?.dialect ? `/${data.dialect}` : ''}`,
			type: 'website'
		},
		review: {
			title: 'Review Vocabulary - Arabic Spaced Repetition | Parallel Arabic',
			description:
				'Review and practise Arabic vocabulary with spaced repetition. Master words through active recall and improve your retention.',
			url: `${baseUrl}/review`,
			type: 'website',
			noindex: true
		},
		import: {
			title: 'Import Vocabulary - Add Words to Your Review Deck | Parallel Arabic',
			description:
				'Import Arabic vocabulary into your review deck from categories or a CSV/TXT upload.',
			url: `${baseUrl}/review/import`,
			type: 'website',
			noindex: true
		},
		stories: {
			title: data?.dialect
				? `${dialectName} Stories - Graded Reading Practice | Parallel Arabic`
				: 'Arabic Stories - Graded Reading with Translations | Parallel Arabic',
			description: data?.dialect
				? `Read short ${dialectName} stories with transliteration and English side by side. Build reading comprehension and pick up vocabulary in context.`
				: 'Read short Arabic stories with transliteration and English side by side, in Egyptian, Levantine, Moroccan Darija and Modern Standard Arabic. Every story comes with a vocabulary glossary.',
			url: `${baseUrl}/stories${data?.dialect ? `/${data.dialect}` : ''}`,
			type: 'website'
		},
		story: {
			title: data?.title
				? `${data.title} - Arabic Story | Parallel Arabic`
				: 'Arabic Story | Parallel Arabic',
			description:
				data?.description ||
				'Read an Arabic story with transliteration, English translation and a vocabulary glossary.',
			url: data?.id ? `${baseUrl}/stories/${data.id}` : `${baseUrl}/stories`,
			type: 'article'
		},
		generated_story: {
			title: data?.title ? `${data.title} | Parallel Arabic` : 'Arabic Story | Parallel Arabic',
			description:
				data?.description ||
				'Read this Arabic story with transliteration, English translation and a word-by-word glossary.',
			url: data?.id ? `${baseUrl}/generated_story/${data.id}` : `${baseUrl}/stories`,
			type: 'article'
		},
		vocabulary: {
			title: 'Arabic Vocabulary Explorer - Search Words by Dialect | Parallel Arabic',
			description:
				'Browse and search Arabic vocabulary across Egyptian, Levantine, Moroccan Darija and Modern Standard Arabic. Filter by category, hear each word, and save it to your review deck.',
			url: `${baseUrl}/vocabulary`,
			type: 'website'
		},
		sentences: {
			title: 'Arabic Sentence Practice - Build Sentences Word by Word | Parallel Arabic',
			description:
				'Practise Arabic sentences: reorder the words, type them out, and check yourself against the translation. Available in Egyptian, Levantine, Darija and Fusha.',
			url: `${baseUrl}/sentences`,
			type: 'website'
		},
		speak: {
			title: 'Arabic Speaking Practice - Say It and Get Scored | Parallel Arabic',
			description:
				'Practise speaking Arabic out loud. Record yourself, and get instant feedback on whether you were understood, in Egyptian, Levantine, Darija or Fusha.',
			url: `${baseUrl}/speak`,
			type: 'website'
		},
		videos: {
			title: 'Arabic Learning Videos - Listen to Native Speakers | Parallel Arabic',
			description:
				'Watch Arabic videos with transcripts and translations. Train your listening comprehension on real speech in Egyptian, Levantine, Darija and Fusha.',
			url: `${baseUrl}/videos`,
			type: 'website'
		},
		conjugations: {
			title: 'Arabic Verb Conjugation Practice - All Tenses | Parallel Arabic',
			description:
				'Practise Arabic verb conjugation across past, present, future and imperative. Drill any verb in Egyptian, Levantine, Moroccan Darija or Modern Standard Arabic.',
			url: `${baseUrl}/conjugations`,
			type: 'website'
		},
		'dialect-conjugations': {
			title: `${dialectName} Verb Conjugation Tables - Every Tense | Parallel Arabic`,
			description: `Full ${dialectName} conjugation tables for the most common verbs. Past, present, future and imperative, affirmative and negative, with transliteration and English for every form.`,
			url: `${baseUrl}/${dialectSlug}/conjugations`,
			type: 'website'
		},
		'conjugation-verb': {
			title: data?.arabic
				? `${data.arabic} (${data.transliteration}) - "${data.english}" in ${dialectName} | Conjugation Table`
				: `${dialectName} Verb Conjugation | Parallel Arabic`,
			description: data?.arabic
				? `How to conjugate ${data.arabic} (${data.transliteration}), "${data.english}", in ${dialectName}. Complete past, present, future and imperative tables, affirmative and negative, with transliteration and audio.`
				: `Complete ${dialectName} conjugation tables with transliteration and English for every form.`,
			url: data?.slug
				? `${baseUrl}/${dialectSlug}/conjugations/${data.slug}`
				: `${baseUrl}/${dialectSlug}/conjugations`,
			type: 'article'
		},
		comparison: {
			title: data?.a
				? `${formatDialectName(data.a)} vs ${formatDialectName(data.b)} - What's the Difference?`
				: 'Arabic Dialects Compared | Parallel Arabic',
			description: data?.a
				? `${formatDialectName(data.a)} and ${formatDialectName(
						data.b
					)} compared: pronunciation, verb prefixes, negation, question words, and the same everyday phrases side by side. Which one should you learn?`
				: 'How the Arabic dialects differ, and which one to learn.',
			url: data?.slug ? `${baseUrl}/${data.slug}` : baseUrl,
			type: 'article'
		},
		words: {
			title: `${dialectName} Words - Common Vocabulary with Examples | Parallel Arabic`,
			description: `Common ${dialectName} words with audio, transliteration and real example sentences taken from graded stories, so you see each word in context rather than on a flashcard.`,
			url: `${baseUrl}/${dialectSlug}/word`,
			type: 'website'
		},
		word: {
			title: data?.arabic
				? `${data.arabic} - "${data.english}" in ${dialectName} | Meaning, Audio & Examples`
				: `${dialectName} Words | Parallel Arabic`,
			description: data?.arabic
				? `${data.arabic} (${data.transliteration}) means "${data.english}" in ${dialectName}. Hear it pronounced and read example sentences taken from real stories.`
				: `Common ${dialectName} words with audio and examples.`,
			url: data?.slug
				? `${baseUrl}/${dialectSlug}/word/${data.slug}`
				: `${baseUrl}/${dialectSlug}/word`,
			type: 'article'
		},
		'vocabulary-hub': {
			title: 'Egyptian Arabic Vocabulary - Word Lists by Topic with Audio | Parallel Arabic',
			description:
				'Egyptian Arabic vocabulary grouped by topic: numbers, food, family, colors, time and more. Every word with Arabic script, tashkeel, transliteration, franco spelling and real example sentences. Free practice on every list.',
			url: `${baseUrl}/egyptian-arabic/vocabulary`,
			type: 'website'
		},
		'vocabulary-topic': {
			title: data?.label
				? data.slug === 'most-common'
					? `The ${Number(
							data.count
						).toLocaleString()} Most Common Egyptian Arabic Words | Parallel Arabic`
					: `Egyptian Arabic ${data.label} - ${data.count} Words with Audio | Parallel Arabic`
				: 'Egyptian Arabic Vocabulary | Parallel Arabic',
			description: data?.label
				? `${data.count} Egyptian Arabic words for ${String(
						data.label
					).toLowerCase()}, ordered by how often they come up. Arabic script with tashkeel, how to say each one, the franco spelling, and real example sentences. Free speaking and multiple-choice practice.`
				: 'Egyptian Arabic vocabulary by topic, with audio and examples.',
			url: data?.slug
				? `${baseUrl}/egyptian-arabic/vocabulary/${data.slug}`
				: `${baseUrl}/egyptian-arabic/vocabulary`,
			type: 'article'
		},
		pronunciation: {
			title: 'Egyptian Arabic Pronunciation - How Masri Actually Sounds | Parallel Arabic',
			description:
				'The six sound changes that separate Egyptian Arabic from Modern Standard Arabic: ج as a hard g, ق as a glottal stop, the "th" letters, ع and ح, the emphatic letters and the b- prefix. With audio and free speaking practice.',
			url: `${baseUrl}/egyptian-arabic/pronunciation`,
			type: 'article'
		},
		beginners: {
			title: 'Egyptian Arabic for Beginners - Where to Start and in What Order',
			description:
				'A step-by-step path for learning Egyptian Arabic from scratch: the alphabet, the sounds Egyptian changes, the first hundred words, whole phrases, the present tense, then speaking. Each step links to a free page that teaches it.',
			url: `${baseUrl}/egyptian-arabic/beginners`,
			type: 'article'
		},
		phrases: {
			title: `${dialectName} Phrases - How to Say the Everyday Things | Parallel Arabic`,
			description: `A ${dialectName} phrasebook: hello, how are you, thank you, happy birthday and the rest of the everyday phrases, each with Arabic script, tashkeel, transliteration and audio.`,
			url: `${baseUrl}/${dialectSlug}/phrases`,
			type: 'website'
		},
		phrase: {
			title: data?.arabic
				? `How to Say "${data.english}" in ${dialectName} - ${data.arabic} (${data.transliteration})`
				: `${dialectName} Phrases | Parallel Arabic`,
			description: data?.arabic
				? `"${data.english}" in ${dialectName} is ${data.arabic} (${data.transliteration}). Hear it pronounced, see the forms for a man, a woman and a group, how people reply, and example sentences.`
				: `How to say the everyday phrases in ${dialectName}.`,
			url: data?.slug
				? `${baseUrl}/${dialectSlug}/phrases/${data.slug}`
				: `${baseUrl}/${dialectSlug}/phrases`,
			type: 'article'
		},
		'dialect-vocab': {
			title: data?.section
				? `${dialectName} Vocabulary: ${data.section} | Parallel Arabic`
				: `${dialectName} Vocabulary Lists by Topic | Parallel Arabic`,
			description: data?.section
				? `${dialectName} words for ${data.section}, with transliteration, English and audio. Learn them, then save them to your review deck.`
				: `${dialectName} vocabulary organised by topic: verbs, food, family, travel and more. Every word with transliteration, English and audio.`,
			url: `${baseUrl}/${dialectSlug}/vocab${data?.sectionPath ? `/${data.sectionPath}` : ''}`,
			type: 'website'
		},
		'dialect-write': {
			title: data?.section
				? `Write in ${dialectName}: ${data.section} | Parallel Arabic`
				: `${dialectName} Writing Practice | Parallel Arabic`,
			description: data?.section
				? `Practise writing ${dialectName} on the topic of ${data.section}. Type the Arabic, check it against the answer, and build spelling accuracy.`
				: `Practise writing ${dialectName} by topic. Type the Arabic from the English prompt and check your spelling.`,
			url: `${baseUrl}/${dialectSlug}/write${data?.sectionPath ? `/${data.sectionPath}` : ''}`,
			type: 'website'
		},
		dialect: {
			title:
				DIALECT_META[dialectSlug as DialectSlug]?.title ??
				`Learn ${dialectName} Online | Parallel Arabic`,
			description:
				DIALECT_META[dialectSlug as DialectSlug]?.description ??
				`Learn ${dialectName} with interactive lessons, graded stories, a vocabulary explorer and AI conversation practice.`,
			url: `${baseUrl}/${dialectSlug}`,
			type: 'website'
		},
		learn: {
			title: 'Learn Arabic - Lessons, Alphabet and Vocabulary | Parallel Arabic',
			description:
				'Everything for learning Arabic in one place: the alphabet, structured lessons, vocabulary by topic, and games. Pick your dialect and start.',
			url: `${baseUrl}/learn`,
			type: 'website'
		},
		practice: {
			title: 'Practise Arabic - Reading, Writing, Speaking and Review | Parallel Arabic',
			description:
				'Practise the Arabic you have learned: graded stories, sentence building, speaking drills and spaced-repetition review.',
			url: `${baseUrl}/practice`,
			type: 'website'
		},
		explore: {
			title: 'Explore Arabic - Videos, Stories and the AI Tutor | Parallel Arabic',
			description:
				'Explore Arabic beyond the lesson plan: native-speaker videos, generated stories on any topic, and open conversation with the AI tutor.',
			url: `${baseUrl}/explore`,
			type: 'website'
		},
		'anki-decks': {
			title: 'Free Arabic Anki Decks - Alphabet & Vocabulary Downloads | Parallel Arabic',
			description:
				'Download free Arabic Anki decks: the Arabic alphabet, and vocabulary decks for Egyptian, Levantine, Moroccan Darija and Modern Standard Arabic. Export your own saved words too.',
			url: `${baseUrl}/anki-decks`,
			type: 'website'
		},
		faq: {
			title: 'Frequently Asked Questions - Parallel Arabic',
			description:
				'Answers to common questions about Parallel Arabic: which dialect to learn, how the platform works, subscription details, and study tips.',
			url: `${baseUrl}/faq`,
			type: 'website'
		},
		support: {
			title: 'Support - Get Help with Parallel Arabic',
			description:
				'Get help with your Parallel Arabic account, subscription, or a problem with the app.',
			url: `${baseUrl}/support`,
			type: 'website'
		},
		pricing: {
			title: 'Pricing - Parallel Arabic Subscription Plans',
			description:
				'Parallel Arabic pricing. Start free, then unlock unlimited lessons, stories, audio and the AI tutor across every dialect.',
			url: `${baseUrl}/pricing`,
			type: 'website'
		},
		privacy: {
			title: 'Privacy Policy - Parallel Arabic',
			description: 'How Parallel Arabic collects, uses and protects your data.',
			url: `${baseUrl}/privacy`,
			type: 'website'
		},
		blog: {
			title: 'Blog | Parallel Arabic',
			description:
				'Notes on learning Arabic: pronunciation, dialects, and the small things that make Egyptian Arabic click.',
			url: `${baseUrl}/blog`,
			type: 'website'
		},
		blogPost: {
			title: data?.title ? `${data.title} | Parallel Arabic` : 'Blog | Parallel Arabic',
			description: data?.description || 'Notes on learning Arabic from Parallel Arabic.',
			url: data?.url || `${baseUrl}/blog`,
			type: 'article'
		}
	};

	const meta = pages[page] || {
		title: 'Parallel Arabic - Learn Arabic Dialects with an AI Tutor',
		description:
			'Master Arabic dialects through interactive lessons, graded stories, and vocabulary practice.',
		url: baseUrl,
		type: 'website'
	};

	return {
		...meta,
		image: meta.image || defaultImage
	};
}

/**
 * Map a pathname to a `getPageMeta` key plus the data that key needs.
 * Returns null when no key matches, so the caller can fall back to a
 * self-referencing canonical instead of pointing at the homepage.
 */
export function resolvePageKey(
	pathname: string
): { key: string; data: Record<string, unknown> } | null {
	const path = pathname.replace(/\/+$/, '') || '/';
	const parts = path.split('/').filter(Boolean);
	const dialect = parts.find((p) => (DIALECTS as readonly string[]).includes(p));

	if (path === '/') return { key: 'home', data: {} };

	// Dialect-scoped routes: /{dialect}, /{dialect}/conjugations[/verb], /{dialect}/vocab[/section], /{dialect}/write[/section]
	if (dialect && parts[0] === dialect) {
		if (parts.length === 1) return { key: 'dialect', data: { dialect } };
		if (parts[1] === 'conjugations') {
			return parts.length === 2
				? { key: 'dialect-conjugations', data: { dialect } }
				: { key: 'conjugation-verb', data: { dialect, slug: parts[2] } };
		}
		// Vocabulary topics, pronunciation and the beginner path are Egyptian-only
		// for now, and their copy names Egyptian explicitly. Matching them for
		// every dialect would give a future /levantine/vocabulary the wrong title.
		if (dialect === 'egyptian-arabic') {
			if (parts[1] === 'vocabulary') {
				return parts.length === 2
					? { key: 'vocabulary-hub', data: { dialect } }
					: { key: 'vocabulary-topic', data: { dialect, slug: parts[2] } };
			}
			if (parts[1] === 'pronunciation' && parts.length === 2) {
				return { key: 'pronunciation', data: { dialect } };
			}
			if (parts[1] === 'beginners' && parts.length === 2) {
				return { key: 'beginners', data: { dialect } };
			}
		}
		if (parts[1] === 'word') {
			return parts.length === 2
				? { key: 'words', data: { dialect } }
				: { key: 'word', data: { dialect, slug: parts[2] } };
		}
		if (parts[1] === 'phrases') {
			return parts.length === 2
				? { key: 'phrases', data: { dialect } }
				: { key: 'phrase', data: { dialect, slug: parts[2] } };
		}
		if (parts[1] === 'vocab' || parts[1] === 'write') {
			const key = parts[1] === 'vocab' ? 'dialect-vocab' : 'dialect-write';
			return {
				key,
				data: { dialect, sectionPath: parts[2], section: parts[2] ? unslug(parts[2]) : undefined }
			};
		}
		if (parts[1] === 'stories') {
			return parts.length === 2
				? { key: 'stories', data: { dialect } }
				: { key: 'story', data: { dialect, id: parts[2] } };
		}
	}

	// /<dialect>-vs-<dialect> comparison pages
	if (parts.length === 1 && /-vs-/.test(parts[0])) {
		const [a, b] = parts[0].split('-vs-');
		if (
			(DIALECTS as readonly string[]).includes(a) &&
			(DIALECTS as readonly string[]).includes(b)
		) {
			return { key: 'comparison', data: { a, b, slug: parts[0] } };
		}
	}

	if (path === '/lessons') return { key: 'lessons', data: {} };
	if (path === '/lessons/structured') return { key: 'lessons-structured', data: {} };
	if (parts[0] === 'lessons' && parts[1] === 'structured') {
		return { key: 'lessons-structured', data: { dialect: parts[2] } };
	}
	if (parts[0] === 'lessons' && parts.length === 2)
		return { key: 'lesson', data: { id: parts[1] } };

	if (path === '/stories') return { key: 'stories', data: {} };
	if (parts[0] === 'stories' && parts.length === 2) return { key: 'story', data: { id: parts[1] } };
	if (parts[0] === 'generated_story') return { key: 'generated_story', data: { id: parts[1] } };

	if (path === '/review/import') return { key: 'import', data: {} };
	if (parts[0] === 'review') return { key: 'review', data: {} };

	if (path === '/alphabet') return { key: 'alphabet', data: {} };
	if (path === '/alphabet/learn') return { key: 'alphabet-learn', data: {} };
	if (path === '/alphabet/practice') return { key: 'alphabet-practice', data: {} };
	if (path === '/alphabet/practice/handwriting')
		return { key: 'alphabet-practice-handwriting', data: {} };
	if (path === '/alphabet/practice/keyboard')
		return { key: 'alphabet-practice-keyboard', data: {} };

	if (parts[0] === 'learn' && parts[1] === 'game') {
		if (parts.length === 2) return { key: 'game', data: {} };
		if (parts.length === 3 && parts[2] === 'quiz') return { key: 'game-quiz', data: {} };
		if (parts.length === 3 && getGame(parts[2]))
			return { key: 'game-page', data: { slug: parts[2], gameName: getGame(parts[2])!.name } };
		// /learn/game/play stays unmapped; it is noindex via NOINDEX_PREFIXES.
		return null;
	}
	if (path === '/blog') return { key: 'blog', data: {} };
	if (parts[0] === 'blog') return { key: 'blogPost', data: {} };

	const simple: Record<string, string> = {
		'/tutor': 'tutor',
		'/keyboard': 'keyboard',
		'/mobile-app': 'mobile-app',
		'/vocabulary': 'vocabulary',
		'/sentences': 'sentences',
		'/speak': 'speak',
		'/videos': 'videos',
		'/conjugations': 'conjugations',
		'/learn': 'learn',
		'/practice': 'practice',
		'/explore': 'explore',
		'/anki-decks': 'anki-decks',
		'/about': 'about',
		'/faq': 'faq',
		'/support': 'support',
		'/pricing': 'pricing',
		'/privacy': 'privacy'
	};
	if (simple[path]) return { key: simple[path], data: {} };

	return null;
}

function unslug(slug: string): string {
	return slug.replace(/-/g, ' ');
}

/**
 * Flatten the shapes route `load` functions return (`{ lesson }`, `{ storyData }`,
 * `{ blogPost }`, …) into the flat `{ title, description, id }` that `getPageMeta`
 * expects. Lives here rather than in the layout so it can be unit-tested.
 */
export function deriveRouteData(key: string, data: any): Record<string, unknown> {
	if (!data) return {};

	// Any route that returns `faqs` gets FAQPage markup, so the field has to
	// survive this function. This used to be a hardcoded list of three keys,
	// which silently dropped faqs from any route added later.
	const shared = Array.isArray(data.faqs) && data.faqs.length ? { faqs: data.faqs } : {};

	if (key === 'lesson' && data.lesson) {
		return {
			...shared,
			title: data.lesson.title || data.lesson.title_arabic,
			description: data.lesson.description,
			id: data.lesson.id,
			level: data.lesson.level,
			dialect: data.lesson.dialect
		};
	}

	if (key === 'vocabulary-topic' && data.topic) {
		return {
			...shared,
			// The whole topic goes through so the DefinedTermSet can list its terms.
			topic: data.topic,
			slug: data.topic.slug,
			label: data.topic.label,
			count: data.topic.words?.length ?? 0
		};
	}

	if (key === 'story' && data.story && !Array.isArray(data.story)) {
		return {
			...shared,
			title: data.story.title,
			description: data.story.description,
			id: data.story.id
		};
	}

	if (key === 'generated_story' && data.storyData) {
		const storyBody = data.storyData.story_body;
		const englishTitle = storyBody?.title?.english || '';
		const arabicTitle = storyBody?.title?.arabic || '';
		const dialectName = formatDialectName(data.storyData.dialect);
		// difficulty is a CEFR level ('a1', 'b2'); render it as ", CEFR A1".
		const level = data.storyData.difficulty
			? `, CEFR ${String(data.storyData.difficulty).toUpperCase()}`
			: '';
		const sentenceCount = storyBody?.sentences?.length || 0;

		if (!englishTitle) return { id: data.storyData.id, dialect: data.storyData.dialect };

		return {
			...shared,
			id: data.storyData.id,
			dialect: data.storyData.dialect,
			hasPaywalledSection: true,
			title: `${englishTitle} (${arabicTitle}) - ${dialectName} Story with Translation`,
			description: `Read "${englishTitle}" (${arabicTitle}), ${indefiniteArticle(
				dialectName
			)} ${dialectName} story in ${sentenceCount} sentences${level}. Arabic, transliteration and English side by side, with a full vocabulary glossary.`
		};
	}

	if (key === 'blogPost' && data.blogPost) {
		return {
			...shared,
			title: data.blogPost.title,
			description: data.blogPost.description,
			url: data.blogPost.url,
			date: data.blogPost.date
		};
	}

	if (key === 'word' && data.word) {
		return {
			...shared,
			slug: data.word.slug,
			english: data.word.english,
			arabic: data.word.arabic,
			transliteration: data.word.transliteration || data.word.franco,
			category: data.word.category
		};
	}

	if (key === 'phrase' && data.phrase) {
		return {
			...shared,
			slug: data.phrase.slug,
			english: data.phrase.english,
			arabic: data.phrase.arabicPlain || data.phrase.arabic,
			transliteration: data.phrase.transliteration,
			literal: data.phrase.literal,
			usage: data.phrase.usage
		};
	}

	if (key === 'conjugation-verb' && data.verb) {
		return {
			...shared,
			arabic: data.verb.arabic,
			transliteration: data.verb.transliteration,
			english: data.verb.english,
			slug: data.verb.slug
		};
	}

	return shared;
}

/**
 * Single entry point for the root layout.
 *
 * Resolution order:
 *   1. `data.seo` returned by a route's `load` (richest, per-page).
 *   2. A key matched from the pathname.
 *   3. A safe fallback that canonicalises to the current path — never the homepage.
 */
export function resolvePageMeta(pathname: string, data?: any): PageMeta {
	const path = pathname.replace(/\/+$/, '') || '/';
	const selfUrl = `${baseUrl}${path === '/' ? '' : path}`;
	const forceNoindex = isNoindexPath(path);

	if (data?.seo?.title) {
		return {
			type: 'website',
			...data.seo,
			url: data.seo.url || selfUrl,
			image: data.seo.image || defaultImage,
			noindex: data.seo.noindex || forceNoindex
		};
	}

	const match = resolvePageKey(path);
	if (match) {
		const meta = getPageMeta(match.key, {
			...match.data,
			...deriveRouteData(match.key, data)
		});
		return {
			...meta,
			// Always self-canonicalise. Keyed URLs are correct for the canonical
			// page of a key, but /alphabet/practice must not canonicalise to
			// /alphabet/learn, so prefer the real path when they disagree.
			url: meta.url && normalise(meta.url) === path ? meta.url : selfUrl,
			noindex: meta.noindex || forceNoindex
		};
	}

	const fallback = getPageMeta('__unmapped__');
	return { ...fallback, url: selfUrl, noindex: forceNoindex };
}

function normalise(url: string): string {
	return url.replace(baseUrl, '').replace(/\/+$/, '') || '/';
}

/**
 * Structured-data counterpart to `resolvePageMeta`, resolved from the same path.
 */
export function resolveStructuredData(pathname: string, data?: any) {
	const path = pathname.replace(/\/+$/, '') || '/';
	const match = resolvePageKey(path);
	if (!match) return generateStructuredData('__unmapped__');
	return generateStructuredData(match.key, {
		...match.data,
		...deriveRouteData(match.key, data)
	});
}

export function generateStructuredData(page: string, data?: any) {
	const baseStructuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Parallel Arabic',
		description:
			'Learn Arabic dialects through interactive lessons, stories, and vocabulary practice',
		url: baseUrl,
		applicationCategory: 'EducationalApplication',
		operatingSystem: 'Web',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		},
		featureList: [
			'Interactive Arabic lessons',
			'Vocabulary spaced repetition',
			'Arabic stories',
			'AI conversation tutor',
			'Multiple dialects support'
		],
		browserRequirements: 'Requires JavaScript. Requires HTML5.',
		softwareVersion: '1.0'
	};

	if (page === 'lesson' && data?.title) {
		return {
			'@context': 'https://schema.org',
			'@type': 'Course',
			name: data.title,
			description: data.description || 'Arabic lesson',
			provider: {
				'@type': 'Organization',
				name: 'Parallel Arabic',
				url: baseUrl
			},
			educationalLevel: data.level || 'Beginner',
			inLanguage: 'ar'
		};
	}

	if ((page === 'story' || page === 'generated_story') && data?.title) {
		const article: Record<string, unknown> = {
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: data.title,
			description: data.description || 'Arabic story',
			author: {
				'@type': 'Organization',
				name: 'Parallel Arabic'
			},
			publisher: {
				'@type': 'Organization',
				name: 'Parallel Arabic',
				url: baseUrl
			},
			inLanguage: 'ar'
		};

		// The story text itself is free to read; audio, the quiz and progress
		// tracking are subscriber-only. Declaring that explicitly is what keeps
		// Google from reading the gated sections as cloaked content.
		if (data.hasPaywalledSection) {
			article.isAccessibleForFree = true;
			article.hasPart = [
				{
					'@type': 'WebPageElement',
					isAccessibleForFree: false,
					cssSelector: '.subscriber-only'
				}
			];
		}

		return article;
	}

	// Any page that supplies faqs gets FAQPage markup.
	if (Array.isArray(data?.faqs) && data.faqs.length) {
		return {
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: data.faqs.map((faq: { question: string; answer: string }) => ({
				'@type': 'Question',
				name: faq.question,
				acceptedAnswer: { '@type': 'Answer', text: faq.answer }
			}))
		};
	}

	// A topic page is a list of terms, so it gets the set rather than a term.
	if (page === 'vocabulary-topic' && data?.topic) {
		const topic = data.topic as {
			slug: string;
			label: string;
			words: { arabic: string; transliteration: string; english: string }[];
		};
		return {
			'@context': 'https://schema.org',
			'@type': 'DefinedTermSet',
			name: `Egyptian Arabic ${topic.label}`,
			url: `${baseUrl}/egyptian-arabic/vocabulary/${topic.slug}`,
			inLanguage: 'ar',
			hasDefinedTerm: topic.words.slice(0, 50).map((word) => ({
				'@type': 'DefinedTerm',
				name: word.arabic,
				alternateName: word.transliteration,
				description: word.english,
				inLanguage: 'ar'
			}))
		};
	}

	if (page === 'word' && data?.arabic) {
		return {
			'@context': 'https://schema.org',
			'@type': 'DefinedTerm',
			name: data.arabic,
			alternateName: data.transliteration,
			description: `"${data.english}" in ${formatDialectName(data.dialect ?? '')}.`,
			inDefinedTermSet: {
				'@type': 'DefinedTermSet',
				name: `${formatDialectName(data.dialect ?? '')} Vocabulary`,
				url: `${baseUrl}/${data.dialect}/word`
			},
			inLanguage: 'ar'
		};
	}

	if (page === 'phrase' && data?.arabic) {
		return {
			'@context': 'https://schema.org',
			'@type': 'DefinedTerm',
			name: data.arabic,
			alternateName: data.transliteration,
			description: `"${data.english}" in ${formatDialectName(data.dialect ?? '')}. ${
				data.usage ?? ''
			}`.trim(),
			inDefinedTermSet: {
				'@type': 'DefinedTermSet',
				name: `${formatDialectName(data.dialect ?? '')} Phrases`,
				url: `${baseUrl}/${data.dialect}/phrases`
			},
			inLanguage: 'ar'
		};
	}

	if (page === 'conjugation-verb' && data?.arabic) {
		return {
			'@context': 'https://schema.org',
			'@type': 'DefinedTerm',
			name: data.arabic,
			alternateName: data.transliteration,
			description: `"${data.english}" in ${formatDialectName(
				data.dialect ?? ''
			)}, with full conjugation tables.`,
			inDefinedTermSet: {
				'@type': 'DefinedTermSet',
				name: `${formatDialectName(data.dialect ?? '')} Verbs`,
				url: `${baseUrl}/${data.dialect}/conjugations`
			},
			inLanguage: 'ar'
		};
	}

	if (page === 'blogPost' && data?.title) {
		return {
			'@context': 'https://schema.org',
			'@type': 'BlogPosting',
			headline: data.title,
			description: data.description || '',
			datePublished: data.date,
			dateModified: data.date,
			author: {
				'@type': 'Person',
				name: 'Sherif Elmetwally'
			},
			publisher: {
				'@type': 'Organization',
				name: 'Parallel Arabic',
				url: baseUrl,
				logo: {
					'@type': 'ImageObject',
					url: defaultImage
				}
			},
			mainEntityOfPage: data.url || `${baseUrl}/blog`,
			image: defaultImage,
			inLanguage: 'en'
		};
	}

	return baseStructuredData;
}

/**
 * Emitted once on every page alongside the page-specific graph.
 */
export function siteStructuredData() {
	return [
		{
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: 'Parallel Arabic',
			url: baseUrl,
			logo: defaultImage,
			founder: { '@type': 'Person', name: 'Sherif Elmetwally' }
		},
		{
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: 'Parallel Arabic',
			url: baseUrl,
			potentialAction: {
				'@type': 'SearchAction',
				target: {
					'@type': 'EntryPoint',
					urlTemplate: `${baseUrl}/vocabulary?search={search_term_string}`
				},
				'query-input': 'required name=search_term_string'
			}
		}
	];
}

/**
 * Breadcrumb trail for a path, or null for pages shallow enough not to need one.
 *
 * `breadcrumbStructuredData` has existed since the SEO work started but nothing
 * ever called it, so no page emitted BreadcrumbList. This resolves the trail
 * from the path so the layout can emit it everywhere at once.
 */
export function resolveBreadcrumbs(pathname: string, data?: any) {
	const path = pathname.replace(/\/+$/, '') || '/';
	const parts = path.split('/').filter(Boolean);
	if (parts.length < 2) return null;
	if (isNoindexPath(path)) return null;

	const trail: { name: string; path: string }[] = [{ name: 'Home', path: '/' }];

	const dialect = (DIALECTS as readonly string[]).includes(parts[0]) ? parts[0] : null;
	if (dialect) {
		trail.push({ name: formatDialectName(dialect), path: `/${dialect}` });
	} else {
		trail.push({ name: titleCase(parts[0]), path: `/${parts[0]}` });
	}

	for (let i = 1; i < parts.length; i++) {
		const segment = parts[i];
		const isLast = i === parts.length - 1;
		// The leaf is named after the thing itself where the page knows it.
		const name = isLast ? leafName(segment, data) : titleCase(segment);
		trail.push({ name, path: `/${parts.slice(0, i + 1).join('/')}` });
	}

	return breadcrumbStructuredData(trail);
}

function titleCase(segment: string): string {
	return segment
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

function leafName(segment: string, data?: any): string {
	return (
		data?.gameName ||
		data?.topic?.label ||
		data?.word?.english ||
		data?.phrase?.english ||
		data?.verb?.english ||
		titleCase(segment)
	);
}

export function breadcrumbStructuredData(trail: { name: string; path: string }[]) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: trail.map((crumb, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: crumb.name,
			item: `${baseUrl}${crumb.path}`
		}))
	};
}
