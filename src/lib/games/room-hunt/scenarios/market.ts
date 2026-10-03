/**
 * "Shop at the market": buy fruit and veg at a stall, haggle, and pay.
 */
import { model, type Placement, type Room } from '../rooms';
import type { Scenario } from './scenario';
import type { Prop, Stage } from './stage';
import text from './market.json';

export const market: Scenario = {
	id: 'market',
	title: 'Shop at the market',
	emoji: '🍅',
	blurb: 'Ask for fruit and veg, say how many kilos, haggle the price and pay.',
	npcRole: 'Seller',
	npcGender: { 'egyptian-arabic': 'm', levantine: 'f', darija: 'm', fusha: 'm' },
	doneHeading: 'Shopping done in Arabic!',
	text: text as Scenario['text'],
	lines: {
		m_hello: { speaker: 'npc', english: 'Good morning! What would you like?' },
		m_kilos: { speaker: 'npc', english: 'How many kilos?' },
		m_here: { speaker: 'npc', english: 'Here you go. Anything else?' },
		m_price: { speaker: 'npc', english: "That's thirty." },
		m_twentyfive: { speaker: 'npc', english: 'OK, twenty-five, just for you.' },
		m_bye: { speaker: 'npc', english: 'Thank you! Come again.' },
		m_sorry: { speaker: 'npc', english: 'Sorry? What did you say?' },

		y_tomatoes: { speaker: 'you', english: 'Tomatoes, please.' },
		y_oranges: { speaker: 'you', english: 'Oranges, please.' },
		y_one_kilo: { speaker: 'you', english: 'One kilo.' },
		y_two_kilos: { speaker: 'you', english: 'Two kilos.' },
		y_how_much: { speaker: 'you', english: 'No, thanks. How much is it?' },
		y_too_expensive: { speaker: 'you', english: "That's expensive! Twenty?" },
		y_ok_here: { speaker: 'you', english: 'OK, here you go.' },
		y_thanks_bye: { speaker: 'you', english: 'Thanks, goodbye!' },
		y_stop_here: { speaker: 'you', english: 'Stop here, please.' },
		y_tea: { speaker: 'you', english: 'Tea, please.' },
		y_enjoy: { speaker: 'you', english: 'Enjoy your meal!' },
		y_bill: { speaker: 'you', english: 'The bill, please.' },
		y_welcome: { speaker: 'you', english: 'Welcome!' },

		item_tomatoes: { speaker: 'item', english: 'tomatoes' },
		item_oranges: { speaker: 'item', english: 'oranges' }
	},
	turns: [
		{
			id: 'hello',
			npc: 'm_hello',
			choices: [
				{ line: 'y_tomatoes', ok: true, give: 'tomatoes' },
				{ line: 'y_oranges', ok: true, give: 'oranges' },
				{ line: 'y_stop_here', ok: false }
			]
		},
		{
			id: 'kilos',
			npc: 'm_kilos',
			choices: [
				{ line: 'y_one_kilo', ok: true },
				{ line: 'y_two_kilos', ok: true },
				{ line: 'y_tea', ok: false }
			],
			fetch: true
		},
		{
			id: 'more',
			npc: 'm_here',
			choices: [
				{ line: 'y_how_much', ok: true },
				{ line: 'y_enjoy', ok: false },
				{ line: 'y_welcome', ok: false }
			]
		},
		{
			id: 'price',
			npc: 'm_price',
			choices: [
				{ line: 'y_too_expensive', ok: true, reply: 'm_twentyfive' },
				{ line: 'y_ok_here', ok: true },
				{ line: 'y_bill', ok: false }
			]
		},
		{
			id: 'bye',
			npc: 'm_bye',
			choices: [
				{ line: 'y_thanks_bye', ok: true },
				{ line: 'y_welcome', ok: false },
				{ line: 'y_tomatoes', ok: false }
			]
		}
	]
};

const f = model.furniture;
const food = model.food;
/** The stall tables are lowered so the seller, who is not tall, shows above them. */
const TOP = 0.49;
/** The seller's stall: a table under an awning, two metres in front of the player. */
const STALL_Z = -1.6;

/** A little heap of one fruit: five pieces in a tight cluster. */
function heap(name: string, x: number, z: number, scale: number): { model: string; placements: Placement[] } {
	const spots: [number, number][] = [
		[0, 0],
		[0.13, 0.05],
		[-0.12, 0.06],
		[0.05, -0.11],
		[-0.06, -0.1]
	];
	return {
		model: food(name),
		placements: spots.map(([dx, dz], i) => ({
			at: [x + dx, TOP + (i === 0 ? 0.06 : 0), z + dz],
			rot: i * 47,
			scale
		}))
	};
}

/** A stall: table, awning, and whatever is heaped on it. */
function stall(x: number, z: number, heaps: { model: string; placements: Placement[] }[]) {
	return [
		{ model: f('table'), placements: [{ at: [x, 0, z], scale: [2, 1.5, 2] } as Placement] },
		{ model: model.buildings('detail-awning-wide'), placements: [{ at: [x, 1.75, z - 0.6], scale: 3 } as Placement] },
		...heaps
	];
}

const marketStreet: Room = {
	id: 'market',
	label: 'Market',
	emoji: '🍅',
	size: [60, 60],
	height: 0,
	outdoor: true,
	colors: { floor: '#d9c9a6', wall: '#a7d8f0' },
	objects: [],
	decor: [
		// The seller's stall, front and centre.
		...stall(0, STALL_Z, [
			heap('tomato', -0.45, STALL_Z, 1.4),
			heap('orange', 0.45, STALL_Z, 1.4),
			heap('lemon', 0, STALL_Z - 0.2, 1.2)
		]),
		// Neighbours on either side.
		...stall(-2.6, STALL_Z - 0.4, [
			{ model: food('watermelon'), placements: [{ at: [-2.9, TOP, STALL_Z - 0.4], scale: 1 }, { at: [-2.3, TOP, STALL_Z - 0.5], rot: 40, scale: 1 }] },
			heap('cabbage', -2.6, STALL_Z - 0.15, 0.9)
		]),
		...stall(2.6, STALL_Z - 0.4, [
			heap('eggplant', 2.3, STALL_Z - 0.4, 1),
			heap('onion', 2.9, STALL_Z - 0.4, 1.1),
			heap('carrot', 2.6, STALL_Z - 0.15, 0.6)
		]),
		{
			model: model.buildings('building-c'),
			placements: [-11, -5.5, 0, 5.5, 11].map((x) => ({ at: [x, 0, -8.5], scale: 6 }) as Placement)
		},
		{
			model: model.buildings('building-a'),
			placements: [
				{ at: [-9, 0, 2], rot: 90, scale: 6 },
				{ at: [9, 0, 2], rot: -90, scale: 6 }
			]
		},
		{ model: model.buildings('detail-parasol-a'), placements: [{ at: [-5, 0, 0.5], scale: 5 }, { at: [5, 0, -0.5], scale: 5 }] }
	]
};

/** A bag of what was bought, and a few pieces next to it, at the front of the stall. */
function bagOf(fruit: string, scale: number): Prop[] {
	return [
		{ model: food('bag'), placement: { at: [0.15, TOP, STALL_Z + 0.25], rot: 20, scale: 0.9 } },
		{ model: food(fruit), placement: { at: [-0.15, TOP, STALL_Z + 0.3], scale } },
		{ model: food(fruit), placement: { at: [-0.3, TOP, STALL_Z + 0.22], rot: 60, scale } }
	];
}

export const marketStage: Stage = {
	setting: marketStreet,
	pose: { at: [0, 1.6, 1.2], yaw: 0, pitch: -0.2 },
	npc: {
		model: { m: 'character-male-a', f: 'character-female-f' },
		scale: 1.9,
		start: [0, STALL_Z - 0.95],
		route: [],
		// Bags it up without moving: a pick-up, then the hand-over.
		fetch: { route: [] },
		handOver: [0, STALL_Z + 0.3]
	},
	give: {
		tomatoes: bagOf('tomato', 1.4),
		oranges: bagOf('orange', 1.4)
	},
	extras: [
		{ model: 'character-male-f', at: [-2.6, 0, STALL_Z - 1.4], rot: 0, animation: 'idle' },
		{ model: 'character-female-c', at: [-4.2, 0, 0.4], rot: 120, animation: 'idle' }
	]
};
