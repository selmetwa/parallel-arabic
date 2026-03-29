import type { PageServerLoad } from './$types';
import { blogPosts } from '$lib/constants/blog/index';

export const load: PageServerLoad = async () => {
  return {
    posts: blogPosts.map(({ slug, title, description, publishedAt, tags, dialect, difficulty }) => ({
      slug,
      title,
      description,
      publishedAt,
      tags,
      dialect,
      difficulty,
    })),
  };
};
