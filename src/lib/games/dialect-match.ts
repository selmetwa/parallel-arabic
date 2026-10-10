import { GAME_DIALECTS, DIALECT_OPTIONS, type GameDialect } from './themes';
import { shuffle } from './shuffle';
import { normalizeArabicTextLight, stripArabicDiacritics } from '$lib/utils/arabic-normalization';

export const QUESTIONS_PER_ROUND = 10;

export interface DialectForm {
	arabic: string;
	transliteration: string;
	/** A native recording, when there is one. */
	audioUrl?: string;
}

export interface DialectItem {
	id: string;
	english: string;
	forms: Record<GameDialect, DialectForm>;
}

export type DialectQuestion =
	/** See one dialect's form: which dialect is it? */
	| { kind: 'which'; item: DialectItem; dialect: GameDialect }
	/** Hear one dialect's recording: which dialect is it? */
	| { kind: 'listen'; item: DialectItem; dialect: GameDialect }
	/** Given the meaning and a dialect, pick that dialect's form. */
	| { kind: 'find'; item: DialectItem; dialect: GameDialect; options: GameDialect[] };

export function dialectLabel(dialect: GameDialect): string {
	return DIALECT_OPTIONS.find((o) => o.value === dialect)!.label;
}

const key = (arabic: string) =>
	normalizeArabicTextLight(stripArabicDiacritics(arabic)).replace(/[؟?]/g, '').trim();

/** True when no other dialect writes this item the same way. */
export function isDistinct(item: DialectItem, dialect: GameDialect): boolean {
	const mine = key(item.forms[dialect].arabic);
	return GAME_DIALECTS.every((d) => d === dialect || key(item.forms[d].arabic) !== mine);
}

export function allDistinct(item: DialectItem): boolean {
	return new Set(GAME_DIALECTS.map((d) => key(item.forms[d].arabic))).size === GAME_DIALECTS.length;
}

/**
 * A round of mixed questions. Each item is used once, and a question is only
 * asked where its answer is unambiguous: a "which dialect" form must be
 * written differently everywhere else, and "find" needs four different forms.
 */
export function buildRound(
	items: DialectItem[],
	random: () => number = Math.random
): DialectQuestion[] {
	const out: DialectQuestion[] = [];
	const kinds: DialectQuestion['kind'][] = ['which', 'listen', 'find'];
	let k = 0;

	for (const item of shuffle(items, random)) {
		if (out.length >= QUESTIONS_PER_ROUND) break;
		// Try this question's kind first, then the others, so every item gets used.
		for (let t = 0; t < kinds.length; t++) {
			const kind = kinds[(k + t) % kinds.length];
			const dialects = shuffle(GAME_DIALECTS, random);
			if (kind === 'find') {
				if (!allDistinct(item)) continue;
				out.push({ kind, item, dialect: dialects[0], options: shuffle(GAME_DIALECTS, random) });
			} else {
				const dialect = dialects.find(
					(d) => isDistinct(item, d) && (kind === 'which' || item.forms[d].audioUrl)
				);
				if (!dialect) continue;
				out.push({ kind, item, dialect });
			}
			k++;
			break;
		}
	}
	return out;
}
