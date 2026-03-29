import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { blogPostsBySlug } from '$lib/constants/blog/index';

export const load: PageServerLoad = async ({ params }) => {
  const post = blogPostsBySlug[params.slug];
  if (!post) {
    throw error(404, `Blog post "${params.slug}" not found.`);
  }
  return { post };
};
