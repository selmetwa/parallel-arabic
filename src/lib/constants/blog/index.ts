import { adjectiveOfTheVerb } from './adjective-of-the-verb';
import type { BlogPost } from '$lib/types/blog';

export const blogPosts: BlogPost[] = [
  adjectiveOfTheVerb,
];

export const blogPostsBySlug: Record<string, BlogPost> =
  Object.fromEntries(blogPosts.map(p => [p.slug, p]));
