import { sections } from '$lib/constants/sections';
import { fushaSections } from '$lib/constants/fusha-sections';
import { levantineSections } from '$lib/constants/levantine-sections';
import { darijaSections } from '$lib/constants/darija-sections';

export const prerender = true;

export const load = () => {
	return {
		dialects: [
			{
				key: 'egyptian-arabic',
				name: 'Egyptian Arabic',
				sections: sections.filter((s) => s.path !== 'all')
			},
			{
				key: 'fusha',
				name: 'Modern Standard Arabic',
				sections: fushaSections.filter((s) => s.path !== 'all')
			},
			{
				key: 'levantine',
				name: 'Levantine Arabic',
				sections: levantineSections.filter((s) => s.path !== 'all')
			},
			{
				key: 'darija',
				name: 'Moroccan Darija',
				sections: darijaSections.filter((s) => s.path !== 'all')
			}
		]
	};
};
