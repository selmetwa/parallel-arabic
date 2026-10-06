/**
 * "At the pharmacy": say what's wrong, answer the pharmacist's questions, and
 * get the right medicine with how to take it.
 */
import { model, type Placement, type Room } from '../rooms';
import type { Scenario } from './scenario';
import type { Stage } from './stage';
import text from './pharmacy.json';

export const pharmacy: Scenario = {
	id: 'pharmacy',
	title: 'At the pharmacy',
	emoji: '💊',
	blurb: 'Say what hurts, answer a few questions and get the right medicine.',
	npcRole: 'Pharmacist',
	npcGender: { 'egyptian-arabic': 'f', levantine: 'f', darija: 'm', fusha: 'm' },
	doneHeading: 'Medicine bought in Arabic!',
	text: text as Scenario['text'],
	lines: {
		p_hello: { speaker: 'npc', english: 'Hello, how can I help you?' },
		p_since: { speaker: 'npc', english: 'Since when?' },
		p_fever: { speaker: 'npc', english: 'Do you have a fever?' },
		p_allergy: { speaker: 'npc', english: 'Are you allergic to any medicine?' },
		p_other: { speaker: 'npc', english: 'Are you taking any other medicine?' },
		p_eaten: { speaker: 'npc', english: 'Have you eaten today?' },
		p_take: { speaker: 'npc', english: 'Take this three times a day, after food.' },
		p_exactly: { speaker: 'npc', english: 'Exactly.' },
		p_water: { speaker: 'npc', english: 'And drink lots of water.' },
		p_doctor: { speaker: 'npc', english: "If it's not better in three days, see a doctor." },
		p_else: { speaker: 'npc', english: 'Anything else?' },
		p_price: { speaker: 'npc', english: "That's fifteen." },
		p_bye: { speaker: 'npc', english: 'Get well soon!' },
		p_sorry: { speaker: 'npc', english: "Sorry? I didn't understand." },
		y_headache: { speaker: 'you', english: 'I have a headache.' },
		y_stomach: { speaker: 'you', english: 'My stomach hurts.' },
		y_cough: { speaker: 'you', english: 'I have a cough.' },
		y_yesterday: { speaker: 'you', english: 'Since yesterday.' },
		y_morning: { speaker: 'you', english: 'Since this morning.' },
		y_no: { speaker: 'you', english: 'No.' },
		y_little: { speaker: 'you', english: 'Yes, a little.' },
		y_not_allergic: { speaker: 'you', english: "No, I'm not." },
		y_penicillin: { speaker: 'you', english: 'Yes, to penicillin.' },
		y_nothing: { speaker: 'you', english: 'No, nothing.' },
		y_had_breakfast: { speaker: 'you', english: 'Yes, I had breakfast.' },
		y_not_yet: { speaker: 'you', english: 'Not yet.' },
		y_repeat: { speaker: 'you', english: 'Three times a day, after food?' },
		y_will: { speaker: 'you', english: 'OK, I will.' },
		y_ok_thanks: { speaker: 'you', english: 'OK, thank you.' },
		y_thanks_how_much: { speaker: 'you', english: 'Thank you. How much is it?' },
		y_here_you_go: { speaker: 'you', english: 'Here you go.' },
		y_thanks_bye: { speaker: 'you', english: 'Thanks, goodbye!' },
		y_two_kilos: { speaker: 'you', english: 'Two kilos.' },
		y_stop_here: { speaker: 'you', english: 'Stop here, please.' },
		y_enjoy: { speaker: 'you', english: 'Enjoy your meal!' },
		y_welcome: { speaker: 'you', english: 'Welcome!' },
		y_tea: { speaker: 'you', english: 'Tea, please.' },
		y_too_expensive: { speaker: 'you', english: "That's expensive! Twenty?" },
		item_pills: { speaker: 'item', english: 'pills' },
		item_syrup: { speaker: 'item', english: 'cough syrup' }
	},
	turns: [
		{
			id: 'hello',
			npc: 'p_hello',
			choices: [
				{ line: 'y_headache', ok: true, give: 'pills' },
				{ line: 'y_stomach', ok: true, give: 'pills' },
				{ line: 'y_cough', ok: true, give: 'syrup' },
				{ line: 'y_two_kilos', ok: false }
			]
		},
		{
			id: 'since',
			npc: 'p_since',
			choices: [
				{ line: 'y_yesterday', ok: true },
				{ line: 'y_morning', ok: true },
				{ line: 'y_stop_here', ok: false }
			]
		},
		{
			id: 'fever',
			npc: 'p_fever',
			choices: [
				{ line: 'y_no', ok: true },
				{ line: 'y_little', ok: true },
				{ line: 'y_enjoy', ok: false }
			]
		},
		{
			id: 'allergy',
			npc: 'p_allergy',
			choices: [
				{ line: 'y_not_allergic', ok: true },
				{ line: 'y_penicillin', ok: true },
				{ line: 'y_two_kilos', ok: false }
			]
		},
		{
			id: 'other',
			npc: 'p_other',
			choices: [
				{ line: 'y_nothing', ok: true },
				{ line: 'y_welcome', ok: false },
				{ line: 'y_tea', ok: false }
			]
		},
		{
			id: 'eaten',
			npc: 'p_eaten',
			choices: [
				{ line: 'y_had_breakfast', ok: true },
				{ line: 'y_not_yet', ok: true },
				{ line: 'y_stop_here', ok: false }
			],
			fetch: true
		},
		{
			id: 'dose',
			npc: 'p_take',
			choices: [
				{ line: 'y_repeat', ok: true, reply: 'p_exactly' },
				{ line: 'y_welcome', ok: false },
				{ line: 'y_tea', ok: false }
			]
		},
		{
			id: 'water',
			npc: 'p_water',
			choices: [
				{ line: 'y_will', ok: true },
				{ line: 'y_enjoy', ok: false },
				{ line: 'y_two_kilos', ok: false }
			]
		},
		{
			id: 'doctor',
			npc: 'p_doctor',
			choices: [
				{ line: 'y_ok_thanks', ok: true },
				{ line: 'y_welcome', ok: false },
				{ line: 'y_stop_here', ok: false }
			]
		},
		{
			id: 'else',
			npc: 'p_else',
			choices: [
				{ line: 'y_thanks_how_much', ok: true },
				{ line: 'y_tea', ok: false },
				{ line: 'y_enjoy', ok: false }
			]
		},
		{
			id: 'pay',
			npc: 'p_price',
			choices: [
				{ line: 'y_here_you_go', ok: true },
				{ line: 'y_too_expensive', ok: false },
				{ line: 'y_welcome', ok: false }
			]
		},
		{
			id: 'bye',
			npc: 'p_bye',
			choices: [
				{ line: 'y_thanks_bye', ok: true },
				{ line: 'y_enjoy', ok: false },
				{ line: 'y_two_kilos', ok: false }
			]
		}
	]
};

const f = model.furniture;
/** A low counter, so the pharmacist shows above it. */
const COUNTER_TOP = 0.72;

const shop: Room = {
	id: 'pharmacy',
	label: 'Pharmacy',
	emoji: '💊',
	size: [6, 5],
	height: 2.8,
	colors: { floor: '#dfe7e4', wall: '#f3faf6' },
	objects: [],
	decor: [
		// The counter, facing the player.
		{
			model: f('kitchenCabinet'),
			placements: [-0.86, 0, 0.86].map((x) => ({ at: [x, 0, -0.6], scale: [2, 1.6, 2] }) as Placement)
		},
		// Shelves of medicine along the back wall.
		{
			model: f('bookcaseOpen'),
			placements: [-1.9, -0.95, 0.95, 1.9].map((x) => ({ at: [x, 0, -2.2], scale: 2.4 }) as Placement)
		},
		{
			model: f('cardboardBoxClosed'),
			placements: [-1.9, -0.95, 0.95, 1.9].flatMap((x) =>
				[0.12, 0.62, 1.12, 1.6].map(
					(y, i) => ({ at: [x + (i % 2 ? 0.12 : -0.12), y, -2.15], rot: i * 15, scale: 0.9 }) as Placement
				)
			)
		},
		// A few boxes on the counter, and something green.
		{
			model: f('cardboardBoxClosed'),
			placements: [{ at: [-1.1, COUNTER_TOP, -0.65], rot: 10, scale: 0.6 }]
		},
		{ model: f('pottedPlant'), placements: [{ at: [2.5, 0, 1.6], scale: 2 }] },
		{ model: f('plantSmall1'), placements: [{ at: [1.15, COUNTER_TOP, -0.7], scale: 2.5 }] }
	]
};

export const pharmacyStage: Stage = {
	setting: shop,
	pose: { at: [0, 1.6, 1.6], yaw: 0, pitch: -0.15 },
	npc: {
		// The ones in white coats.
		model: { m: 'character-male-e', f: 'character-female-e' },
		scale: 1.9,
		start: [0, -1.55],
		route: [],
		// To the shelves and back.
		fetch: { route: [[0.75, -1.85]] },
		handOver: [0, -0.3]
	},
	give: {
		pills: [
			{
				model: f('cardboardBoxClosed'),
				placement: { at: [0.15, COUNTER_TOP, -0.35], rot: -15, scale: 0.65 }
			}
		],
		syrup: [
			{ model: model.food('bottle-oil'), placement: { at: [0.15, COUNTER_TOP, -0.4], scale: 0.5 } }
		]
	}
};
