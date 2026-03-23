export type XpEventType = 'review_cycle' | 'review_correct' | 'sentence_correct' | 'story_complete' | 'lesson_complete' | 'game_correct' | 'challenge_bonus' | 'conjugation_correct';

export const XP_AWARDS: Record<XpEventType, number> = {
	review_cycle: 10,
	review_correct: 1,
	sentence_correct: 5,
	story_complete: 15,
	lesson_complete: 25,
	game_correct: 1,
	challenge_bonus: 10,
	conjugation_correct: 1
};

export const LEVEL_TIERS = [
	{ level: 1, title: 'Tourist', xpRequired: 0 },
	{ level: 2, title: 'Wanderer', xpRequired: 1000 },
	{ level: 3, title: 'Phrase Hunter', xpRequired: 3000 },
	{ level: 4, title: 'Bazaar Regular', xpRequired: 6000 },
	{ level: 5, title: 'Street Talker', xpRequired: 11000 },
	{ level: 6, title: 'Quarter Dweller', xpRequired: 18000 },
	{ level: 7, title: 'Storyteller', xpRequired: 28000 },	
	{ level: 8, title: 'City Insider', xpRequired: 42000 },
	{ level: 9, title: 'Dialect Speaker', xpRequired: 60000 },
	{ level: 10, title: 'Native Voice', xpRequired: 85000 }
];

export function getLevelForXp(xp: number): { level: number; title: string } {
	let current = LEVEL_TIERS[0];
	for (const tier of LEVEL_TIERS) {
		if (xp >= tier.xpRequired) {
			current = tier;
		} else {
			break;
		}
	}
	return current;
}

export function getProgressToNextLevel(xp: number): {
	current: number;
	required: number;
	percent: number;
	nextLevel: number | null;
} {
	const currentTier = getLevelForXp(xp);
	const currentTierIndex = LEVEL_TIERS.findIndex((t) => t.level === currentTier.level);
	const nextTierIndex = currentTierIndex + 1;

	if (nextTierIndex >= LEVEL_TIERS.length) {
		return { current: xp, required: xp, percent: 100, nextLevel: null };
	}

	const nextTier = LEVEL_TIERS[nextTierIndex];
	const xpInCurrentLevel = xp - currentTier.xpRequired;
	const xpNeededForNextLevel = nextTier.xpRequired - currentTier.xpRequired;
	const percent = Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100));

	return {
		current: xpInCurrentLevel,
		required: xpNeededForNextLevel,
		percent,
		nextLevel: nextTier.level
	};
}
