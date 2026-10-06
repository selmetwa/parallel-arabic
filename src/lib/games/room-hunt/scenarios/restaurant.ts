/**
 * "Order a meal": the restaurant room's waiter takes your order and brings it.
 */
import { getRoom, model } from '../rooms';
import type { Scenario } from './scenario';
import type { Stage } from './stage';
import text from './restaurant.json';

export const restaurant: Scenario = {
	id: 'restaurant',
	title: 'Order a meal',
	emoji: '🍽️',
	blurb: 'Sit down, order a drink and a main, decide on dessert and ask for the bill.',
	npcRole: 'Waiter',
	npcGender: { 'egyptian-arabic': 'm', levantine: 'f', darija: 'm', fusha: 'm' },
	doneHeading: 'Dinner ordered in Arabic!',
	text: text as Scenario['text'],
	lines: {
		w_people: { speaker: 'npc', english: 'Good evening! How many people?' },
		w_welcome: { speaker: 'npc', english: 'Welcome! Please, have a seat. Here is the menu.' },
		w_questions: { speaker: 'npc', english: 'Take your time. Any questions?' },
		w_recommend: { speaker: 'npc', english: 'The grilled fish is very good today.' },
		w_drink: { speaker: 'npc', english: 'What would you like to drink?' },
		w_food: { speaker: 'npc', english: 'And what would you like to eat?' },
		w_bread: { speaker: 'npc', english: 'Would you like bread with that?' },
		w_coming: { speaker: 'npc', english: 'Right away!' },
		w_enjoy: { speaker: 'npc', english: 'Here you go. Enjoy your meal!' },
		w_dessert: { speaker: 'npc', english: 'Would you like some dessert?' },
		w_coffee: { speaker: 'npc', english: 'Something hot to drink? A coffee?' },
		w_how: { speaker: 'npc', english: 'How was the food?' },
		w_total: { speaker: 'npc', english: "That's a hundred and fifty." },
		w_thanks: { speaker: 'npc', english: 'Thank you very much!' },
		w_card: { speaker: 'npc', english: "Of course, here's the machine." },
		w_bye: { speaker: 'npc', english: 'Thank you! Come again.' },
		w_sorry: { speaker: 'npc', english: "Sorry? I didn't understand." },
		y_one: { speaker: 'you', english: 'Just one, please.' },
		y_thanks: { speaker: 'you', english: 'Thank you!' },
		y_recommend: { speaker: 'you', english: 'What do you recommend?' },
		y_bill: { speaker: 'you', english: 'The bill, please.' },
		y_bathroom: { speaker: 'you', english: 'Where is the bathroom?' },
		y_tea: { speaker: 'you', english: 'Tea, please.' },
		y_water: { speaker: 'you', english: 'A glass of water, please.' },
		y_fish: { speaker: 'you', english: 'Fish, please.' },
		y_chicken: { speaker: 'you', english: 'Chicken, please.' },
		y_soup: { speaker: 'you', english: 'Soup, please.' },
		y_yes_please: { speaker: 'you', english: 'Yes, please.' },
		y_goodbye: { speaker: 'you', english: 'Goodbye!' },
		y_welcome: { speaker: 'you', english: 'Welcome!' },
		y_drink_q: { speaker: 'you', english: 'What would you like to drink?' },
		y_cake: { speaker: 'you', english: 'Yes, cake please.' },
		y_coffee: { speaker: 'you', english: 'A coffee, please.' },
		y_no_thanks: { speaker: 'you', english: 'No, thank you.' },
		y_table_two: { speaker: 'you', english: 'A table for two, please.' },
		y_delicious_bill: { speaker: 'you', english: 'Delicious! The bill, please.' },
		y_fork: { speaker: 'you', english: 'Where is the fork?' },
		y_pay: { speaker: 'you', english: 'Here you go.' },
		y_card: { speaker: 'you', english: 'Can I pay by card?' },
		y_bye: { speaker: 'you', english: 'Thank you, goodbye!' },
		item_tea: { speaker: 'item', english: 'tea' },
		item_glass: { speaker: 'item', english: 'a glass of water' },
		item_fish: { speaker: 'item', english: 'fish' },
		item_chicken: { speaker: 'item', english: 'chicken' },
		item_soup: { speaker: 'item', english: 'soup' },
		item_bread: { speaker: 'item', english: 'bread' },
		item_cake: { speaker: 'item', english: 'cake' },
		item_coffee: { speaker: 'item', english: 'coffee' }
	},
	turns: [
		{
			id: 'people',
			npc: 'w_people',
			choices: [
				{ line: 'y_one', ok: true },
				{ line: 'y_bill', ok: false },
				{ line: 'y_bathroom', ok: false }
			]
		},
		{
			id: 'greet',
			npc: 'w_welcome',
			choices: [
				{ line: 'y_thanks', ok: true },
				{ line: 'y_bill', ok: false },
				{ line: 'y_goodbye', ok: false }
			]
		},
		{
			id: 'questions',
			npc: 'w_questions',
			choices: [
				{ line: 'y_recommend', ok: true, reply: 'w_recommend' },
				{ line: 'y_welcome', ok: false },
				{ line: 'y_bye', ok: false }
			]
		},
		{
			id: 'drink',
			npc: 'w_drink',
			choices: [
				{ line: 'y_tea', ok: true, give: 'tea' },
				{ line: 'y_water', ok: true, give: 'glass' },
				{ line: 'y_goodbye', ok: false }
			]
		},
		{
			id: 'food',
			npc: 'w_food',
			choices: [
				{ line: 'y_fish', ok: true, give: 'fish' },
				{ line: 'y_chicken', ok: true, give: 'chicken' },
				{ line: 'y_soup', ok: true, give: 'soup' },
				{ line: 'y_table_two', ok: false }
			]
		},
		{
			id: 'bread',
			npc: 'w_bread',
			choices: [
				{ line: 'y_yes_please', ok: true, give: 'bread', reply: 'w_coming' },
				{ line: 'y_no_thanks', ok: true, reply: 'w_coming' },
				{ line: 'y_fork', ok: false }
			],
			fetch: true
		},
		{
			id: 'served',
			npc: 'w_enjoy',
			choices: [
				{ line: 'y_thanks', ok: true },
				{ line: 'y_welcome', ok: false },
				{ line: 'y_bill', ok: false }
			]
		},
		{
			id: 'dessert',
			npc: 'w_dessert',
			choices: [
				{ line: 'y_cake', ok: true, give: 'cake' },
				{ line: 'y_no_thanks', ok: true },
				{ line: 'y_drink_q', ok: false }
			]
		},
		{
			id: 'coffee',
			npc: 'w_coffee',
			choices: [
				{ line: 'y_coffee', ok: true, give: 'coffee', reply: 'w_coming' },
				{ line: 'y_no_thanks', ok: true },
				{ line: 'y_table_two', ok: false }
			],
			fetch: true
		},
		{
			id: 'bill',
			npc: 'w_how',
			choices: [
				{ line: 'y_delicious_bill', ok: true },
				{ line: 'y_drink_q', ok: false },
				{ line: 'y_fork', ok: false }
			]
		},
		{
			id: 'pay',
			npc: 'w_total',
			choices: [
				{ line: 'y_pay', ok: true, reply: 'w_thanks' },
				{ line: 'y_card', ok: true, reply: 'w_card' },
				{ line: 'y_one', ok: false }
			]
		},
		{
			id: 'bye',
			npc: 'w_bye',
			choices: [
				{ line: 'y_bye', ok: true },
				{ line: 'y_welcome', ok: false },
				{ line: 'y_tea', ok: false }
			]
		}
	]
};

const TABLE_TOP = 0.655;
const food = model.food;

/**
 * The player sits at the south table facing north; the waiter comes and goes
 * through the kitchen door on the north wall and talks from the far corner of
 * the table, two metres off, so the whole waiter shows.
 */
export const restaurantStage: Stage = {
	setting: getRoom('restaurant'),
	pose: { at: [0.45, 1.25, 2.45], yaw: -0.12, pitch: -0.3 },
	// The south table's own dishes, so the order can be brought to it.
	hide: ['fish', 'chicken', 'pepper'],
	npc: {
		model: { m: 'character-male-b', f: 'character-female-b' },
		start: [1.6, -2.7],
		// Down the gap between the north and east tables.
		route: [
			[1.1, -1.3],
			[1.1, 0.3],
			[1.0, 0.5]
		],
		fetch: {
			route: [
				[1.1, 0.3],
				[1.1, -1.3],
				[1.6, -2.7]
			],
			disappear: true
		},
		handOver: [0.35, 1.45]
	},
	// The far half of the table; drinks to the left so they don't block the waiter.
	give: {
		tea: [{ model: food('cup-tea'), placement: { at: [0.05, TABLE_TOP, 1.45], scale: 0.7 } }],
		glass: [{ model: food('glass'), placement: { at: [0.05, TABLE_TOP, 1.45], scale: 0.6 } }],
		fish: [{ model: food('fish'), placement: { at: [0.35, TABLE_TOP, 1.45], rot: 90, scale: 0.6 } }],
		chicken: [{ model: food('turkey'), placement: { at: [0.35, TABLE_TOP, 1.45], scale: 0.4 } }],
		soup: [{ model: food('bowl-soup'), placement: { at: [0.35, TABLE_TOP, 1.45], scale: 0.6 } }],
		cake: [{ model: food('cake'), placement: { at: [-0.4, TABLE_TOP, 1.45], scale: 0.5 } }],
		// Bread and coffee on the player's side, clear of the waiter.
		bread: [{ model: food('loaf-round'), placement: { at: [-0.45, TABLE_TOP, 1.8], rot: 30, scale: 0.3 } }],
		coffee: [{ model: food('cup-coffee'), placement: { at: [0.3, TABLE_TOP, 1.85], scale: 0.6 } }]
	},
	// The sit clip puts the hips at the model's origin, so diners are lifted to seat height.
	extras: [
		{ model: 'character-female-a', at: [-0.45, 0.42, -2.3], rot: 0, animation: 'sit' },
		{ model: 'character-male-d', at: [-2.5, 0.42, 0.45], rot: 90, animation: 'sit' }
	]
};
