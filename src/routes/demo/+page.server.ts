import type { PageServerLoad } from './$types';
import { DEMOS } from '$lib/constants/demos';

const BASE_URL = 'https://www.parallel-arabic.com';

export const load: PageServerLoad = async () => {
	return {
		seo: {
			title: 'Parallel Arabic Demo Videos - Stories, Games and Lessons',
			description:
				'Short video demos of Parallel Arabic: read stories with English and transliteration, play Arabic word games, and take a lesson from the Egyptian Arabic course.',
			image: `${BASE_URL}${DEMOS[0].video.poster}`,
			url: `${BASE_URL}/demo`
		},
		structuredData: {
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			itemListElement: DEMOS.map((demo, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				url: `${BASE_URL}/demo/${demo.slug}`,
				name: demo.heading
			}))
		}
	};
};
