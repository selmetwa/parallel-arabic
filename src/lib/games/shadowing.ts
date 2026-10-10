import { SCENARIOS } from './room-hunt/scenarios';
import { lineFor } from './room-hunt/scenarios/scenario';
import { VOCAB, wordFor } from './room-hunt/round';
import { shuffle } from './shuffle';
import type { GameDialect } from './themes';
import { PASS_THRESHOLD } from '$lib/utils/pronunciation';

export const LINES_PER_ROUND = 6;
/** Short enough to repeat after one listen. */
const MAX_WORDS = 8;

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
	return [...scenes, ...questions].filter(
		(l) => l.arabic.trim().split(/\s+/).length <= MAX_WORDS
	);
}

export function buildRound(
	dialect: GameDialect,
	{
		random = Math.random,
		avoid = new Set<string>()
	}: { random?: () => number; avoid?: Set<string> } = {}
): ShadowLine[] {
	const lines = shuffle(linesFor(dialect), random);
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
