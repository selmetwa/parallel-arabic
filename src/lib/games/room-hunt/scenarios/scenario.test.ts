import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { GAME_DIALECTS } from '$lib/games/themes';
import { SCENARIOS, getScenario } from './index';
import {
	createScenarioState,
	currentTurn,
	hintedLine,
	itemLine,
	lineFor,
	reply,
	scenarioDone
} from './scenario';
import { restaurant } from './restaurant';

describe.each(SCENARIOS.map((s) => [s.scenario.id, s] as const))('%s', (_, { scenario, stage }) => {
	it('has every line in every dialect, recorded', () => {
		for (const id of Object.keys(scenario.lines)) {
			for (const dialect of GAME_DIALECTS) {
				const entry = scenario.text[id]?.[dialect];
				expect(entry?.arabic, `${id}/${dialect}`).toBeTruthy();
				expect(entry?.transliteration, `${id}/${dialect}`).toBeTruthy();
				const file = join(process.cwd(), 'static', lineFor(scenario, id, dialect).audioUrl);
				expect(existsSync(file), file).toBe(true);
			}
		}
		// And nothing written that no line uses.
		for (const id of Object.keys(scenario.text)) expect(scenario.lines[id], id).toBeDefined();
	});

	it('has the other person ask and the player answer, with one right and one wrong reply a turn', () => {
		for (const turn of scenario.turns) {
			expect(scenario.lines[turn.npc]?.speaker, turn.id).toBe('npc');
			expect(turn.choices.some((c) => c.ok), turn.id).toBe(true);
			expect(turn.choices.some((c) => !c.ok), turn.id).toBe(true);
			for (const choice of turn.choices) {
				expect(scenario.lines[choice.line]?.speaker, choice.line).toBe('you');
				if (choice.reply) expect(scenario.lines[choice.reply]?.speaker, choice.reply).toBe('npc');
			}
		}
	});

	it('names, places and hands over everything that can be asked for', () => {
		const gives = scenario.turns.flatMap((t) => t.choices.flatMap((c) => (c.give ? [c.give] : [])));
		for (const id of gives) {
			expect(scenario.lines[itemLine(id)]?.speaker, id).toBe('item');
			expect(stage.give[id]?.length, id).toBeGreaterThan(0);
		}
		// A give is only handed over by a later (or the same) fetching turn.
		const lastGive = Math.max(-1, ...scenario.turns.map((t, i) => (t.choices.some((c) => c.give) ? i : -1)));
		if (lastGive >= 0) expect(scenario.turns.slice(lastGive).some((t) => t.fetch)).toBe(true);
	});

	it('only drives routes the stage has', () => {
		for (const turn of scenario.turns) {
			if (turn.drive) expect(stage.vehicle?.drives[turn.drive], turn.drive).toBeDefined();
		}
	});

	it('has a "sorry" line for wrong answers', () => {
		const sorry = Object.entries(scenario.lines).filter(
			([id, line]) => line.speaker === 'npc' && id.endsWith('_sorry')
		);
		expect(sorry).toHaveLength(1);
	});

	it('plays through on the first right answers', () => {
		const state = createScenarioState();
		for (const turn of scenario.turns) {
			expect(reply(scenario, state, turn.choices.find((c) => c.ok)!.line).result).toBe('ok');
		}
		expect(scenarioDone(scenario, state)).toBe(true);
	});
});

describe('a conversation', () => {
	const okLine = (turn: number) => restaurant.turns[turn].choices.find((c) => c.ok)!.line;
	const wrongLine = (turn: number) => restaurant.turns[turn].choices.find((c) => !c.ok)!.line;

	it('moves on after a fitting reply and earns XP', () => {
		const state = createScenarioState();
		expect(reply(restaurant, state, okLine(0))).toMatchObject({ result: 'ok', xp: true });
		expect(currentTurn(restaurant, state)?.id).toBe(restaurant.turns[1].id);
		expect(state.said).toEqual([okLine(0)]);
	});

	it('keeps the turn after a reply that does not fit, then marks a right one', () => {
		const state = createScenarioState();
		expect(reply(restaurant, state, wrongLine(0)).result).toBe('wrong');
		expect(hintedLine(restaurant, state)).toBeUndefined();
		expect(reply(restaurant, state, wrongLine(0)).result).toBe('hint');
		expect(hintedLine(restaurant, state)).toBe(okLine(0));
		expect(reply(restaurant, state, okLine(0))).toMatchObject({ result: 'ok', xp: false });
		expect(state.outcomes.greet).toBe('hinted');
	});

	it('hands over what was asked for when a fetching turn ends, with the reply', () => {
		const state = createScenarioState();
		reply(restaurant, state, okLine(0));
		expect(reply(restaurant, state, 'y_water').fetch).toBeUndefined();
		expect(reply(restaurant, state, 'y_soup')).toMatchObject({
			reply: 'w_coming',
			fetch: ['glass', 'soup']
		});
		expect(state.given).toEqual(['glass', 'soup']);
	});

	it('fetches nothing when nothing was asked for', () => {
		const state = createScenarioState();
		for (const line of ['y_thanks', 'y_tea', 'y_fish', 'y_thanks']) reply(restaurant, state, line);
		expect(reply(restaurant, state, 'y_no_thanks').fetch).toBeUndefined();
	});

	it('reports a drive when its turn is answered', () => {
		const { scenario } = getScenario('taxi');
		const state = createScenarioState();
		const way = scenario.turns.findIndex((t) => t.drive);
		for (const turn of scenario.turns.slice(0, way)) reply(scenario, state, turn.choices.find((c) => c.ok)!.line);
		expect(reply(scenario, state, 'y_straight_right').drive).toBe('station');
	});

	it('refuses a line that is not an answer to this turn', () => {
		expect(() => reply(restaurant, createScenarioState(), 'y_bye')).toThrow();
	});

	it('falls back to the first scenario for an unknown id', () => {
		expect(getScenario('spaceship').scenario.id).toBe(SCENARIOS[0].scenario.id);
	});
});
