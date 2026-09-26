/** Levels for the Premium puzzle games, shared by the page and the endpoints. */
export const GAME_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type GameLevel = (typeof GAME_LEVELS)[number];

export const LEVEL_OPTIONS: { value: GameLevel; label: string }[] = [
	{ value: 'beginner', label: 'Beginner' },
	{ value: 'intermediate', label: 'Intermediate' },
	{ value: 'advanced', label: 'Advanced' }
];

/** The learner's CEFR level (a1…c2), if known, as a game level. */
export function levelFromProficiency(proficiency: string | null | undefined): GameLevel {
	const cefr = (proficiency ?? '').toLowerCase();
	if (cefr.startsWith('c')) return 'advanced';
	if (cefr.startsWith('b')) return 'intermediate';
	return 'beginner';
}
