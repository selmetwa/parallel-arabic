import { writable, get } from 'svelte/store';
import type { sentenceObjectItem } from '$lib/types';

type SentencesState = {
	sentences: sentenceObjectItem[];
	isGenerating: boolean;
};

export const backgroundSentencesStore = writable<SentencesState>({
	sentences: [],
	isGenerating: false
});

function filterValid(sentences: unknown[]): sentenceObjectItem[] {
	return sentences.filter(
		(s): s is sentenceObjectItem =>
			s !== null &&
			typeof s === 'object' &&
			typeof (s as sentenceObjectItem).arabic === 'string' &&
			typeof (s as sentenceObjectItem).english === 'string' &&
			typeof (s as sentenceObjectItem).transliteration === 'string' &&
			(s as sentenceObjectItem).arabic.trim() !== '' &&
			(s as sentenceObjectItem).english.trim() !== '' &&
			(s as sentenceObjectItem).transliteration.trim() !== ''
	);
}

export async function generateBackgroundSentences(
	dialect: string,
	proficiencyLevel: string | null
): Promise<void> {
	const current = get(backgroundSentencesStore);
	if (current.isGenerating || current.sentences.length > 0) return;

	backgroundSentencesStore.update((s) => ({ ...s, isGenerating: true }));

	try {
		const endpoint =
			dialect === 'egyptian-arabic'
				? '/api/generate-sentences-egyptian'
				: '/api/generate-sentences';

		const response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				option: (proficiencyLevel ?? 'A1').toLowerCase(),
				sentences: [],
				dialect,
				learningTopics: [],
				vocabularyWords: '',
				useReviewWordsOnly: false,
				reviewWordsSource: 'all',
				reviewWords: []
			})
		});

		if (!response.ok) throw new Error('Generation failed');

		const data = await response.json();
		const jsonBlob = data.message.message.content;
		const parsed = JSON.parse(jsonBlob);
		const sentences = filterValid(parsed.sentences ?? []);

		backgroundSentencesStore.set({ sentences, isGenerating: false });
	} catch {
		backgroundSentencesStore.update((s) => ({ ...s, isGenerating: false }));
	}
}
