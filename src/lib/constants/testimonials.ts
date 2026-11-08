/**
 * What learners have said about Parallel Arabic, quoted as they wrote it.
 * The same quotes appear on /signup and /login. (One more, on /login, mentions
 * "your AI"; it's left out here to keep "AI" out of new copy.)
 */
export type TestimonialSegment = { t: string; b?: boolean };

export const TESTIMONIALS: TestimonialSegment[][] = [
	[
		{
			t: "I've been learning Egyptian Arabic with a teacher for a few months now and was looking for something to supplement my classes and practise with outside of lessons. I came across your platform after someone mentioned it on Reddit and honestly "
		},
		{ t: "it's exactly the sort of thing I was looking for", b: true },
		{
			t: ' - there is so much packed in and this has quickly become an invaluable resource'
		}
	],
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
		{ t: 'I love the parallel Arabic app so much!!', b: true },
		{ t: ' It’s been so helpful for my learning' }
	],
	[
		{
			t: 'Having tried at least a dozen different resources in the past two years to learn Moroccan Darija, I think '
		},
		{ t: 'yours is the top of the line, definitely my favorite!', b: true }
	],
	[
		{ t: 'Very few resources do a good job of teaching dialects at anything beyond ' },
		{ t: '"travel basics."', b: true }
	],
	[
		{ t: 'I absolutely love the feature in your app where you can compare the dialects! ' },
		{ t: 'That is TOTALLY BRILLIANT!!', b: true }
	],
	[
		{
			t: 'This is such a fantastic way to bring people along in their studies of the Arabic language!',
			b: true
		}
	]
];

/** Led with on paywalls, since it names a dialect. */
export const EGYPTIAN_TESTIMONIAL: TestimonialSegment[] = [
	{ t: "It's the best app I have found so far", b: true },
	{ t: ' in my journey to learn Egyptian Arabic' }
];
