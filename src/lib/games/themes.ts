/**
 * Themes for the word games, mapped onto the `word` table's categories.
 *
 * Category slugs differ per dialect (`animals`, `animals_2`, `animals_5`), so each
 * theme lists its own per dialect. Where a dialect has two candidates, the one with
 * recorded audio wins. A theme missing for a dialect is simply not offered there —
 * Levantine has no house category.
 */

export const GAME_DIALECTS = ['egyptian-arabic', 'levantine', 'darija', 'fusha'] as const;
export type GameDialect = (typeof GAME_DIALECTS)[number];

export function isGameDialect(value: unknown): value is GameDialect {
	return (GAME_DIALECTS as readonly unknown[]).includes(value);
}

export const DIALECT_OPTIONS: { value: GameDialect; label: string; emoji: string }[] = [
	{ value: 'egyptian-arabic', label: 'Egyptian', emoji: '🇪🇬' },
	{ value: 'levantine', label: 'Levantine', emoji: '🇱🇧' },
	{ value: 'darija', label: 'Darija', emoji: '🇲🇦' },
	{ value: 'fusha', label: 'Fusha', emoji: '📖' }
];

export interface GameTheme {
	id: string;
	label: string;
	emoji: string;
	categories: Partial<Record<GameDialect, string>>;
}

export const GAME_THEMES: GameTheme[] = [
	{
		id: 'food',
		label: 'Food & drink',
		emoji: '🍎',
		categories: {
			'egyptian-arabic': 'food_and_drink',
			levantine: 'food_and_drink_2',
			darija: 'food_and_drink_5',
			fusha: 'food'
		}
	},
	{
		id: 'animals',
		label: 'Animals',
		emoji: '🐾',
		categories: {
			'egyptian-arabic': 'animals',
			levantine: 'animals_2',
			darija: 'animals_5',
			fusha: 'animals'
		}
	},
	{
		id: 'home',
		label: 'Home',
		emoji: '🏠',
		categories: {
			'egyptian-arabic': 'around_the_house',
			darija: 'around_the_house_4',
			fusha: 'vocabulary_from_around_the_house'
		}
	},
	{
		id: 'family',
		label: 'Family',
		emoji: '👪',
		categories: {
			'egyptian-arabic': 'family',
			levantine: 'family_2',
			darija: 'family_5',
			fusha: 'mankind_and_kinship'
		}
	},
	{
		id: 'clothes',
		label: 'Clothes',
		emoji: '👕',
		categories: {
			'egyptian-arabic': 'clothing_jewelry_and_accessories',
			levantine: 'clothing_jewelry_and_accessories_2',
			darija: 'clothing_jewelry_and_accessories_5',
			fusha: 'clothing'
		}
	},
	{
		id: 'travel',
		label: 'Getting around',
		emoji: '🚗',
		categories: {
			'egyptian-arabic': 'cars_and_other_transportation',
			levantine: 'cars_and_other_transportation_2',
			darija: 'cars_and_other_transportation_5',
			fusha: 'city_and_transportation'
		}
	},
	{
		id: 'nature',
		label: 'Weather & nature',
		emoji: '🌦️',
		categories: {
			'egyptian-arabic': 'weather',
			levantine: 'weather_2',
			darija: 'weather_5',
			fusha: 'nature__and__weather'
		}
	},
	{
		id: 'work',
		label: 'Work',
		emoji: '💼',
		categories: {
			'egyptian-arabic': 'work_and_professions',
			levantine: 'work_and_professions_2',
			darija: 'work_and_professions_4',
			fusha: 'work_and_money'
		}
	}
];

export function themesFor(dialect: GameDialect): GameTheme[] {
	return GAME_THEMES.filter((t) => t.categories[dialect]);
}

/**
 * The requested theme if the dialect has it, otherwise the dialect's first theme.
 * Food leads the list because it has recordings in every dialect but Fusha,
 * and Egyptian animals has none.
 */
export function resolveTheme(dialect: GameDialect, themeId: string | null | undefined): GameTheme {
	const available = themesFor(dialect);
	return available.find((t) => t.id === themeId) ?? available[0];
}

/**
 * Starting dialect for a game page: `?dialect=` if valid, then the learner's own
 * target dialect, then Egyptian. A target dialect the games don't cover yet
 * (Iraqi, Khaleeji) falls through to the default.
 */
export function initialDialect(
	param: string | null,
	targetDialect: string | null | undefined
): GameDialect {
	if (isGameDialect(param)) return param;
	if (isGameDialect(targetDialect)) return targetDialect;
	return 'egyptian-arabic';
}
