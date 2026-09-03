import type { PageServerLoad } from './$types';
import { topicIndexFor } from '$lib/data/vocab/manifest';

// The topic data is static JSON in the repo, so this builds at deploy time.
export const prerender = true;

export const load: PageServerLoad = () => ({
	dialect: 'egyptian-arabic',
	topics: topicIndexFor('egyptian-arabic')
});
