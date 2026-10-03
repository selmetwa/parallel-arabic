/**
 * "Order a meal": a short conversation with the restaurant's waiter.
 *
 * Each turn the waiter says a line and the player answers with one of a few
 * phrases. Some answers are all fine (what to drink is the player's choice) and
 * a few don't fit the moment; a wrong answer gets a puzzled "Sorry?", and after
 * HINT_AFTER misses a right answer is marked. What the player orders is brought
 * to their table.
 *
 * The English here is the source; the Arabic for each dialect is in
 * order-lines.json (scripts/generate-room-hunt-scenario.ts).
 */
import type { GameDialect } from '$lib/games/themes';
import type { GameWord } from '$lib/games/word-pool';
import { stripArabicDiacritics } from '$lib/utils/arabic-normalization';
import { HINT_AFTER, type Outcome } from './round';
import type { Placement } from './rooms';
import linesJson from './order-lines.json';

export type Speaker = 'waiter' | 'you';

export const ORDER_LINES: Record<string, { speaker: Speaker; english: string; note?: string }> = {
	w_welcome: { speaker: 'waiter', english: 'Welcome! Please, have a seat. Here is the menu.' },
	w_drink: { speaker: 'waiter', english: 'What would you like to drink?' },
	w_food: { speaker: 'waiter', english: 'And what would you like to eat?' },
	w_coming: { speaker: 'waiter', english: 'Right away!' },
	w_enjoy: { speaker: 'waiter', english: 'Here you go. Enjoy your meal!' },
	w_dessert: { speaker: 'waiter', english: 'Would you like some dessert?' },
	w_how: { speaker: 'waiter', english: 'How was the food?' },
	w_bye: { speaker: 'waiter', english: 'Thank you! Come again.' },
	w_sorry: { speaker: 'waiter', english: "Sorry? I didn't understand." },

	y_thanks: { speaker: 'you', english: 'Thank you!' },
	y_bill: { speaker: 'you', english: 'The bill, please.' },
	y_bathroom: { speaker: 'you', english: 'Where is the bathroom?' },
	y_tea: { speaker: 'you', english: 'Tea, please.' },
	y_water: { speaker: 'you', english: 'A glass of water, please.' },
	y_fish: { speaker: 'you', english: 'Fish, please.' },
	y_chicken: { speaker: 'you', english: 'Chicken, please.' },
	y_soup: { speaker: 'you', english: 'Soup, please.' },
	y_goodbye: { speaker: 'you', english: 'Goodbye!' },
	y_welcome: {
		speaker: 'you',
		english: 'Welcome!',
		note: 'what a host says to a guest; here it is a wrong answer for the customer'
	},
	y_drink_q: {
		speaker: 'you',
		english: 'What would you like to drink?',
		note: "the waiter's question; here it is a wrong answer for the customer"
	},
	y_cake: { speaker: 'you', english: 'Yes, cake please.' },
	y_no_thanks: { speaker: 'you', english: 'No, thank you.' },
	y_table_two: { speaker: 'you', english: 'A table for two, please.' },
	y_delicious_bill: { speaker: 'you', english: 'Delicious! The bill, please.' },
	y_fork: { speaker: 'you', english: 'Where is the fork?' },
	y_bye: { speaker: 'you', english: 'Thank you, goodbye!' }
};

export interface Choice {
	line: string;
	ok: boolean;
	/** A Room Hunt object the waiter brings when this is ordered. */
	serve?: string;
}

export interface Turn {
	id: string;
	waiter: string;
	choices: Choice[];
	/** After this turn, the waiter fetches anything ordered and brings it over. */
	fetch?: boolean;
}

export const ORDER_TURNS: Turn[] = [
	{
		id: 'greet',
		waiter: 'w_welcome',
		choices: [
			{ line: 'y_thanks', ok: true },
			{ line: 'y_bill', ok: false },
			{ line: 'y_bathroom', ok: false }
		]
	},
	{
		id: 'drink',
		waiter: 'w_drink',
		choices: [
			{ line: 'y_tea', ok: true, serve: 'tea' },
			{ line: 'y_water', ok: true, serve: 'glass' },
			{ line: 'y_goodbye', ok: false }
		]
	},
	{
		id: 'food',
		waiter: 'w_food',
		choices: [
			{ line: 'y_fish', ok: true, serve: 'fish' },
			{ line: 'y_chicken', ok: true, serve: 'chicken' },
			{ line: 'y_soup', ok: true, serve: 'soup' },
			{ line: 'y_table_two', ok: false }
		],
		fetch: true
	},
	{
		id: 'served',
		waiter: 'w_enjoy',
		choices: [
			{ line: 'y_thanks', ok: true },
			{ line: 'y_welcome', ok: false },
			{ line: 'y_bill', ok: false }
		]
	},
	{
		id: 'dessert',
		waiter: 'w_dessert',
		choices: [
			{ line: 'y_cake', ok: true, serve: 'cake' },
			{ line: 'y_no_thanks', ok: true },
			{ line: 'y_drink_q', ok: false }
		],
		fetch: true
	},
	{
		id: 'bill',
		waiter: 'w_how',
		choices: [
			{ line: 'y_delicious_bill', ok: true },
			{ line: 'y_drink_q', ok: false },
			{ line: 'y_fork', ok: false }
		]
	},
	{
		id: 'bye',
		waiter: 'w_bye',
		choices: [
			{ line: 'y_bye', ok: true },
			{ line: 'y_welcome', ok: false },
			{ line: 'y_tea', ok: false }
		]
	}
];

type Entry = { arabic: string; transliteration: string };
export const ORDER_TEXT = linesJson as Record<string, Record<GameDialect, Entry>>;

export interface OrderLine extends GameWord {
	speaker: Speaker;
	audioUrl: string;
}

export function lineFor(id: string, dialect: GameDialect): OrderLine {
	const entry = ORDER_TEXT[id][dialect];
	return {
		id,
		speaker: ORDER_LINES[id].speaker,
		arabic: entry.arabic,
		plain: stripArabicDiacritics(entry.arabic),
		english: ORDER_LINES[id].english,
		transliteration: entry.transliteration,
		audioUrl: `/games/room-hunt/audio/${dialect}/order/${id}.mp3`
	};
}

/**
 * Where everything happens, in the restaurant room's coordinates (rooms.ts).
 * The player sits at the south table facing north; the waiter comes and goes
 * through the kitchen door on the north wall.
 */
export const STAGE = {
	seat: { at: [0.45, 1.25, 2.45] as [number, number, number], yaw: -0.12, pitch: -0.3 },
	/** The south table's own dishes are hidden so the order can be brought to it. */
	clearTable: ['fish', 'chicken', 'pepper'],
	door: [1.6, -2.7] as [number, number],
	/**
	 * Door to table, down the gap between the north and east tables, ending at
	 * the far corner of the player's table: two metres off and to the side, so
	 * the whole waiter shows, not just a head behind the tablecloth.
	 */
	route: [
		[1.1, -1.3],
		[1.1, 0.3],
		[1.0, 0.5]
	] as [number, number][],
	/** The mini characters have big heads; at full adult height the head fills the view. */
	characterScale: 1.6,
	/** Where each dish lands on the player's table. Scales match the room's copies. */
	// The far half of the table: closer, and the dishes loom under the camera.
	serve: {
		// Drinks to the left, so they don't stand between the player and the waiter.
		tea: { at: [0.05, 0.655, 1.45], scale: 0.7 },
		glass: { at: [0.05, 0.655, 1.45], scale: 0.6 },
		fish: { at: [0.35, 0.655, 1.45], rot: 90, scale: 0.6 },
		chicken: { at: [0.35, 0.655, 1.45], scale: 0.4 },
		soup: { at: [0.35, 0.655, 1.45], scale: 0.6 },
		cake: { at: [-0.4, 0.655, 1.45], scale: 0.5 }
	} as Record<string, Placement>,
	// The sit clip puts the hips at the model's origin, so a diner is lifted to seat height.
	diners: [
		{ model: 'character-female-a', at: [-0.45, 0.42, -2.3], rot: 0 },
		{ model: 'character-male-d', at: [-2.5, 0.42, 0.45], rot: 90 }
	] as { model: string; at: [number, number, number]; rot: number }[]
};

export const characterUrl = (model: string) => `/games/room-hunt/models/characters/${model}.glb`;

/** Who takes the order, per dialect: the character matches the voice's gender. */
export const WAITER: Record<GameDialect, { model: string; gender: 'm' | 'f' }> = {
	'egyptian-arabic': { model: 'character-male-b', gender: 'm' },
	levantine: { model: 'character-female-b', gender: 'f' },
	darija: { model: 'character-male-b', gender: 'm' },
	fusha: { model: 'character-male-b', gender: 'm' }
};

export interface OrderState {
	turn: number;
	misses: number;
	outcomes: Record<string, Outcome>;
	/** Objects ordered and not yet brought. */
	pending: string[];
	/** Everything brought to the table. */
	served: string[];
	/** The player's lines, in order: the phrases of this conversation. */
	said: string[];
}

export function createOrder(): OrderState {
	return { turn: 0, misses: 0, outcomes: {}, pending: [], served: [], said: [] };
}

export function currentTurn(state: OrderState): Turn | undefined {
	return ORDER_TURNS[state.turn];
}

export function orderDone(state: OrderState): boolean {
	return state.turn >= ORDER_TURNS.length;
}

export interface ReplyResult {
	result: 'ok' | 'wrong' | 'hint';
	xp: boolean;
	/** Set when the turn ends with the waiter fetching these objects. */
	fetch?: string[];
}

/** The player answers with one of the current turn's lines. Mutates `state`. */
export function reply(state: OrderState, line: string): ReplyResult {
	const turn = currentTurn(state);
	if (!turn) throw new Error('The conversation is over');
	const choice = turn.choices.find((c) => c.line === line);
	if (!choice) throw new Error(`"${line}" is not an answer to ${turn.id}`);

	if (!choice.ok) {
		state.misses++;
		return { result: state.misses >= HINT_AFTER ? 'hint' : 'wrong', xp: false };
	}

	const outcome: Outcome = state.misses >= HINT_AFTER ? 'hinted' : state.misses ? 'retry' : 'first';
	state.outcomes[turn.id] = outcome;
	state.said.push(line);
	if (choice.serve) state.pending.push(choice.serve);
	state.turn++;
	state.misses = 0;

	let fetch: string[] | undefined;
	if (turn.fetch && state.pending.length) {
		fetch = state.pending;
		state.served.push(...state.pending);
		state.pending = [];
	}
	return { result: 'ok', xp: outcome !== 'hinted', fetch };
}

/** After HINT_AFTER misses, the first right answer is marked. */
export function hintedLine(state: OrderState): string | undefined {
	if (state.misses < HINT_AFTER) return undefined;
	return currentTurn(state)?.choices.find((c) => c.ok)?.line;
}
