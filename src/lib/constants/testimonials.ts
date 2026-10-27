/**
 * What learners have said about Parallel Arabic, quoted as they wrote it.
 * The same quotes appear on /signup and /login. (One more, on /login, mentions
 * "your AI"; it's left out here to keep "AI" out of new copy.)
 */
export type TestimonialSegment = { t: string; b?: boolean };

export const TESTIMONIALS: TestimonialSegment[][] = [
	[
		{ t: 'After only a day, I love Parallel Arabic.', b: true },
		{
			t: ' As a language teacher and an absolute language nut who speaks seven other languages besides Arabic, I can tell how much thought went into this.'
		}
	],
	[{ t: 'This is great! As someone outgrowing Duolingo this is perfect.', b: true }],
	[
		{ t: "Have tried many of the 'apps' and " },
		{ t: 'this is the closest one to doing what I want!', b: true },
		{ t: ' Very useful and comprehensive — I love the interlinear format for the stories.' }
	],
	[
		{ t: 'I love it! This is something I have been ' },
		{ t: 'searching for ages', b: true },
		{ t: ' :) thank you so much' }
	],
	[
		{
			t: 'Wow this is perfect for what I need currently. The stories section in particular is a great idea as '
		},
		{ t: "I can't find any graded stories for practice.", b: true },
		{ t: ' Thank you so much for this :)' }
	],
	[
		{ t: 'Stories UI is really good!', b: true },
		{
			t: ' The large, readable font, easy switching of transliteration and English, and interactive click-to-define are all really excellent.'
		}
	],
	[
		{ t: 'I really like the website and find it very useful. For me ' },
		{ t: "it's better than a lot of other platforms", b: true },
		{ t: " — it's well thought out and has a lot of features." }
	],
	[
		{
			t: "I've been learning Egyptian Arabic with a teacher for a few months now and was looking for something to supplement my classes and practise with outside of lessons. I came across your platform after someone mentioned it on Reddit and honestly "
		},
		{ t: "it's exactly the sort of thing I was looking for", b: true },
		{
			t: ' - there is so much packed in and this has quickly become an invaluable resource'
		}
	]
];

/** Led with on paywalls, since it names a dialect. */
export const EGYPTIAN_TESTIMONIAL: TestimonialSegment[] = [
	{ t: "It's the best app I have found so far", b: true },
	{ t: ' in my journey to learn Egyptian Arabic' }
];
