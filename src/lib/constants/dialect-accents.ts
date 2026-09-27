/**
 * The accent colour pair each dialect uses across lessons: the dialect cards on
 * /lessons/structured, its learning path, and the lesson player. `deep` is the
 * darker shade for the solid bottom edge of pressable elements.
 */
export interface Accent {
	accent: string;
	deep: string;
}

export const DIALECT_ACCENTS: Record<string, Accent> = {
	'egyptian-arabic': { accent: '#f59e0b', deep: '#b45309' },
	darija: { accent: '#f43f5e', deep: '#9f1239' },
	fusha: { accent: '#8b5cf6', deep: '#6d28d9' },
	levantine: { accent: '#10b981', deep: '#047857' }
};

const FALLBACK: Accent = { accent: '#0ea5e9', deep: '#0369a1' };

export function dialectAccent(dialect: string): Accent {
	return DIALECT_ACCENTS[dialect] ?? FALLBACK;
}
