import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { GAME_DIALECTS } from '$lib/games/themes';
import { getRoom } from './rooms';
import {
	ORDER_LINES,
	ORDER_TEXT,
	ORDER_TURNS,
	STAGE,
	createOrder,
	currentTurn,
	hintedLine,
	lineFor,
	orderDone,
	reply
} from './order';

const okLine = (turn: number) => ORDER_TURNS[turn].choices.find((c) => c.ok)!.line;
const wrongLine = (turn: number) => ORDER_TURNS[turn].choices.find((c) => !c.ok)!.line;

describe('order data', () => {
	it('has every line in every dialect, recorded', () => {
		for (const id of Object.keys(ORDER_LINES)) {
			for (const dialect of GAME_DIALECTS) {
				const entry = ORDER_TEXT[id]?.[dialect];
				expect(entry?.arabic, `${id}/${dialect}`).toBeTruthy();
				expect(entry?.transliteration, `${id}/${dialect}`).toBeTruthy();
				const file = join(process.cwd(), 'static', lineFor(id, dialect).audioUrl);
				expect(existsSync(file), file).toBe(true);
			}
		}
	});

	it('only uses lines that exist, spoken by the right person', () => {
		for (const turn of ORDER_TURNS) {
			expect(ORDER_LINES[turn.waiter].speaker, turn.id).toBe('waiter');
			expect(turn.choices.some((c) => c.ok), turn.id).toBe(true);
			expect(turn.choices.some((c) => !c.ok), turn.id).toBe(true);
			for (const choice of turn.choices) expect(ORDER_LINES[choice.line].speaker).toBe('you');
		}
	});

	it('only serves dishes the restaurant has and the table has room for', () => {
		const restaurant = getRoom('restaurant');
		for (const turn of ORDER_TURNS) {
			for (const choice of turn.choices) {
				if (!choice.serve) continue;
				expect(restaurant.objects.map((o) => o.id)).toContain(choice.serve);
				expect(STAGE.serve[choice.serve], choice.serve).toBeDefined();
			}
		}
	});

	it('clears only dishes that are on the restaurant tables', () => {
		const ids = getRoom('restaurant').objects.map((o) => o.id);
		for (const id of STAGE.clearTable) expect(ids).toContain(id);
	});
});

describe('a conversation', () => {
	it('moves on after a fitting reply and earns XP', () => {
		const order = createOrder();
		expect(reply(order, okLine(0))).toEqual({ result: 'ok', xp: true, fetch: undefined });
		expect(currentTurn(order)?.id).toBe(ORDER_TURNS[1].id);
		expect(order.said).toEqual([okLine(0)]);
	});

	it('keeps the turn after a reply that does not fit, then marks a right one', () => {
		const order = createOrder();
		expect(reply(order, wrongLine(0)).result).toBe('wrong');
		expect(hintedLine(order)).toBeUndefined();
		expect(reply(order, wrongLine(0)).result).toBe('hint');
		expect(hintedLine(order)).toBe(okLine(0));
		expect(reply(order, okLine(0))).toMatchObject({ result: 'ok', xp: false });
		expect(order.outcomes.greet).toBe('hinted');
	});

	it('brings the drink and the food together once the food is ordered', () => {
		const order = createOrder();
		reply(order, okLine(0));
		expect(reply(order, 'y_water').fetch).toBeUndefined();
		expect(order.pending).toEqual(['glass']);
		expect(reply(order, 'y_soup').fetch).toEqual(['glass', 'soup']);
		expect(order.pending).toEqual([]);
		expect(order.served).toEqual(['glass', 'soup']);
	});

	it('only fetches dessert if it was ordered', () => {
		const order = createOrder();
		for (const line of ['y_thanks', 'y_tea', 'y_fish', 'y_thanks']) reply(order, line);
		expect(reply(order, 'y_no_thanks').fetch).toBeUndefined();
		expect(order.served).toEqual(['tea', 'fish']);
	});

	it('ends after the goodbye', () => {
		const order = createOrder();
		ORDER_TURNS.forEach((_, i) => reply(order, okLine(i)));
		expect(orderDone(order)).toBe(true);
		expect(() => reply(order, 'y_bye')).toThrow();
	});

	it('refuses a line that is not an answer to this turn', () => {
		expect(() => reply(createOrder(), 'y_bye')).toThrow();
	});
});
