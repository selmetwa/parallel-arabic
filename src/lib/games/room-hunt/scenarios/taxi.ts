/**
 * "Take a taxi": hail one at the curb, say where you're going, agree the fare,
 * give directions while it drives, and pay at the station.
 *
 * The car has no inside, so the camera stands at the curb, follows behind the
 * taxi while it drives, and is back on the pavement to pay.
 */
import { model, type Placement, type Room } from '../rooms';
import type { Scenario } from './scenario';
import type { Stage } from './stage';
import text from './taxi.json';

export const taxi: Scenario = {
	id: 'taxi',
	title: 'Take a taxi',
	emoji: '🚕',
	blurb: 'Say where you are going, haggle the fare, give directions and pay.',
	npcRole: 'Driver',
	npcGender: { 'egyptian-arabic': 'm', levantine: 'f', darija: 'm', fusha: 'm' },
	doneHeading: 'You made it to the station!',
	text: text as Scenario['text'],
	lines: {
		d_hello: { speaker: 'npc', english: 'Hello! Where to?' },
		d_price: { speaker: 'npc', english: 'The station? Fifty.' },
		d_forty: { speaker: 'npc', english: 'Fine, forty.' },
		d_lets_go: { speaker: 'npc', english: "Let's go!" },
		d_way: { speaker: 'npc', english: 'Do you know the way?' },
		d_here: { speaker: 'npc', english: 'Here?' },
		d_arrived: { speaker: 'npc', english: "Here we are. That's the station." },
		d_bye: { speaker: 'npc', english: 'Thank you! Have a good day.' },
		d_sorry: { speaker: 'npc', english: "Sorry? I didn't get that." },

		y_station: { speaker: 'you', english: 'To the train station, please.' },
		y_too_much: { speaker: 'you', english: "That's too much! Forty?" },
		y_ok_go: { speaker: 'you', english: "OK, let's go." },
		y_straight_right: { speaker: 'you', english: 'Go straight, then right at the traffic light.' },
		y_stop_here: { speaker: 'you', english: 'Yes, stop here, please.' },
		y_change: { speaker: 'you', english: 'Here you go. Keep the change.' },
		y_thanks_bye: { speaker: 'you', english: 'Thanks, goodbye!' },
		y_table_two: { speaker: 'you', english: 'A table for two, please.' },
		y_headache: { speaker: 'you', english: 'I have a headache.' },
		y_kilo: { speaker: 'you', english: 'One kilo, please.' },
		y_enjoy: { speaker: 'you', english: 'Enjoy your meal!' },
		y_welcome: { speaker: 'you', english: 'Welcome!' },
		y_faster: { speaker: 'you', english: 'Faster, please!' },
		y_menu: { speaker: 'you', english: 'The menu, please.' }
	},
	turns: [
		{
			id: 'hello',
			npc: 'd_hello',
			choices: [
				{ line: 'y_station', ok: true },
				{ line: 'y_table_two', ok: false },
				{ line: 'y_headache', ok: false }
			]
		},
		{
			id: 'fare',
			npc: 'd_price',
			choices: [
				{ line: 'y_too_much', ok: true, reply: 'd_forty' },
				{ line: 'y_ok_go', ok: true, reply: 'd_lets_go' },
				{ line: 'y_kilo', ok: false }
			]
		},
		{
			id: 'way',
			npc: 'd_way',
			choices: [
				{ line: 'y_straight_right', ok: true },
				{ line: 'y_enjoy', ok: false },
				{ line: 'y_welcome', ok: false }
			],
			drive: 'station'
		},
		{
			id: 'here',
			npc: 'd_here',
			choices: [
				{ line: 'y_stop_here', ok: true },
				{ line: 'y_faster', ok: false },
				{ line: 'y_kilo', ok: false }
			]
		},
		{
			id: 'pay',
			npc: 'd_arrived',
			choices: [
				{ line: 'y_change', ok: true },
				{ line: 'y_menu', ok: false },
				{ line: 'y_headache', ok: false }
			]
		},
		{
			id: 'bye',
			npc: 'd_bye',
			choices: [
				{ line: 'y_thanks_bye', ok: true },
				{ line: 'y_welcome', ok: false },
				{ line: 'y_too_much', ok: false }
			]
		}
	]
};

const road = model.roads;
const building = model.buildings;
/** Road tiles are 1×1; at ×4 a lane is two metres wide. */
const TILE = 4;

const tile = (name: string, x: number, z: number, rot = 0): { model: string; placements: Placement[] } => ({
	model: road(name),
	placements: [{ at: [x, 0.01, z], rot, scale: TILE }]
});

/**
 * Two streets: one running north past the player's curb, a crossroads at
 * z = -12, and one running east to the station.
 */
const street: Room = {
	id: 'street',
	label: 'Street',
	emoji: '🚕',
	size: [80, 80],
	height: 0,
	outdoor: true,
	colors: { floor: '#cfc8bc', wall: '#9fd3f2' },
	objects: [],
	decor: [
		// North–south road.
		// The straight tile runs east–west as modelled, so north–south ones turn 90°.
		...[16, 12, 8, 4, 0, -4, -8, -16, -20].map((z) => tile('road-straight', 0, z, 90)),
		tile('road-crossroad', 0, -12),
		// East–west road.
		...[-8, -4, 4, 8, 12, 16, 20, 24, 28].map((x) => tile('road-straight', x, -12)),
		// West side, facing the road.
		{
			model: building('building-a'),
			placements: [-4, 4, 10, 16].map((z) => ({ at: [-7.3, 0, z], rot: 90, scale: 6 }) as Placement)
		},
		// East side, behind the player.
		{
			model: building('building-c'),
			placements: [-4, 10, 16].map((z) => ({ at: [7.3, 0, z], rot: -90, scale: 6 }) as Placement)
		},
		{ model: building('building-h'), placements: [{ at: [7.3, 0, 3], rot: -90, scale: 6 }] },
		// North side of the east road; the station is the tall one at x = 20.
		{
			model: building('building-k'),
			placements: [8, 14, 26].map((x) => ({ at: [x, 0, -17.3], scale: 6 }) as Placement)
		},
		{ model: building('building-f'), placements: [{ at: [20, 0, -17.6], scale: 6.5 }] },
		// South side of the east road, set back to leave a pavement to stand on.
		{
			model: building('building-a'),
			placements: [14, 20, 26].map((x) => ({ at: [x, 0, -4], rot: 180, scale: 6 }) as Placement)
		},
		{
			model: road('light-square'),
			placements: [-6, 12].map((z) => ({ at: [2.4, 0, z], rot: -90, scale: 4 }) as Placement)
		},
		{ model: road('traffic-light'), placements: [{ at: [2.4, 0, -9.6], rot: 180, scale: 5 }] },
		{ model: model.car('sedan'), placements: [{ at: [-1, 0, -2], rot: 0, scale: 1.4 }] },
		{ model: model.car('van'), placements: [{ at: [10, 0, -13], rot: -90, scale: 1.4 }] }
	]
};

// Back from the kerb, so the taxi pulls up in view rather than filling it.
const CURB: Stage['pose'] = { at: [4.2, 1.6, 7], yaw: 0.45, pitch: -0.1 };

export const taxiStage: Stage = {
	setting: street,
	pose: CURB,
	give: {},
	vehicle: {
		model: model.car('taxi'),
		scale: 1.4,
		// Comes up from behind the player, in the northbound lane.
		start: [1, 22, 180],
		arrive: [[1, 2]],
		follow: [0, 3.4, -8],
		drives: {
			station: {
				path: [
					[1, -9.4],
					[1.3, -10.3],
					[2, -10.8],
					[3, -11],
					[19.5, -11]
				],
				// Out on the pavement across from the station.
				then: { at: [22.8, 1.6, -7.3], yaw: 0.4, pitch: -0.05 }
			}
		}
	}
};
