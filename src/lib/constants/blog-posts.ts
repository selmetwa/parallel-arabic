// Blog post metadata. The index page and sitemap both read from here so they stay in
// sync. The article body itself lives in each post's `+page.svelte`.

export type BlogPost = {
	slug: string;
	title: string;
	description: string;
	date: string; // ISO date
	readingTime: string;
};

export const blogPosts: BlogPost[] = [
	{
		slug: 'learning-arabic-with-ai',
		title: 'Learning Arabic with AI: how the tutor actually works',
		description:
			'Every tutor message arrives as three lines — Arabic, transliteration, English — and every turn ends with a suggestion for what you could say next. Why all three, and what the conversation looks like without them.',
		date: '2026-09-25',
		readingTime: '9 min read'
	},
	{
		slug: 'how-many-egyptian-arabic-words',
		title: 'How many Egyptian Arabic words do you actually need?',
		description:
			'Running the numbers on a 2,404-word frequency list built from 29.3 million tokens of Egyptian: a hundred words cover almost half of everything said, and you cannot study a single one of them.',
		date: '2026-09-03',
		readingTime: '6 min read'
	},
	{
		slug: 'franco-arabic',
		title: 'Franco Arabic: why Egyptians write 3, 7 and 2 in text messages',
		description:
			'The digits are not slang. Arabic has sounds the Latin alphabet has no letters for, so people reached for the numbers that look like the Arabic letters — and kept doing it long after the phones stopped forcing them to.',
		date: '2026-09-03',
		readingTime: '7 min read'
	},
	{
		slug: 'arabic-games',
		title: 'Arabic games worth your time',
		description:
			"Why most Arabic word games don't survive contact with a cursive script and unwritten vowels, the four questions worth asking about any of them, and the handful that hold up.",
		date: '2026-09-02',
		readingTime: '7 min read'
	},
	{
		slug: 'writing-arabic-in-english',
		title: 'Writing Arabic in English',
		description:
			'How I built a phonetic Arabic keyboard that maps English keys to Arabic sounds, and the problems I had to solve to get there: a cursive script, throat letters, hamza, and diacritics.',
		date: '2026-06-19',
		readingTime: '12 min read'
	},
	{
		slug: 'egyptian-arabic-alphabet',
		title: 'The Arabic alphabet, the Egyptian way',
		description:
			'The 28 letters, but with the sounds you will actually hear on the street in Cairo, where ج is a hard G, ق quietly disappears, and ث is almost never a "th".',
		date: '2026-06-17',
		readingTime: '8 min read'
	}
];
