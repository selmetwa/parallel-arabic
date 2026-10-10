import { blogPosts } from '$lib/constants/blog-posts';
import { dialectMatchItems } from '$lib/server/games/dialect-match-items';
import type { PageServerLoad } from './$types';

export const prerender = true;

/** The everyday words the post's table walks through, for the warm-up round. */
const WARM_UP = [
	'what',
	'why',
	'now',
	'i-want',
	'how-much',
	'this',
	'yes',
	'very',
	'like-this',
	'i-dont-know'
];

export const load: PageServerLoad = () => {
	const post = blogPosts.find((p) => p.slug === 'fusha-egyptian-levantine-darija')!;
	const items = dialectMatchItems();
	return {
		blogPost: {
			title: post.title,
			description: post.description,
			url: `https://www.parallel-arabic.com/blog/${post.slug}`,
			date: post.date
		},
		warmUp: items.filter((i) => WARM_UP.includes(i.id)),
		// Our own content (hand-written sets, Room Hunt recordings, the phrasebook).
		allItems: items
	};
};
