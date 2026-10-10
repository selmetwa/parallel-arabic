import { letters } from '$lib/constants/alphabet';
import { shuffle } from './shuffle';

export const QUESTIONS_PER_ROUND = 10;
export const OPTIONS = 4;

export type Position = 'start' | 'middle' | 'end';
export const POSITION_LABEL: Record<Position, string> = {
	start: 'at the start of a word',
	middle: 'in the middle of a word',
	end: 'at the end of a word'
};

export interface Letter {
	name: string;
	key: string;
	isolated: string;
	start: string | null;
	middle: string | null;
	end: string | null;
}

export const LETTERS: Letter[] = letters;

/** Letters that share a body and differ by dots: the mix-ups worth practising. */
const FAMILIES = [
	'بتثني',
	'جحخ',
	'دذ',
	'رز',
	'سش',
	'صض',
	'طظ',
	'عغ',
	'فق',
	'كل',
	'مهوا'
].map((f) => [...f]);

export type LetterQuestion =
	| { kind: 'form-to-letter'; letter: Letter; position: Position; options: Letter[]; answer: number }
	| { kind: 'letter-to-form'; letter: Letter; position: Position; options: string[]; answer: number }
	| { kind: 'sound-to-letter'; letter: Letter; options: Letter[]; answer: number };

export function audioUrl(letter: Letter): string {
	return `/letters/audios/${letter.key}.mp3`;
}

export function formOf(letter: Letter, position: Position): string | null {
	return letter[position];
}

/** Letters from the same family first, then any others, never the answer. */
function lookalikes(letter: Letter, random: () => number): Letter[] {
	const family = FAMILIES.find((f) => f.includes(letter.isolated)) ?? [];
	const near = shuffle(
		LETTERS.filter((l) => l !== letter && family.includes(l.isolated)),
		random
	);
	const rest = shuffle(
		LETTERS.filter((l) => l !== letter && !family.includes(l.isolated)),
		random
	);
	return [...near, ...rest].slice(0, OPTIONS - 1);
}

function withAnswer<T>(answer: T, wrong: T[], random: () => number) {
	const options = shuffle([answer, ...wrong], random);
	return { options, answer: options.indexOf(answer) };
}

/** Positions this letter has a distinct form for (ا, د, ر, و never join forwards). */
export function positionsOf(letter: Letter): Position[] {
	return (['start', 'middle', 'end'] as const).filter((p) => letter[p]);
}

export function buildRound(random: () => number = Math.random): LetterQuestion[] {
	const kinds: LetterQuestion['kind'][] = ['form-to-letter', 'letter-to-form', 'sound-to-letter'];
	return shuffle(LETTERS, random)
		.slice(0, QUESTIONS_PER_ROUND)
		.map((letter, i): LetterQuestion => {
			const kind = kinds[i % kinds.length];
			const positions = positionsOf(letter);
			const position = positions[Math.floor(random() * positions.length)];

			if (kind === 'sound-to-letter') {
				return { kind, letter, ...withAnswer(letter, lookalikes(letter, random), random) };
			}
			if (kind === 'form-to-letter') {
				return { kind, letter, position, ...withAnswer(letter, lookalikes(letter, random), random) };
			}
			// The same position's form of look-alike letters.
			const wrong = lookalikes(letter, random)
				.map((l) => formOf(l, position) ?? l.isolated)
				.filter((f) => f !== formOf(letter, position));
			return {
				kind,
				letter,
				position,
				...withAnswer(formOf(letter, position)!, wrong.slice(0, OPTIONS - 1), random)
			};
		});
}
