import { blogPosts } from '$lib/constants/blog-posts';

export const prerender = true;

export function load() {
	const post = blogPosts.find((p) => p.slug === 'ordering-food-in-arabic-3d')!;
	return {
		blogPost: {
			title: post.title,
			description: post.description,
			url: `https://www.parallel-arabic.com/blog/${post.slug}`,
			date: post.date
		}
	};
}
