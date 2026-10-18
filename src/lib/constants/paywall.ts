/**
 * Where an in-app paywall opened from. It picks the top of the paywall popup
 * and is recorded with every paywall event (docs/conversion-premium-plan.md).
 */
export type PaywallSource =
	| 'lesson'
	| 'tutor'
	| 'story'
	| 'game'
	| 'vocab'
	| 'writing'
	| 'video'
	| 'alphabet'
	| 'anki'
	| 'audio'
	| 'other';

/** The headline for a source without a richer top of its own. */
export const PAYWALL_HEADLINES: Record<PaywallSource, string> = {
	lesson: 'Unlock every lesson on your path',
	tutor: 'Keep talking with your tutor',
	story: 'Read every story, with native audio',
	game: 'Play every game, as much as you like',
	vocab: 'Practise every word, in every dialect',
	writing: 'Unlock all writing practice',
	video: 'Learn from every video',
	alphabet: 'Learn every letter, with audio',
	anki: 'Download every deck',
	audio: 'Hear every word in a native voice',
	other: 'Unlock everything'
};

/** A locked lesson, for the lesson preview at the top of the popup. */
export interface PaywallLesson {
	title: string;
	description?: string;
	/** The lesson's first new words; the first two show, the rest blur. */
	words?: { arabic: string; transliteration: string; english: string }[];
}
