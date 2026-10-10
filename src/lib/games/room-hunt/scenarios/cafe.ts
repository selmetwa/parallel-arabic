/**
 * "At the café": order a coffee or a tea the way you like it, maybe a
 * croissant, and pay. What you order is made and put on the counter.
 */
import { model, type Placement, type Room } from '../rooms';
import type { Scenario } from './scenario';
import type { Prop, Stage } from './stage';
import text from './cafe.json';

export const cafe: Scenario = {
	id: 'cafe',
	title: 'At the café',
	emoji: '☕',
	blurb: 'Order a coffee or tea how you like it, add a croissant and pay.',
	npcRole: 'Barista',
	npcGender: { 'egyptian-arabic': 'm', levantine: 'f', darija: 'm', fusha: 'm' },
	doneHeading: 'Coffee ordered, in Arabic!',
	text: text as Scenario['text'],
	lines: {
		c_hello: { speaker: 'npc', english: 'Good morning! What would you like?' },
		c_size: { speaker: 'npc', english: 'Small or large?' },
		c_sugar: { speaker: 'npc', english: 'With sugar?' },
		c_eat: { speaker: 'npc', english: 'Anything to eat? The croissants are fresh.' },
		c_here: { speaker: 'npc', english: 'For here or to take away?' },
		c_ready: { speaker: 'npc', english: "Here you go. That's thirty-five." },
		c_card_yes: { speaker: 'npc', english: 'Of course.' },
		c_bye: { speaker: 'npc', english: 'Have a nice day!' },
		c_sorry: { speaker: 'npc', english: "Sorry? I didn't understand." },
		y_coffee: { speaker: 'you', english: 'A coffee, please.' },
		y_tea: { speaker: 'you', english: 'Tea, please.' },
		y_small: { speaker: 'you', english: 'Small.' },
		y_large: { speaker: 'you', english: 'Large.' },
		y_no_sugar: { speaker: 'you', english: 'No sugar, thanks.' },
		y_one_sugar: { speaker: 'you', english: 'One sugar, please.' },
		y_croissant: { speaker: 'you', english: 'Yes, a croissant.' },
		y_thats_all: { speaker: 'you', english: "No, that's all." },
		y_for_here: { speaker: 'you', english: 'For here.' },
		y_takeaway: { speaker: 'you', english: 'To take away.' },
		y_card: { speaker: 'you', english: 'Can I pay by card?' },
		y_here_you_go: { speaker: 'you', english: 'Here you go.' },
		y_thanks_bye: { speaker: 'you', english: 'Thanks, bye!' },
		y_two_kilos: { speaker: 'you', english: 'Two kilos.' },
		y_stop_here: { speaker: 'you', english: 'Stop here, please.' },
		y_too_expensive: { speaker: 'you', english: "That's expensive! Twenty?" },
		y_welcome: { speaker: 'you', english: 'Welcome!' },
		item_coffee: { speaker: 'item', english: 'coffee' },
		item_tea: { speaker: 'item', english: 'tea' },
		item_croissant: { speaker: 'item', english: 'croissant' }
	},
	turns: [
		{
			id: 'hello',
			npc: 'c_hello',
			choices: [
				{ line: 'y_coffee', ok: true, give: 'coffee' },
				{ line: 'y_tea', ok: true, give: 'tea' },
				{ line: 'y_two_kilos', ok: false }
			]
		},
		{
			id: 'size',
			npc: 'c_size',
			choices: [
				{ line: 'y_small', ok: true },
				{ line: 'y_large', ok: true },
				{ line: 'y_stop_here', ok: false }
			]
		},
		{
			id: 'sugar',
			npc: 'c_sugar',
			choices: [
				{ line: 'y_no_sugar', ok: true },
				{ line: 'y_one_sugar', ok: true },
				{ line: 'y_welcome', ok: false }
			]
		},
		{
			id: 'eat',
			npc: 'c_eat',
			choices: [
				{ line: 'y_croissant', ok: true, give: 'croissant' },
				{ line: 'y_thats_all', ok: true },
				{ line: 'y_two_kilos', ok: false }
			]
		},
		{
			id: 'here',
			npc: 'c_here',
			choices: [
				{ line: 'y_for_here', ok: true },
				{ line: 'y_takeaway', ok: true },
				{ line: 'y_too_expensive', ok: false }
			],
			fetch: true
		},
		{
			id: 'pay',
			npc: 'c_ready',
			choices: [
				{ line: 'y_here_you_go', ok: true },
				{ line: 'y_card', ok: true, reply: 'c_card_yes' },
				{ line: 'y_stop_here', ok: false }
			]
		},
		{
			id: 'bye',
			npc: 'c_bye',
			choices: [
				{ line: 'y_thanks_bye', ok: true },
				{ line: 'y_welcome', ok: false }
			]
		}
	]
};

const f = model.furniture;
const food = model.food;
/** The counter, the same build as the hotel's reception desk. */
const COUNTER_TOP = 0.715;
const TABLE_TOP = 0.655;

const shop: Room = {
	id: 'cafe',
	label: 'Café',
	emoji: '☕',
	size: [7, 6],
	height: 3,
	colors: { floor: '#a9876a', wall: '#f2e6d6' },
	objects: [],
	decor: [
		// The counter, with the coffee machine and the pastries.
		{
			model: f('kitchenBar'),
			placements: [-0.95, 0, 0.95].map((x) => ({ at: [x, 0, -0.8], scale: [2.2, 1.7, 2.2] }) as Placement)
		},
		{ model: f('kitchenCoffeeMachine'), placements: [{ at: [0.95, COUNTER_TOP, -0.95], rot: 180, scale: 2 }] },
		{ model: food('cake'), placements: [{ at: [-0.9, COUNTER_TOP, -0.9], scale: 0.5 }] },
		{ model: food('loaf-round'), placements: [{ at: [-1.35, COUNTER_TOP, -0.85], scale: 0.3 }] },
		// Shelves behind, and a couple of tables.
		{
			model: f('kitchenCabinetUpper'),
			placements: [-1.2, 0, 1.2].map((x) => ({ at: [x, 1.5, -2.85], scale: 2 }) as Placement)
		},
		{ model: f('kitchenCabinet'), placements: [-1.2, 0, 1.2].map((x) => ({ at: [x, 0, -2.75], scale: 2 }) as Placement) },
		{ model: f('table'), placements: [{ at: [-2.5, 0, 1.2], scale: 2 }, { at: [2.5, 0, 1.2], scale: 2 }] },
		{
			model: f('chair'),
			placements: [
				{ at: [-2.5, 0, 1.9], rot: 180, scale: 2 },
				{ at: [2.5, 0, 1.9], rot: 180, scale: 2 }
			]
		},
		{ model: food('mug'), placements: [{ at: [-2.4, TABLE_TOP, 1.2], scale: 0.6 }] },
		{ model: f('pottedPlant'), placements: [{ at: [3, 0, -2.4], scale: 2.4 }] }
	]
};

const onCounter = (name: string, x: number, scale: number): Prop[] => [
	{ model: food(name), placement: { at: [x, COUNTER_TOP, -0.45], scale } }
];

export const cafeStage: Stage = {
	setting: shop,
	pose: { at: [0, 1.6, 1.7], yaw: 0, pitch: -0.15 },
	npc: {
		model: { m: 'character-male-f', f: 'character-female-c' },
		scale: 1.9,
		start: [0, -1.65],
		route: [],
		// To the coffee machine and back.
		fetch: { route: [[0.9, -1.6]] },
		handOver: [0, -0.35]
	},
	give: {
		// The same sizes as at the restaurant table.
		coffee: onCounter('cup-coffee', 0.15, 0.6),
		tea: onCounter('cup-tea', 0.15, 0.7),
		croissant: onCounter('loaf-round', -0.25, 0.3)
	},
	extras: [{ model: 'character-female-a', at: [-2.5, 0.42, 1.9], rot: 180, animation: 'sit' }]
};
