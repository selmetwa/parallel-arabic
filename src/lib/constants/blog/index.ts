import { adjectiveOfTheVerb } from './adjective-of-the-verb';
import { lammaAdjectivePronouns } from './lamma-adjective-pronouns';
import type { BlogPost } from '$lib/types/blog';

export const blogPosts: BlogPost[] = [
  adjectiveOfTheVerb,
  lammaAdjectivePronouns,
];

export const blogPostsBySlug: Record<string, BlogPost> =
  Object.fromEntries(blogPosts.map(p => [p.slug, p]));
