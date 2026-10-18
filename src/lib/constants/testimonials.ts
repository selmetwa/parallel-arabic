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
	]
];
