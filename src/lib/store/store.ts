import { writable } from 'svelte/store';
export const hue = writable('');
export const theme = writable('light');
export const sentencesInStore = writable([]);
export const sentenceIndexInStore = writable(0);
export const verbToConjugateIndexInStore = writable(0);