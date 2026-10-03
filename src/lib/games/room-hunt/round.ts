/**
 * Room Hunt sessions: learn a few objects, then find (or name) them.
 *
 * A room's objects are taught BATCH_SIZE at a time, in room order. A session
 * teaches the next batch and then asks for those words mixed with a few already
 * learned. Once a room is fully learned, sessions are plain practice rounds.
 *
 * In a round, a wrong answer names what was chosen and keeps the prompt. After
 * HINT_AFTER wrong answers the right one is pointed out; an answer found that
 * way earns no XP. Any word not got on the first try comes back once,
 * REQUEUE_GAP prompts later, so the miss is practised while it's fresh.
 */
import { stripArabicDiacritics } from '$lib/utils/arabic-normalization';
import { shuffle } from '$lib/games/shuffle';
import type { GameDialect } from '$lib/games/themes';
import type { GameWord } from '$lib/games/word-pool';
import { CONCEPTS, type Room } from './rooms';
import vocabJson from './vocab.json';

interface Entry {
	arabic: string;
	transliteration: string;
	gender: 'm' | 'f';
	question: string;
	questionTransliteration: string;
}
export const VOCAB = vocabJson as Record<string, Record<GameDialect, Entry>>;

export const BATCH_SIZE = 4;
export const REVIEW_SIZE = 4;
export const PRACTICE_SIZE = 10;
export const HINT_AFTER = 2;
export const REQUEUE_GAP = 3;
export const CHOICES = 4;

export type Level = 'easy' | 'normal' | 'hard';
export type Mode = 'find' | 'name';
export type Outcome = 'first' | 'retry' | 'hinted';

export interface RoomWord extends GameWord {
	audioUrl: string;
	gender: 'm' | 'f';
	question: string;
	questionTransliteration: string;
	questionEnglish: string;
	questionAudioUrl: string;
}

export interface RoundState {
	prompts: string[];
	index: number;
	/** Wrong answers on the current prompt. */
	misses: number;
	hinted: boolean;
	/** How each word went the first time it was asked. */
	outcomes: Record<string, Outcome>;
	/** Words already sent round again, so a word repeats at most once. */
	requeued: string[];
}

export interface Session {
	/** Words to teach before the round; empty for a practice round. */
	learn: string[];
	round: RoundState;
}

const AUDIO = '/games/room-hunt/audio';

export function wordFor(id: string, dialect: GameDialect): RoomWord {
	const entry = VOCAB[id][dialect];
	const english = CONCEPTS[id].english;
	return {
		id,
		arabic: entry.arabic,
		plain: stripArabicDiacritics(entry.arabic),
		english,
		transliteration: entry.transliteration,
		audioUrl: `${AUDIO}/${dialect}/${id}.mp3`,
		gender: entry.gender,
		question: entry.question,
		questionTransliteration: entry.questionTransliteration,
		questionEnglish: `Where's the ${english}?`,
		questionAudioUrl: `${AUDIO}/${dialect}/${id}.q.mp3`
	};
}

/** The room's objects in teaching order, BATCH_SIZE at a time. */
export function batches(room: Room): string[][] {
	const ids = room.objects.map((o) => o.id);
	const out: string[][] = [];
	for (let i = 0; i < ids.length; i += BATCH_SIZE) out.push(ids.slice(i, i + BATCH_SIZE));
	return out;
}

/** The words still to learn from the first batch that isn't done, or [] when the room is. */
export function nextToLearn(room: Room, learned: ReadonlySet<string>): string[] {
	for (const batch of batches(room)) {
		const fresh = batch.filter((id) => !learned.has(id));
		if (fresh.length) return fresh;
	}
	return [];
}

export function learnedCount(room: Room, learned: ReadonlySet<string>): number {
	return room.objects.filter((o) => learned.has(o.id)).length;
}

export function createRound(prompts: string[]): RoundState {
	return { prompts: [...prompts], index: 0, misses: 0, hinted: false, outcomes: {}, requeued: [] };
}

export function planSession(
	room: Room,
	learned: ReadonlySet<string>,
	random: () => number = Math.random
): Session {
	const learn = nextToLearn(room, learned);
	if (!learn.length) {
		const all = room.objects.map((o) => o.id);
		return { learn, round: createRound(shuffle(all, random).slice(0, PRACTICE_SIZE)) };
	}
	const known = room.objects.map((o) => o.id).filter((id) => learned.has(id));
	const review = shuffle(known, random).slice(0, REVIEW_SIZE);
	return { learn, round: createRound(shuffle([...learn, ...review], random)) };
}

export function currentPrompt(state: RoundState): string | undefined {
	return state.prompts[state.index];
}

export function isDone(state: RoundState): boolean {
	return state.index >= state.prompts.length;
}

export interface AnswerResult {
	result: 'correct' | 'wrong' | 'hint';
	/** Whether this answer earns a point of XP. */
	xp: boolean;
}

/** Records an answer (a tapped object or a chosen name). Mutates `state`. */
export function answer(state: RoundState, picked: string): AnswerResult {
	const target = currentPrompt(state);
	if (target === undefined) throw new Error('The round is over');

	if (picked !== target) {
		state.misses++;
		if (state.misses >= HINT_AFTER) {
			state.hinted = true;
			return { result: 'hint', xp: false };
		}
		return { result: 'wrong', xp: false };
	}

	const outcome: Outcome = state.hinted ? 'hinted' : state.misses === 0 ? 'first' : 'retry';
	const firstTime = !(target in state.outcomes);
	if (firstTime) state.outcomes[target] = outcome;

	if (outcome !== 'first' && !state.requeued.includes(target)) {
		state.requeued.push(target);
		state.prompts.splice(Math.min(state.index + 1 + REQUEUE_GAP, state.prompts.length), 0, target);
	}

	state.index++;
	state.misses = 0;
	state.hinted = false;
	return { result: 'correct', xp: firstTime && outcome !== 'hinted' };
}

/** Words not got on the first try. */
export function missed(state: RoundState): string[] {
	return Object.entries(state.outcomes)
		.filter(([, o]) => o !== 'first')
		.map(([id]) => id);
}

export function tally(state: RoundState) {
	const values = Object.values(state.outcomes);
	return {
		asked: values.length,
		first: values.filter((o) => o === 'first').length,
		retry: values.filter((o) => o === 'retry').length,
		hinted: values.filter((o) => o === 'hinted').length
	};
}

/** For "Name it": the right word and CHOICES - 1 others from the same room, shuffled. */
export function nameChoices(
	room: Room,
	target: string,
	random: () => number = Math.random
): string[] {
	const others = shuffle(
		room.objects.map((o) => o.id).filter((id) => id !== target),
		random
	).slice(0, CHOICES - 1);
	return shuffle([target, ...others], random);
}
