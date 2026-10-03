/**
 * Scenarios: short spoken conversations in a 3D place. The other person (the
 * "npc": a waiter, a taxi driver, a shopkeeper) says a line, and the player
 * answers with one of a few phrases.
 *
 * Some answers are all fine (what to order is the player's choice) and a few
 * don't fit the moment; a wrong answer gets a puzzled "Sorry?", and after
 * HINT_AFTER misses a right answer is marked. Things the player asks for are
 * handed over in the scene (`give`), and a turn can end with a drive.
 *
 * A scenario is data: its lines (English source), turns, and the Arabic for
 * every line in every dialect (a JSON file next to it). How it's staged in 3D
 * is in stage.ts.
 */
import type { GameDialect } from '$lib/games/themes';
import type { GameWord } from '$lib/games/word-pool';
import { stripArabicDiacritics } from '$lib/utils/arabic-normalization';
import { HINT_AFTER, type Outcome } from '../round';

/** `item` lines name things handed over, for the receipt at the end. */
export type Speaker = 'npc' | 'you' | 'item';

export interface ScenarioLine {
	speaker: Speaker;
	english: string;
	/** Context for whoever writes the Arabic. */
	note?: string;
}

export interface Choice {
	line: string;
	ok: boolean;
	/** Something handed over when this is asked for (an `item_<id>` line names it). */
	give?: string;
	/** What the other person says straight back, before the next turn. */
	reply?: string;
}

export interface Turn {
	id: string;
	npc: string;
	choices: Choice[];
	/** After this turn, anything asked for is fetched and handed over. */
	fetch?: boolean;
	/** After this turn, the vehicle drives this route (a key into the stage's drives). */
	drive?: string;
}

type Entry = { arabic: string; transliteration: string };

export interface Scenario {
	id: string;
	title: string;
	emoji: string;
	/** One line for the scene card. */
	blurb: string;
	/** Shown over the other person's lines: "Waiter", "Driver". */
	npcRole: string;
	/** Per dialect, to match the recorded voice (and the Arabic's gender agreement). */
	npcGender: Record<GameDialect, 'm' | 'f'>;
	lines: Record<string, ScenarioLine>;
	turns: Turn[];
	text: Record<string, Record<GameDialect, Entry>>;
	/** The end screen's heading. */
	doneHeading: string;
}

export interface ScenarioLineText extends GameWord {
	speaker: Speaker;
	audioUrl: string;
}

export function lineFor(scenario: Scenario, id: string, dialect: GameDialect): ScenarioLineText {
	const entry = scenario.text[id][dialect];
	return {
		id,
		speaker: scenario.lines[id].speaker,
		arabic: entry.arabic,
		plain: stripArabicDiacritics(entry.arabic),
		english: scenario.lines[id].english,
		transliteration: entry.transliteration,
		audioUrl: `/games/room-hunt/audio/${dialect}/${scenario.id}/${id}.mp3`
	};
}

export const itemLine = (id: string) => `item_${id}`;

export interface ScenarioState {
	turn: number;
	misses: number;
	outcomes: Record<string, Outcome>;
	/** Asked for and not yet handed over. */
	pending: string[];
	/** Everything handed over. */
	given: string[];
	/** The player's lines, in order: the phrases of this conversation. */
	said: string[];
}

export function createScenarioState(): ScenarioState {
	return { turn: 0, misses: 0, outcomes: {}, pending: [], given: [], said: [] };
}

export function currentTurn(scenario: Scenario, state: ScenarioState): Turn | undefined {
	return scenario.turns[state.turn];
}

export function scenarioDone(scenario: Scenario, state: ScenarioState): boolean {
	return state.turn >= scenario.turns.length;
}

export interface ReplyResult {
	result: 'ok' | 'wrong' | 'hint';
	xp: boolean;
	/** The other person's answer, said before the next turn. */
	reply?: string;
	/** Set when the turn ends with these handed over. */
	fetch?: string[];
	/** Set when the turn ends with a drive. */
	drive?: string;
}

/** The player answers with one of the current turn's lines. Mutates `state`. */
export function reply(scenario: Scenario, state: ScenarioState, line: string): ReplyResult {
	const turn = currentTurn(scenario, state);
	if (!turn) throw new Error('The conversation is over');
	const choice = turn.choices.find((c) => c.line === line);
	if (!choice) throw new Error(`"${line}" is not an answer to ${turn.id}`);

	if (!choice.ok) {
		state.misses++;
		return { result: state.misses >= HINT_AFTER ? 'hint' : 'wrong', xp: false };
	}

	const outcome: Outcome =
		state.misses >= HINT_AFTER ? 'hinted' : state.misses ? 'retry' : 'first';
	state.outcomes[turn.id] = outcome;
	state.said.push(line);
	if (choice.give) state.pending.push(choice.give);
	state.turn++;
	state.misses = 0;

	let fetch: string[] | undefined;
	if (turn.fetch && state.pending.length) {
		fetch = state.pending;
		state.given.push(...state.pending);
		state.pending = [];
	}
	return { result: 'ok', xp: outcome !== 'hinted', reply: choice.reply, fetch, drive: turn.drive };
}

/** After HINT_AFTER misses, the first right answer is marked. */
export function hintedLine(scenario: Scenario, state: ScenarioState): string | undefined {
	if (state.misses < HINT_AFTER) return undefined;
	return currentTurn(scenario, state)?.choices.find((c) => c.ok)?.line;
}
