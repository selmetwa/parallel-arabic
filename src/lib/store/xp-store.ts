import { writable, derived } from 'svelte/store';
import { LEVEL_TIERS, getProgressToNextLevel } from '$lib/helpers/xp-levels';

export const userXp = writable<number>(0);
export const userLevel = writable<number>(1);

export const xpProgress = derived(userXp, ($xp) => getProgressToNextLevel($xp));

export const levelTitle = derived(
	userLevel,
	($level) => LEVEL_TIERS.find((t) => t.level === $level)?.title ?? 'Tourist'
);
