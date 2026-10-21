/**
 * Content for onboarding's "Try it" section (docs/onboarding-v4-plan.md): one
 * dialog, used from end to end. The learner reads its opening, says it in the
 * conversation, traces a short word from it, then rebuilds what they said.
 */
import type { Dialect } from '$lib/types';
import { tokenize, type ScrambleSentence } from '$lib/games/sentence-scramble';
import type { ScenarioLine, TutorScenario } from './tutor-scenarios';
import type { DailyGoal } from './daily-goal';

/** What the learner did in the Try-it section, for the plan and trial recaps. */
export interface TryProgress {
	read: boolean;
	spoke: boolean;
	traced: boolean;
	played: boolean;
	goal: DailyGoal | null;
}

export const NOTHING_TRIED: TryProgress = { read: false, spoke: false, traced: false, played: false, goal: null };

export interface TraceTarget {
	arabic: string;
	transliteration: string;
	english: string;
}

export interface TryContent {
	/** Dialog line indices shown on the Read step. */
	readLines: number[];
	/** Two or three letters, taken from the dialog. */
	trace: TraceTarget;
}

const ANA: TraceTarget = { arabic: 'أنا', transliteration: 'ana', english: 'I' };
const SUKKAR: TraceTarget = { arabic: 'سكر', transliteration: 'sukkar', english: 'sugar' };
const AKH: TraceTarget = { arabic: 'أخ', transliteration: 'akh', english: 'brother' };

const CONTENT: Record<string, Partial<Record<Dialect, TryContent>>> = {
	'introducing-yourself': {
		levantine: { readLines: [0], trace: ANA },
		'egyptian-arabic': { readLines: [0], trace: ANA },
		fusha: { readLines: [0], trace: ANA },
		darija: { readLines: [0], trace: ANA }
	},
	// Coffee and family open on the other person's question, so Read shows it too.
	'ordering-coffee': {
		levantine: { readLines: [0, 1], trace: SUKKAR },
		'egyptian-arabic': { readLines: [0, 1], trace: SUKKAR },
		fusha: { readLines: [0, 1], trace: SUKKAR },
		darija: { readLines: [0, 1], trace: SUKKAR }
	},
	'talking-about-family': {
		levantine: { readLines: [0, 1], trace: AKH },
		'egyptian-arabic': { readLines: [0, 1], trace: AKH },
		fusha: { readLines: [0, 1], trace: AKH },
		// Darija says خويا, "my brother": trace the shorter ختي instead. Needs a native-speaker check.
		darija: {
			readLines: [0, 1],
			trace: { arabic: 'ختي', transliteration: 'khti', english: 'my sister' }
		}
	}
};

/** The Try-it content for the onboarding dialog, or undefined when there is none. */
export function tryContent(
	scenario: TutorScenario | undefined,
	dialect: Dialect
): TryContent | undefined {
	return scenario ? CONTENT[scenario.id]?.[dialect] : undefined;
}

/** The learner's own lines from the conversation, to rebuild word by word. */
export function scrambleSentences(lines: ScenarioLine[]): ScrambleSentence[] {
	return lines
		.filter((line) => line.speaker === 'student')
		.map((line) => ({
			arabic: line.arabic,
			english: line.english,
			transliteration: line.transliteration,
			words: tokenize(line.arabic)
		}));
}
