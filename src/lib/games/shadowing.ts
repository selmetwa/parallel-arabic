import { SCENARIOS } from './room-hunt/scenarios';
import { lineFor } from './room-hunt/scenarios/scenario';
import { VOCAB, wordFor } from './room-hunt/round';
import { shuffle } from './shuffle';
import type { GameDialect } from './themes';
import { PASS_THRESHOLD } from '$lib/utils/pronunciation';

export const LINES_PER_ROUND = 6;

/**
 * Easy: short lines, text shown. Medium: longer lines, text shown. Hard: the
 * longer lines by ear, with the text hidden until the first try.
 */
export type ShadowLevel = 'easy' | 'medium' | 'hard';
export const SHADOW_LEVELS: { value: ShadowLevel; label: string }[] = [
	{ value: 'easy', label: 'Easy' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'hard', label: 'Hard (by ear)' }
];
/** Lines of up to this many words are easy; longer ones are medium and hard. */
const SHORT_LINE = 3;

const wordCount = (arabic: string) => arabic.trim().split(/\s+/).length;

export function fitsLevel(line: ShadowLine, level: ShadowLevel): boolean {
	return level === 'easy' ? wordCount(line.arabic) <= SHORT_LINE : wordCount(line.arabic) > SHORT_LINE;
}

export interface ShadowLine {
	id: string;
	arabic: string;
	transliteration: string;
	english: string;
	audioUrl: string;
	/** Where the line comes from, e.g. "Taxi". */
	source: string;
}

export type Rating = 'great' | 'good' | 'again';

/**
 * Every recorded line in a dialect: what people say in the Scenarios scenes,
 * and Room Hunt's "Where is the…?" questions.
 */
export function linesFor(dialect: GameDialect): ShadowLine[] {
	const scenes = SCENARIOS.flatMap(({ scenario }) =>
		Object.keys(scenario.lines)
			.filter((id) => scenario.lines[id].speaker !== 'item' && scenario.text[id]?.[dialect])
			.map((id) => {
				const line = lineFor(scenario, id, dialect);
				return {
					id: `${scenario.id}-${id}`,
					arabic: line.arabic,
					transliteration: line.transliteration,
					english: line.english,
					audioUrl: line.audioUrl,
					source: scenario.title
				};
			})
	);
	const questions = Object.keys(VOCAB).map((id) => {
		const w = wordFor(id, dialect);
		return {
			id: `room-${id}`,
			arabic: w.question,
			transliteration: w.questionTransliteration,
			english: w.questionEnglish,
			audioUrl: w.questionAudioUrl,
			source: 'Room Hunt'
		};
	});
	return [...scenes, ...questions];
}

export function buildRound(
	dialect: GameDialect,
	level: ShadowLevel = 'easy',
	{
		random = Math.random,
		avoid = new Set<string>()
	}: { random?: () => number; avoid?: Set<string> } = {}
): ShadowLine[] {
	const lines = shuffle(
		linesFor(dialect).filter((l) => fitsLevel(l, level)),
		random
	);
	return [...lines.filter((l) => !avoid.has(l.id)), ...lines.filter((l) => avoid.has(l.id))].slice(
		0,
		LINES_PER_ROUND
	);
}

export function rate(score: number): Rating {
	if (score >= 80) return 'great';
	if (score >= PASS_THRESHOLD.sentence) return 'good';
	return 'again';
}
