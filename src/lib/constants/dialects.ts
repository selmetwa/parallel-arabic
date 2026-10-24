import type { Dialect } from '$lib/types/index';

/**
 * Every dialect the app knows about. Validators accept all of them; pickers
 * offer only the `selectable` ones, so a dialect can be built out (content,
 * voices, lessons) before learners can choose it.
 */
export interface DialectInfo {
	key: Dialect;
	name: string;
	shortName: string;
	flag: string;
	/** Google speech-to-text locale. */
	sttLocale: string;
	selectable: boolean;
}

export const DIALECTS: DialectInfo[] = [
	{ key: 'egyptian-arabic', name: 'Egyptian Arabic', shortName: 'Egyptian', flag: '🇪🇬', sttLocale: 'ar-EG', selectable: true },
	{ key: 'levantine', name: 'Levantine Arabic', shortName: 'Levantine', flag: '🇱🇧', sttLocale: 'ar-LB', selectable: true },
	{ key: 'darija', name: 'Moroccan Darija', shortName: 'Darija', flag: '🇲🇦', sttLocale: 'ar-MA', selectable: true },
	{ key: 'fusha', name: 'Modern Standard Arabic', shortName: 'Fusha', flag: '📖', sttLocale: 'ar-SA', selectable: true },
	{ key: 'iraqi', name: 'Iraqi Arabic', shortName: 'Iraqi', flag: '🇮🇶', sttLocale: 'ar-IQ', selectable: false },
	{ key: 'khaleeji', name: 'Gulf Arabic (Khaleeji)', shortName: 'Khaleeji', flag: '🇦🇪', sttLocale: 'ar-AE', selectable: false },
	{ key: 'saudi', name: 'Saudi Arabic (Hijazi)', shortName: 'Saudi', flag: '🇸🇦', sttLocale: 'ar-SA', selectable: false }
];

export const ALL_DIALECTS: Dialect[] = DIALECTS.map((d) => d.key);

export const SELECTABLE_DIALECTS: Dialect[] = DIALECTS.filter((d) => d.selectable).map((d) => d.key);

export function isDialect(value: unknown): value is Dialect {
	return (ALL_DIALECTS as unknown[]).includes(value);
}

export function isSelectableDialect(value: unknown): value is Dialect {
	return (SELECTABLE_DIALECTS as unknown[]).includes(value);
}

export function getDialectInfo(dialect: string): DialectInfo | undefined {
	return DIALECTS.find((d) => d.key === dialect);
}
