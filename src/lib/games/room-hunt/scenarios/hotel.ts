/**
 * "Check in at a hotel": give your name, say how many nights, hand over your
 * passport, get the key and ask about breakfast and the wifi.
 */
import { model, type Placement, type Room } from '../rooms';
import type { Scenario } from './scenario';
import type { Stage } from './stage';
import text from './hotel.json';

export const hotel: Scenario = {
	id: 'hotel',
	title: 'Check in at a hotel',
	emoji: '🛎️',
	blurb: 'Give your name and how many nights, get your key, ask about breakfast.',
	npcRole: 'Receptionist',
	npcGender: { 'egyptian-arabic': 'f', levantine: 'f', darija: 'm', fusha: 'm' },
	doneHeading: 'Checked in, in Arabic!',
	text: text as Scenario['text'],
	lines: {
		h_hello: { speaker: 'npc', english: 'Good evening, welcome to the hotel!' },
		h_name: { speaker: 'npc', english: "What's your name, please?" },
		h_nights: { speaker: 'npc', english: 'For how many nights?' },
		h_passport: { speaker: 'npc', english: 'May I see your passport?' },
		h_key: { speaker: 'npc', english: "Here's your key. Your room is on the third floor." },
		h_breakfast: { speaker: 'npc', english: 'From seven to ten, in the restaurant.' },
		h_wifi: { speaker: 'npc', english: 'The password is on the card.' },
		h_enjoy: { speaker: 'npc', english: 'Enjoy your stay!' },
		h_sorry: { speaker: 'npc', english: "Sorry? I didn't understand." },

		y_reservation: { speaker: 'you', english: 'Good evening. I have a reservation.' },
		y_name: { speaker: 'you', english: 'My name is Adam.' },
		y_two_nights: { speaker: 'you', english: 'Two nights.' },
		y_three_nights: { speaker: 'you', english: 'Three nights.' },
		y_passport: { speaker: 'you', english: 'Of course, here you go.' },
		y_breakfast: { speaker: 'you', english: 'Thank you. What time is breakfast?' },
		y_wifi: { speaker: 'you', english: 'And the wifi password?' },
		y_great: { speaker: 'you', english: 'Great, thank you!' },
		y_good_night: { speaker: 'you', english: 'Thank you, good night!' },
		y_two_kilos: { speaker: 'you', english: 'Two kilos.' },
		y_stop_here: { speaker: 'you', english: 'Stop here, please.' },
		y_headache: { speaker: 'you', english: 'I have a headache.' },
		y_enjoy: { speaker: 'you', english: 'Enjoy your meal!' },
		y_too_expensive: { speaker: 'you', english: "That's expensive! Twenty?" },
		y_welcome: { speaker: 'you', english: 'Welcome!' },

		item_key: { speaker: 'item', english: 'room key' }
	},
	turns: [
		{
			id: 'hello',
			npc: 'h_hello',
			choices: [
				{ line: 'y_reservation', ok: true },
				{ line: 'y_two_kilos', ok: false },
				{ line: 'y_stop_here', ok: false }
			]
		},
		{
			id: 'name',
			npc: 'h_name',
			choices: [
				{ line: 'y_name', ok: true },
				{ line: 'y_headache', ok: false },
				{ line: 'y_enjoy', ok: false }
			]
		},
		{
			id: 'nights',
			npc: 'h_nights',
			choices: [
				{ line: 'y_two_nights', ok: true },
				{ line: 'y_three_nights', ok: true },
				{ line: 'y_two_kilos', ok: false }
			]
		},
		{
			id: 'passport',
			npc: 'h_passport',
			choices: [
				{ line: 'y_passport', ok: true, give: 'key' },
				{ line: 'y_too_expensive', ok: false },
				{ line: 'y_welcome', ok: false }
			],
			fetch: true
		},
		{
			id: 'key',
			npc: 'h_key',
			choices: [
				{ line: 'y_breakfast', ok: true },
				{ line: 'y_enjoy', ok: false },
				{ line: 'y_welcome', ok: false }
			]
		},
		{
			id: 'breakfast',
			npc: 'h_breakfast',
			choices: [
				{ line: 'y_wifi', ok: true, reply: 'h_wifi' },
				{ line: 'y_great', ok: true },
				{ line: 'y_headache', ok: false }
			]
		},
		{
			id: 'bye',
			npc: 'h_enjoy',
			choices: [
				{ line: 'y_good_night', ok: true },
				{ line: 'y_welcome', ok: false },
				{ line: 'y_two_nights', ok: false }
			]
		}
	]
};

const f = model.furniture;
/** A low desk, so the receptionist shows above it. */
const DESK_TOP = 0.715;

const lobby: Room = {
	id: 'hotel',
	label: 'Hotel lobby',
	emoji: '🛎️',
	size: [7, 6],
	height: 3,
	colors: { floor: '#b8987a', wall: '#efe5d3' },
	objects: [],
	decor: [
		// The reception desk.
		{
			model: f('kitchenBar'),
			placements: [-0.95, 0, 0.95].map((x) => ({ at: [x, 0, -0.8], scale: [2.2, 1.7, 2.2] }) as Placement)
		},
		{ model: f('books'), placements: [{ at: [-0.9, DESK_TOP, -0.85], rot: 20, scale: 1.6 }] },
		{ model: f('lampSquareTable'), placements: [{ at: [1.1, DESK_TOP, -0.85], scale: 2 }] },
		// Behind the desk: cupboards (where the keys live) and plants.
		{
			model: f('bookcaseClosed'),
			placements: [-1.5, -0.5, 0.5, 1.5].map((x) => ({ at: [x, 0, -2.7], scale: 2.4 }) as Placement)
		},
		{ model: f('pottedPlant'), placements: [{ at: [-3.0, 0, -2.4], scale: 2.4 }, { at: [3.0, 0, -2.4], scale: 2.4 }] },
		// A sitting area to the left.
		{ model: f('loungeSofa'), placements: [{ at: [-2.85, 0, 1.2], rot: 90, scale: 2 }] },
		{ model: f('tableCoffee'), placements: [{ at: [-1.8, 0, 1.2], rot: 90, scale: 2 }] },
		{ model: f('rugRectangle'), placements: [{ at: [0, 0, 1.4], scale: 2 }] },
		{ model: f('lampSquareFloor'), placements: [{ at: [3.0, 0, 1.5], scale: 2.2 }] }
	]
};

export const hotelStage: Stage = {
	setting: lobby,
	pose: { at: [0, 1.6, 1.9], yaw: 0, pitch: -0.12 },
	npc: {
		// The ones in suits.
		model: { m: 'character-male-d', f: 'character-female-d' },
		scale: 1.9,
		start: [0, -1.65],
		route: [],
		// To the key cupboard and back.
		fetch: { route: [[0.5, -2.2]] },
		handOver: [0, -0.4]
	},
	give: {
		key: [{ model: f('books'), placement: { at: [0.2, DESK_TOP, -0.55], rot: -10, scale: 1.1 } }]
	},
	extras: [{ model: 'character-female-a', at: [-2.85, 0.42, 1.2], rot: 90, animation: 'sit' }]
};
