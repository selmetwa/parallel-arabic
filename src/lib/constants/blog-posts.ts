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
		slug: 'how-to-learn-iraqi-arabic',
		title: 'How to learn Iraqi Arabic',
		description:
			'Why Baghdadi is the one to learn, the g and ch sounds that make Iraqi recognisable, aku and maku, the da- that means "right now", and the order to learn it all in, with a realistic timeline for each stage.',
		date: '2026-10-24',
		readingTime: '7 min read'
	},
	{
		slug: 'how-to-learn-gulf-arabic',
		title: 'How to learn Gulf Arabic (Khaleeji)',
		description:
			'Emirati, Kuwaiti, Qatari or Bahraini? Why the shared Gulf forms get you all four, the y that replaces j, abi, waayid and il-7een, and the order to learn Khaleeji in, with a realistic timeline for each stage.',
		date: '2026-10-24',
		readingTime: '7 min read'
	},
	{
		slug: 'how-to-learn-saudi-arabic',
		title: 'How to learn Saudi Arabic (Hijazi)',
		description:
			'Saudi Arabia has several dialects. Why Hijazi, the Arabic of Jeddah, Mecca and Medina, is the one to start with, what it shares with Egyptian, and the order to learn it in, with a realistic timeline for each stage.',
		date: '2026-10-24',
		readingTime: '7 min read'
	},
	{
		slug: 'how-to-learn-levantine-arabic',
		title: 'How to learn Levantine Arabic',
		description:
			'Which accent to pick, why the alphabet still comes first, the sounds and grammar that make Shami different from Egyptian, and the order to learn it in, with a realistic timeline for each stage.',
		date: '2026-10-22',
		readingTime: '8 min read'
	},
	{
		slug: 'how-to-learn-moroccan-arabic',
		title: 'How to learn Moroccan Arabic (Darija)',
		description:
			'Darija is the hardest major dialect to find material for and the most rewarding to speak in Morocco. What makes it different, the order to learn it in, and how to get listening practice when most Arabic media is Egyptian.',
		date: '2026-10-22',
		readingTime: '8 min read'
	},
	{
		slug: 'is-arabic-hard-to-learn',
		title: 'Is Arabic hard to learn? What is actually hard, and what isn\'t',
		description:
			'The script takes two weeks. The sounds take a month. What makes Arabic hard is that people speak one Arabic and write another. The genuinely difficult parts, the parts that only look difficult, and how to pick the right Arabic for your goal.',
		date: '2026-10-22',
		readingTime: '7 min read'
	},
	{
		slug: 'how-long-does-it-take-to-learn-arabic',
		title: 'How long does it take to learn Arabic?',
		description:
			'The US Foreign Service Institute puts Arabic at about 2,200 class hours for English speakers. What that number means for a learner with an hour a day, how long each milestone takes, and why picking a dialect changes the answer.',
		date: '2026-10-22',
		readingTime: '7 min read'
	},
	{
		slug: 'fusha-egyptian-levantine-darija',
		title: 'Fusha, Egyptian, Levantine, Darija: can you hear the difference?',
		description:
			'What separates the four Arabics people choose between, the handful of everyday words and sounds that give each one away, and two rounds of a game to find out whether you can already tell them apart.',
		date: '2026-10-10',
		readingTime: '7 min read'
	},
	{
		slug: 'how-arabic-letters-connect',
		title: 'How Arabic letters connect (and why words look different from the alphabet chart)',
		description:
			'Every letter has up to four shapes, several are told apart only by dots, and six never join forwards, which is why Arabic words have gaps in the middle. The three rules, with two games to practise them.',
		date: '2026-10-10',
		readingTime: '6 min read'
	},
	{
		slug: 'hello-in-levantine-arabic',
		title: 'How to say hello in Levantine Arabic',
		description:
			'Mar7aba, saba7 el khayr, ahlan wa sahlan, kifak: the greetings used from Beirut to Amman, the replies that go with them, and memory games to make them stick.',
		date: '2026-10-10',
		readingTime: '6 min read'
	},
	{
		slug: 'harakat-arabic-vowel-marks',
		title: 'Harakat: the Arabic vowel marks, explained by ear',
		description:
			'Fatha, kasra, damma, sukun, shadda and tanween: what each mark sounds like, why Arabic usually leaves them out, how to type them, and a listening game where only the vowels change.',
		date: '2026-10-10',
		readingTime: '6 min read'
	},
	{
		slug: 'ordering-food-in-arabic-3d',
		title: 'I built a 3D restaurant to practise ordering food in Arabic',
		description:
			'Room Hunt teaches the Arabic for things in a kitchen, a bathroom and a restaurant, four words at a time, then sits you down with a waiter who brings whatever you order. In Egyptian, Levantine, Darija and Fusha.',
		date: '2026-10-03',
		readingTime: '6 min read'
	},
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
		title: 'Egyptian Arabic alphabet: the 28 letters as Cairo says them',
		description:
			'The 28 letters, but with the sounds you will actually hear on the street in Cairo, where ج is a hard G, ق quietly disappears, and ث is almost never a "th".',
		date: '2026-06-17',
		readingTime: '8 min read'
	}
];
