/**
 * "At the airport": check in for a flight, from the passport to the boarding
 * pass, then find out where the gate is and when boarding starts.
 */
import { model, type Placement, type Room } from '../rooms';
import type { Scenario } from './scenario';
import type { Stage } from './stage';
import text from './airport.json';

export const airport: Scenario = {
	id: 'airport',
	title: 'At the airport',
	emoji: '✈️',
	blurb: 'Check in for your flight, choose a seat and find your gate.',
	npcRole: 'Check-in agent',
	npcGender: { 'egyptian-arabic': 'f', levantine: 'f', darija: 'm', fusha: 'm' },
	doneHeading: 'Checked in, in Arabic!',
	text: text as Scenario['text'],
	lines: {
		a_hello: { speaker: 'npc', english: 'Good morning. Your passport, please.' },
		a_where: { speaker: 'npc', english: 'Where are you flying to?' },
		a_bags: { speaker: 'npc', english: 'How many bags are you checking in?' },
		a_scale: { speaker: 'npc', english: 'Put it on the scale, please.' },
		a_heavy: { speaker: 'npc', english: "It's a little heavy, but it's fine." },
		a_seat: { speaker: 'npc', english: 'Window or aisle?' },
		a_board: { speaker: 'npc', english: "Here's your boarding pass. Gate twelve." },
		a_left: { speaker: 'npc', english: 'Straight ahead, on the left.' },
		a_time: { speaker: 'npc', english: 'Boarding is at half past ten.' },
		a_trip: { speaker: 'npc', english: 'Have a good flight!' },
		a_sorry: { speaker: 'npc', english: 'Sorry? Could you say that again?' },
		y_passport: { speaker: 'you', english: "Here's my passport." },
		y_cairo: { speaker: 'you', english: 'To Cairo.' },
		y_dubai: { speaker: 'you', english: 'To Dubai.' },
		y_one_bag: { speaker: 'you', english: 'One bag.' },
		y_two_bags: { speaker: 'you', english: 'Two bags.' },
		y_ok: { speaker: 'you', english: 'OK.' },
		y_phew: { speaker: 'you', english: 'Phew, thank you.' },
		y_window: { speaker: 'you', english: 'Window, please.' },
		y_aisle: { speaker: 'you', english: 'Aisle, please.' },
		y_where_gate: { speaker: 'you', english: 'Where is gate twelve?' },
		y_thanks: { speaker: 'you', english: 'Thank you.' },
		y_ok_thanks: { speaker: 'you', english: 'OK, thank you.' },
		y_bye: { speaker: 'you', english: 'Thanks, bye!' },
		y_two_kilos: { speaker: 'you', english: 'Two kilos.' },
		y_stop_here: { speaker: 'you', english: 'Stop here, please.' },
		y_tea: { speaker: 'you', english: 'Tea, please.' },
		y_enjoy: { speaker: 'you', english: 'Enjoy your meal!' },
		y_welcome: { speaker: 'you', english: 'Welcome!' },
		item_boarding_pass: { speaker: 'item', english: 'boarding pass' }
	},
	turns: [
		{
			id: 'hello',
			npc: 'a_hello',
			choices: [
				{ line: 'y_passport', ok: true },
				{ line: 'y_tea', ok: false },
				{ line: 'y_enjoy', ok: false }
			]
		},
		{
			id: 'where',
			npc: 'a_where',
			choices: [
				{ line: 'y_cairo', ok: true },
				{ line: 'y_dubai', ok: true },
				{ line: 'y_two_kilos', ok: false }
			]
		},
		{
			id: 'bags',
			npc: 'a_bags',
			choices: [
				{ line: 'y_one_bag', ok: true },
				{ line: 'y_two_bags', ok: true },
				{ line: 'y_welcome', ok: false }
			]
		},
		{
			id: 'scale',
			npc: 'a_scale',
			choices: [
				{ line: 'y_ok', ok: true },
				{ line: 'y_stop_here', ok: false }
			]
		},
		{
			id: 'heavy',
			npc: 'a_heavy',
			choices: [
				{ line: 'y_phew', ok: true },
				{ line: 'y_enjoy', ok: false }
			]
		},
		{
			id: 'seat',
			npc: 'a_seat',
			choices: [
				{ line: 'y_window', ok: true, give: 'boarding_pass' },
				{ line: 'y_aisle', ok: true, give: 'boarding_pass' },
				{ line: 'y_two_kilos', ok: false }
			],
			fetch: true
		},
		{
			id: 'board',
			npc: 'a_board',
			choices: [
				{ line: 'y_where_gate', ok: true, reply: 'a_left' },
				{ line: 'y_thanks', ok: true },
				{ line: 'y_tea', ok: false }
			]
		},
		{
			id: 'time',
			npc: 'a_time',
			choices: [
				{ line: 'y_ok_thanks', ok: true },
				{ line: 'y_welcome', ok: false }
			]
		},
		{
			id: 'bye',
			npc: 'a_trip',
			choices: [
				{ line: 'y_bye', ok: true },
				{ line: 'y_stop_here', ok: false }
			]
		}
	]
};

const f = model.furniture;
/** The check-in desk, the same build as the hotel's reception. */
const DESK_TOP = 0.715;

const hall: Room = {
	id: 'airport',
	label: 'Check-in hall',
	emoji: '✈️',
	size: [9, 7],
	height: 3.4,
	colors: { floor: '#d6d6d2', wall: '#e8eef3' },
	objects: [],
	decor: [
		// Three check-in desks; you're at the middle one.
		...[-3, 0, 3].map((cx) => ({
			model: f('kitchenBar'),
			placements: [-0.95, 0, 0.95].map(
				(x) => ({ at: [cx + x, 0, -0.8], scale: [2.2, 1.7, 2.2] }) as Placement
			)
		})),
		{ model: f('lampSquareTable'), placements: [{ at: [1.1, DESK_TOP, -0.85], scale: 2 }] },
		// Windows onto the runway along the back wall.
		{
			model: f('wallWindow'),
			placements: [-3, -1, 1, 3].map((x) => ({ at: [x, 0, -3.45], scale: 2.4 }) as Placement)
		},
		// Your suitcase, and other people's bags.
		{
			model: f('cardboardBoxClosed'),
			placements: [
				{ at: [0.7, 0, 0.6], rot: 10, scale: 2.2 },
				{ at: [-3.2, 0, 0.3], rot: -20, scale: 2 },
				{ at: [3.3, 0, 0.2], rot: 30, scale: 1.8 }
			]
		},
		{ model: f('pottedPlant'), placements: [{ at: [-4.2, 0, -2.9], scale: 2.4 }, { at: [4.2, 0, -2.9], scale: 2.4 }] },
		{ model: f('loungeSofa'), placements: [{ at: [-4, 0, 2.4], rot: 90, scale: 2 }] }
	]
};

export const airportStage: Stage = {
	setting: hall,
	pose: { at: [0, 1.6, 1.9], yaw: 0, pitch: -0.12 },
	npc: {
		// The ones in suits.
		model: { m: 'character-male-d', f: 'character-female-d' },
		scale: 1.9,
		start: [0, -1.65],
		route: [],
		// Prints the boarding pass without leaving the desk.
		fetch: { route: [] },
		handOver: [0, -0.4]
	},
	give: {
		boarding_pass: [{ model: f('books'), placement: { at: [0.2, DESK_TOP, -0.55], rot: -10, scale: 1.1 } }]
	},
	extras: [
		{ model: 'character-male-a', at: [-3, 0, -1.65], rot: 0, animation: 'idle' },
		{ model: 'character-female-a', at: [-3, 0, 0.6], rot: 180, animation: 'idle' },
		{ model: 'character-male-f', at: [3, 0, 0.5], rot: 180, animation: 'idle' }
	]
};
