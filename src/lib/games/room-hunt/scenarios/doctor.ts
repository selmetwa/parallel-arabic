/**
 * "At the doctor's": say what hurts and since when, answer a few questions,
 * get examined, and leave with a prescription and some advice.
 */
import { model, type Placement, type Room } from '../rooms';
import type { Scenario } from './scenario';
import type { Stage } from './stage';
import text from './doctor.json';

export const doctor: Scenario = {
	id: 'doctor',
	title: "At the doctor's",
	emoji: '🩺',
	blurb: 'Say what hurts, answer the doctor’s questions and get a prescription.',
	npcRole: 'Doctor',
	npcGender: { 'egyptian-arabic': 'm', levantine: 'f', darija: 'm', fusha: 'm' },
	doneHeading: 'Doctor’s visit done, in Arabic!',
	text: text as Scenario['text'],
	lines: {
		d_hello: { speaker: 'npc', english: "Hello, come in. What's wrong?" },
		d_since: { speaker: 'npc', english: 'How long have you had it?' },
		d_fever: { speaker: 'npc', english: 'Do you have a temperature?' },
		d_check: { speaker: 'npc', english: 'Let me take a look. Take a deep breath.' },
		d_ok: { speaker: 'npc', english: "Good. It's nothing serious." },
		d_prescription: { speaker: 'npc', english: "I'll write you a prescription." },
		d_yes: { speaker: 'npc', english: 'Yes, from any pharmacy.' },
		d_rest: { speaker: 'npc', english: 'Rest for two days and drink plenty of fluids.' },
		d_questions: { speaker: 'npc', english: 'Any questions?' },
		d_not_tomorrow: { speaker: 'npc', english: 'Not tomorrow. Rest first.' },
		d_bye: { speaker: 'npc', english: 'Get well soon!' },
		d_sorry: { speaker: 'npc', english: "Sorry? I didn't follow." },
		y_throat: { speaker: 'you', english: 'My throat hurts.' },
		y_back: { speaker: 'you', english: 'My back hurts.' },
		y_three_days: { speaker: 'you', english: 'For three days.' },
		y_week: { speaker: 'you', english: 'For a week.' },
		y_no_fever: { speaker: 'you', english: "No, I don't think so." },
		y_little: { speaker: 'you', english: 'Yes, a little.' },
		y_ok: { speaker: 'you', english: 'OK.' },
		y_relief: { speaker: 'you', english: 'Thank goodness!' },
		y_pharmacy: { speaker: 'you', english: 'Can I get it from any pharmacy?' },
		y_will: { speaker: 'you', english: 'OK, I will.' },
		y_work: { speaker: 'you', english: 'Can I go to work?' },
		y_no_thanks: { speaker: 'you', english: 'No, thank you.' },
		y_thanks_doctor: { speaker: 'you', english: 'Thank you, doctor!' },
		y_two_kilos: { speaker: 'you', english: 'Two kilos.' },
		y_stop_here: { speaker: 'you', english: 'Stop here, please.' },
		y_tea: { speaker: 'you', english: 'Tea, please.' },
		y_too_expensive: { speaker: 'you', english: "That's expensive! Twenty?" },
		y_enjoy: { speaker: 'you', english: 'Enjoy your meal!' },
		y_welcome: { speaker: 'you', english: 'Welcome!' },
		item_prescription: { speaker: 'item', english: 'a prescription' }
	},
	turns: [
		{
			id: 'hello',
			npc: 'd_hello',
			choices: [
				{ line: 'y_throat', ok: true },
				{ line: 'y_back', ok: true },
				{ line: 'y_two_kilos', ok: false }
			]
		},
		{
			id: 'since',
			npc: 'd_since',
			choices: [
				{ line: 'y_three_days', ok: true },
				{ line: 'y_week', ok: true },
				{ line: 'y_stop_here', ok: false }
			]
		},
		{
			id: 'fever',
			npc: 'd_fever',
			choices: [
				{ line: 'y_no_fever', ok: true },
				{ line: 'y_little', ok: true },
				{ line: 'y_tea', ok: false }
			]
		},
		{
			id: 'check',
			npc: 'd_check',
			choices: [
				{ line: 'y_ok', ok: true },
				{ line: 'y_too_expensive', ok: false },
				{ line: 'y_welcome', ok: false }
			]
		},
		{
			id: 'ok',
			npc: 'd_ok',
			choices: [
				{ line: 'y_relief', ok: true },
				{ line: 'y_enjoy', ok: false }
			]
		},
		{
			id: 'prescription',
			npc: 'd_prescription',
			choices: [
				{ line: 'y_pharmacy', ok: true, give: 'prescription', reply: 'd_yes' },
				{ line: 'y_welcome', ok: false },
				{ line: 'y_two_kilos', ok: false }
			],
			fetch: true
		},
		{
			id: 'rest',
			npc: 'd_rest',
			choices: [
				{ line: 'y_will', ok: true },
				{ line: 'y_stop_here', ok: false }
			]
		},
		{
			id: 'questions',
			npc: 'd_questions',
			choices: [
				{ line: 'y_work', ok: true, reply: 'd_not_tomorrow' },
				{ line: 'y_no_thanks', ok: true },
				{ line: 'y_tea', ok: false }
			]
		},
		{
			id: 'bye',
			npc: 'd_bye',
			choices: [
				{ line: 'y_thanks_doctor', ok: true },
				{ line: 'y_enjoy', ok: false }
			]
		}
	]
};

const f = model.furniture;
/** The table top (the same table as the restaurant's), where the prescription is put down. */
const DESK_TOP = 0.655;

const clinic: Room = {
	id: 'clinic',
	label: "Doctor's office",
	emoji: '🩺',
	size: [6, 5],
	height: 2.8,
	colors: { floor: '#d9dfe3', wall: '#f4f7f8' },
	objects: [],
	decor: [
		// The doctor's desk between you and the doctor.
		// A low table, so the doctor shows above it.
		{ model: f('table'), placements: [{ at: [0, 0, -0.5], scale: 2 }] },
		{ model: f('books'), placements: [{ at: [-0.5, DESK_TOP, -0.6], rot: 15, scale: 1.2 }] },
		{ model: f('lampSquareTable'), placements: [{ at: [0.6, DESK_TOP, -0.65], scale: 1.6 }] },
		// Files along the back wall, and an examination couch to the side.
		{
			model: f('bookcaseClosed'),
			placements: [-1.2, 1.2].map((x) => ({ at: [x, 0, -2.2], scale: 2.4 }) as Placement)
		},
		{ model: f('loungeSofa'), placements: [{ at: [-2.4, 0, 0.6], rot: 90, scale: 2 }] },
		{ model: f('pottedPlant'), placements: [{ at: [2.4, 0, -1.9], scale: 2.2 }] },
		{ model: f('lampSquareFloor'), placements: [{ at: [2.5, 0, 1.4], scale: 2.2 }] }
	]
};

export const doctorStage: Stage = {
	setting: clinic,
	// Across the desk from the doctor, framed like the pharmacy counter.
	pose: { at: [0, 1.7, 1.8], yaw: 0, pitch: -0.18 },
	npc: {
		// The ones in white coats.
		model: { m: 'character-male-e', f: 'character-female-e' },
		scale: 1.9,
		start: [0, -1.25],
		route: [],
		// Writes the prescription without leaving the desk.
		fetch: { route: [] },
		handOver: [0, -0.2]
	},
	give: {
		prescription: [{ model: f('books'), placement: { at: [0.15, DESK_TOP, -0.2], rot: -10, scale: 1 } }]
	}
};
