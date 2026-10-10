/**
 * "Asking the way": stop someone on the street, follow their directions, and
 * chat for a moment about where you're from.
 *
 * Nothing changes hands, so the stage only needs the street and the person
 * who walks up to help.
 */
import { model, type Placement, type Room } from '../rooms';
import type { Scenario } from './scenario';
import type { Stage } from './stage';
import text from './directions.json';

export const directions: Scenario = {
	id: 'directions',
	title: 'Asking the way',
	emoji: '🧭',
	blurb: 'Ask a passer-by for the museum or the station and follow their directions.',
	npcRole: 'Passer-by',
	npcGender: { 'egyptian-arabic': 'm', levantine: 'f', darija: 'm', fusha: 'm' },
	doneHeading: 'Found your way, in Arabic!',
	text: text as Scenario['text'],
	lines: {
		r_hello: { speaker: 'npc', english: 'Hello, can I help you?' },
		r_straight: { speaker: 'npc', english: 'Go straight ahead, then turn right at the lights.' },
		r_exactly: { speaker: 'npc', english: 'Exactly.' },
		r_then: { speaker: 'npc', english: "Then it's on your left, next to the bank." },
		r_ten_minutes: { speaker: 'npc', english: 'No, about ten minutes on foot.' },
		r_careful: { speaker: 'npc', english: 'Be careful crossing the road!' },
		r_from: { speaker: 'npc', english: 'Where are you from?' },
		r_welcome: { speaker: 'npc', english: 'Welcome! Enjoy your visit.' },
		r_bye: { speaker: 'npc', english: 'Goodbye!' },
		r_sorry: { speaker: 'npc', english: "Sorry? I didn't catch that." },
		y_museum: { speaker: 'you', english: 'Where is the museum, please?' },
		y_station: { speaker: 'you', english: 'Where is the train station, please?' },
		y_right_lights: { speaker: 'you', english: 'Right at the lights?' },
		y_far: { speaker: 'you', english: 'Is it far?' },
		y_walk: { speaker: 'you', english: "Great, I'll walk." },
		y_taxi: { speaker: 'you', english: "Maybe I'll take a taxi." },
		y_will_do: { speaker: 'you', english: 'I will!' },
		y_england: { speaker: 'you', english: "I'm from England." },
		y_america: { speaker: 'you', english: "I'm from America." },
		y_thanks_lot: { speaker: 'you', english: 'Thank you very much!' },
		y_bye: { speaker: 'you', english: 'Goodbye!' },
		y_two_kilos: { speaker: 'you', english: 'Two kilos.' },
		y_tea: { speaker: 'you', english: 'Tea, please.' },
		y_too_expensive: { speaker: 'you', english: "That's expensive! Twenty?" },
		y_enjoy: { speaker: 'you', english: 'Enjoy your meal!' },
		y_welcome: { speaker: 'you', english: 'Welcome!' }
	},
	turns: [
		{
			id: 'hello',
			npc: 'r_hello',
			choices: [
				{ line: 'y_museum', ok: true },
				{ line: 'y_station', ok: true },
				{ line: 'y_two_kilos', ok: false }
			]
		},
		{
			id: 'straight',
			npc: 'r_straight',
			choices: [
				{ line: 'y_right_lights', ok: true, reply: 'r_exactly' },
				{ line: 'y_enjoy', ok: false }
			]
		},
		{
			id: 'then',
			npc: 'r_then',
			choices: [
				{ line: 'y_far', ok: true },
				{ line: 'y_tea', ok: false }
			]
		},
		{
			id: 'distance',
			npc: 'r_ten_minutes',
			choices: [
				{ line: 'y_walk', ok: true },
				{ line: 'y_taxi', ok: true },
				{ line: 'y_too_expensive', ok: false }
			]
		},
		{
			id: 'careful',
			npc: 'r_careful',
			choices: [
				{ line: 'y_will_do', ok: true },
				{ line: 'y_welcome', ok: false }
			]
		},
		{
			id: 'from',
			npc: 'r_from',
			choices: [
				{ line: 'y_england', ok: true },
				{ line: 'y_america', ok: true },
				{ line: 'y_two_kilos', ok: false }
			]
		},
		{
			id: 'welcome',
			npc: 'r_welcome',
			choices: [
				{ line: 'y_thanks_lot', ok: true },
				{ line: 'y_enjoy', ok: false }
			]
		},
		{
			id: 'bye',
			npc: 'r_bye',
			choices: [
				{ line: 'y_bye', ok: true },
				{ line: 'y_tea', ok: false }
			]
		}
	]
};

const road = model.roads;
const building = model.buildings;
/** Road tiles are 1×1; at ×4 a lane is two metres wide. */
const TILE = 4;
const tile = (name: string, x: number, z: number, rot = 0) => ({
	model: road(name),
	placements: [{ at: [x, 0.01, z], rot, scale: TILE }] as Placement[]
});

const street: Room = {
	id: 'street-corner',
	label: 'Street corner',
	emoji: '🧭',
	size: [70, 70],
	height: 0,
	outdoor: true,
	colors: { floor: '#d3cbbd', wall: '#a6d6f2' },
	objects: [],
	decor: [
		// A road ahead, running left to right, with a crossroads with lights.
		...[-16, -12, -8, -4, 4, 8, 12, 16].map((x) => tile('road-straight', x, -6)),
		tile('road-crossroad', 0, -6),
		...[-14, -10].map((z) => tile('road-straight', 0, z, 90)),
		{ model: road('traffic-light'), placements: [{ at: [2.4, 0, -3.6], rot: 180, scale: 5 }] },
		{
			model: road('light-square'),
			placements: [-9, 9].map((x) => ({ at: [x, 0, -3.6], rot: 180, scale: 4 }) as Placement)
		},
		// Across the road.
		{
			model: building('building-k'),
			placements: [-12, -6, 6, 12].map((x) => ({ at: [x, 0, -12.5], scale: 6 }) as Placement)
		},
		// Your side of the road, behind and beside you.
		{
			model: building('building-a'),
			placements: [
				{ at: [-7.5, 0, 3], rot: 90, scale: 6 },
				{ at: [7.5, 0, 3], rot: -90, scale: 6 }
			]
		},
		{ model: building('detail-awning-wide'), placements: [{ at: [-5, 0, 0.5], rot: 90, scale: 5 }] },
		{ model: model.car('sedan'), placements: [{ at: [-8, 0, -7], rot: 90, scale: 1.4 }] }
	]
};

export const directionsStage: Stage = {
	setting: street,
	pose: { at: [0, 1.6, 4], yaw: 0, pitch: -0.08 },
	npc: {
		// Walks up the pavement to you.
		model: { m: 'character-male-b', f: 'character-female-b' },
		start: [-4, 0],
		route: [[-0.3, 2.4]]
	},
	give: {},
	extras: [
		{ model: 'character-female-c', at: [5, 0, -1], rot: -60, animation: 'idle' },
		{ model: 'character-male-f', at: [-5.5, 0, 1.2], rot: 120, animation: 'idle' }
	]
};
