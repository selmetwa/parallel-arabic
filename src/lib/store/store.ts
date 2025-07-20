import { writable } from 'svelte/store';

export const hue = writable('');
export const theme = writable('light');
export const currentDialect = writable(''); // 'egyptian-arabic', 'fusha', 'levantine', or ''

// Egyptian Arabic stores
export const egyptianSentencesInStore = writable([]);
export const egyptianSentenceIndexInStore = writable(0);
export const egyptianGeneratedStoryInStore = writable('');

// Fusha stores
export const fushaSentencesInStore = writable([]);
export const fushaSentenceIndexInStore = writable(0);
export const fushaGeneratedStoryInStore = writable('');

// Levantine stores
export const levantineSentencesInStore = writable([]);
export const levantineSentenceIndexInStore = writable(0);
export const levantineGeneratedStoryInStore = writable('');