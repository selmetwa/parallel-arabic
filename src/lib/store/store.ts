import { writable } from 'svelte/store';

export const hue = writable('');
export const theme = writable('light');
export const currentDialect = writable('');
export const sidebarCollapsed = writable(false); // 'egyptian-arabic', 'fusha', 'levantine', 'darija', 'iraqi', 'khaleeji', or ''

// Tutor conversation persistence (kept in memory so the chat survives navigation)
export const tutorConversation = writable<any[]>([]);
export const tutorConversationId = writable<string | null>(null);
export const tutorSelectedDialect = writable<string | null>(null);

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

// Darija stores
export const darijaSentencesInStore = writable([]);
export const darijaSentenceIndexInStore = writable(0);
export const darijaGeneratedStoryInStore = writable('');

// Iraqi stores
export const iraqiSentencesInStore = writable([]);
export const iraqiSentenceIndexInStore = writable(0);
export const iraqiGeneratedStoryInStore = writable('');

// Khaleeji stores
export const khaleejiSentencesInStore = writable([]);
export const khaleejiSentenceIndexInStore = writable(0);
export const khaleejiGeneratedStoryInStore = writable('');