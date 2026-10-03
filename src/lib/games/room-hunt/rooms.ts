/**
 * Room Hunt rooms: which objects stand where.
 *
 * Plain data, no three.js, so tests and the vocab script can read it. Units are
 * metres; the room is centred on the origin with -z as the wall the player
 * faces first. Each model is centred on its footprint with its base at `at[1]`,
 * so `at` is "where it stands". `rot` is degrees about the vertical axis; the
 * Kenney models face +z, so 0 faces the player from the north wall, -90 from
 * the east wall, 90 from the west and 180 from the south.
 *
 * The Arabic for each object lives in vocab.json (see
 * scripts/generate-room-hunt-vocab.ts); this file only names it in English.
 */

export type RoomId = 'kitchen' | 'bathroom' | 'restaurant';

export interface Placement {
	at: [number, number, number];
	rot?: number;
	scale?: number | [number, number, number];
}

export interface RoomObject {
	/** Concept id, the key into vocab.json. Unique within a room. */
	id: string;
	model: string;
	/** Every copy counts: any chair is "the chair". */
	placements: Placement[];
}

export interface Room {
	/** A Room Hunt room, or a scenario's own setting. */
	id: RoomId | string;
	label: string;
	emoji: string;
	/** Floor width (x) and depth (z). */
	size: [number, number];
	height: number;
	colors: { floor: string; wall: string };
	/** No walls or ceiling: the floor runs out to the sky (a street, a market). */
	outdoor?: boolean;
	objects: RoomObject[];
	/** Set dressing that can't be picked. */
	decor: { model: string; placements: Placement[] }[];
}

/** The objects to name, with a note so the translation picks the right sense. */
export const CONCEPTS: Record<string, { english: string; hint: string }> = {
	fridge: { english: 'fridge', hint: 'refrigerator in a home kitchen' },
	stove: { english: 'stove', hint: 'cooker with burners and an oven' },
	sink: { english: 'sink', hint: 'kitchen sink' },
	microwave: { english: 'microwave', hint: 'microwave oven' },
	blender: { english: 'blender', hint: 'kitchen blender for juice' },
	coffee_maker: { english: 'coffee maker', hint: 'coffee machine' },
	toaster: { english: 'toaster', hint: 'bread toaster' },
	trash_can: { english: 'trash can', hint: 'rubbish bin' },
	cupboard: { english: 'cupboard', hint: 'wall cabinet with doors' },
	table: { english: 'table', hint: 'dining table' },
	chair: { english: 'chair', hint: 'chair to sit on' },
	pot: { english: 'pot', hint: 'cooking pot' },
	frying_pan: { english: 'frying pan', hint: 'pan for frying' },
	knife: { english: 'knife', hint: 'knife for cutting food' },
	cutting_board: { english: 'cutting board', hint: 'chopping board' },
	mug: { english: 'mug', hint: 'mug for tea or coffee' },
	toilet: { english: 'toilet', hint: 'the toilet bowl itself, not the room' },
	bathtub: { english: 'bathtub', hint: 'bath tub' },
	shower: { english: 'shower', hint: 'shower' },
	washbasin: { english: 'washbasin', hint: 'bathroom sink for washing hands' },
	mirror: { english: 'mirror', hint: 'mirror' },
	washing_machine: { english: 'washing machine', hint: 'clothes washer' },
	rug: { english: 'bath mat', hint: 'small rug on the bathroom floor' },
	lamp: { english: 'lamp', hint: 'wall light' },
	door: { english: 'door', hint: 'door' },
	window: { english: 'window', hint: 'window' },
	plate: { english: 'plate', hint: 'dinner plate' },
	glass: { english: 'glass', hint: 'drinking glass' },
	fork: { english: 'fork', hint: 'fork for eating' },
	spoon: { english: 'spoon', hint: 'spoon for eating' },
	soup: { english: 'soup', hint: 'bowl of soup' },
	bread: { english: 'bread', hint: 'loaf of bread' },
	salad: { english: 'salad', hint: 'bowl of salad' },
	fish: { english: 'fish', hint: 'fish as food' },
	chicken: { english: 'chicken', hint: 'roast chicken as food' },
	cake: { english: 'cake', hint: 'cake' },
	tea: { english: 'tea', hint: 'cup of tea' },
	salt: { english: 'salt', hint: 'salt (shaker)' },
	pepper: { english: 'pepper', hint: 'black pepper (shaker), not bell pepper' }
};

const MODELS = '/games/room-hunt/models';
const f = (name: string) => `${MODELS}/furniture/${name}.glb`;
const food = (name: string) => `${MODELS}/food/${name}.glb`;

/** Model URLs by kit, for scenario settings and props. */
export const model = {
	furniture: f,
	food,
	car: (name: string) => `${MODELS}/car/${name}.glb`,
	roads: (name: string) => `${MODELS}/roads/${name}.glb`,
	buildings: (name: string) => `${MODELS}/buildings/${name}.glb`
};

/** The furniture kit is half size. */
const FURN = 2;

const KITCHEN: Room = {
	id: 'kitchen',
	label: 'Kitchen',
	emoji: '🍳',
	size: [5, 5],
	height: 2.8,
	colors: { floor: '#c9b49a', wall: '#f1e7d6' },
	objects: [
		{ id: 'fridge', model: f('kitchenFridge'), placements: [{ at: [-2.0, 0, -2.2], scale: FURN }] },
		{ id: 'stove', model: f('kitchenStove'), placements: [{ at: [-1.14, 0, -2.05], scale: FURN }] },
		{ id: 'sink', model: f('kitchenSink'), placements: [{ at: [0.58, 0, -2.05], scale: FURN }] },
		{
			id: 'cupboard',
			model: f('kitchenCabinetUpper'),
			placements: [
				{ at: [-0.28, 1.45, -2.29], scale: FURN },
				{ at: [1.44, 1.45, -2.29], scale: FURN }
			]
		},
		{
			id: 'microwave',
			model: f('kitchenMicrowave'),
			placements: [{ at: [1.44, 0.9, -2.2], scale: FURN }]
		},
		{ id: 'blender', model: f('kitchenBlender'), placements: [{ at: [-0.5, 0.9, -2.2], scale: FURN }] },
		{ id: 'toaster', model: f('toaster'), placements: [{ at: [-0.05, 0.9, -2.15], scale: 1.6 }] },
		{ id: 'pot', model: food('pot'), placements: [{ at: [-1.35, 0.9, -2.0], scale: 0.45 }] },
		{
			id: 'frying_pan',
			model: food('frying-pan'),
			placements: [{ at: [-0.92, 0.9, -1.95], rot: 180, scale: 0.4 }]
		},
		{
			id: 'coffee_maker',
			model: f('kitchenCoffeeMachine'),
			placements: [{ at: [2.15, 0.9, -1.17], rot: -90, scale: FURN }]
		},
		{
			id: 'cutting_board',
			model: food('cutting-board'),
			placements: [{ at: [2.1, 0.9, -0.45], rot: -90, scale: 0.5 }]
		},
		{
			id: 'knife',
			model: food('cooking-knife'),
			placements: [{ at: [2.1, 0.9, -0.05], rot: 90, scale: 0.5 }]
		},
		{ id: 'trash_can', model: f('trashcan'), placements: [{ at: [2.15, 0, -2.15], scale: 1.5 }] },
		{ id: 'table', model: f('table'), placements: [{ at: [-1.0, 0, 1.7], scale: FURN }] },
		{
			id: 'chair',
			model: f('chair'),
			placements: [
				{ at: [-1.4, 0, 0.95], scale: FURN },
				{ at: [-0.6, 0, 0.95], scale: FURN }
			]
		},
		{ id: 'mug', model: food('mug'), placements: [{ at: [-0.6, 0.655, 1.75], scale: 0.45 }] }
	],
	decor: [
		{
			model: f('kitchenCabinet'),
			placements: [
				{ at: [-0.28, 0, -2.05], scale: FURN },
				{ at: [1.44, 0, -2.05], scale: FURN },
				{ at: [2.05, 0, -1.17], rot: -90, scale: FURN },
				{ at: [2.05, 0, -0.31], rot: -90, scale: FURN }
			]
		},
		{ model: f('pottedPlant'), placements: [{ at: [2.1, 0, 2.1], scale: FURN }] }
	]
};

const BATHROOM: Room = {
	id: 'bathroom',
	label: 'Bathroom',
	emoji: '🛁',
	size: [4, 4],
	height: 2.7,
	colors: { floor: '#b9cfd6', wall: '#e4f0f2' },
	objects: [
		{ id: 'bathtub', model: f('bathtub'), placements: [{ at: [-0.8, 0, -1.44], scale: FURN }] },
		{ id: 'shower', model: f('shower'), placements: [{ at: [1.42, 0, -1.44], scale: FURN }] },
		{ id: 'toilet', model: f('toilet'), placements: [{ at: [1.72, 0, 0.2], rot: -90, scale: 1.8 }] },
		{
			id: 'washing_machine',
			model: f('washer'),
			placements: [{ at: [1.51, 0, 1.3], rot: -90, scale: FURN }]
		},
		{
			id: 'washbasin',
			model: f('bathroomSink'),
			placements: [{ at: [-1.71, 0, 0.2], rot: 90, scale: FURN }]
		},
		{
			id: 'mirror',
			model: f('bathroomMirror'),
			placements: [{ at: [-1.88, 1.25, 0.2], rot: 90, scale: 1.6 }]
		},
		{ id: 'lamp', model: f('lampWall'), placements: [{ at: [-1.85, 2.1, 0.2], rot: 90, scale: FURN }] },
		{
			id: 'cupboard',
			model: f('bathroomCabinet'),
			placements: [{ at: [-1.87, 1.3, 1.2], rot: 90, scale: FURN }]
		},
		{ id: 'trash_can', model: f('trashcan'), placements: [{ at: [-1.6, 0, 1.6], scale: 1.2 }] },
		{ id: 'rug', model: f('rugDoormat'), placements: [{ at: [-0.8, 0, -0.6], scale: 2.5 }] },
		{ id: 'door', model: f('doorway'), placements: [{ at: [0.6, 0, 1.9], rot: 180, scale: FURN }] },
		{
			id: 'window',
			model: f('wallWindow'),
			placements: [{ at: [-0.8, 0, 1.96], rot: 180, scale: [1.4, 2.09, 1] }]
		}
	],
	decor: []
};

const TABLE_TOP = 0.655;

const RESTAURANT: Room = {
	id: 'restaurant',
	label: 'Restaurant',
	emoji: '🍽️',
	size: [6, 6],
	height: 3,
	colors: { floor: '#8a6a4f', wall: '#efe0c8' },
	objects: [
		{
			id: 'table',
			model: f('tableCloth'),
			placements: [
				{ at: [0, 0, -1.6], scale: FURN },
				{ at: [0, 0, 1.6], scale: FURN },
				{ at: [1.8, 0, 0], rot: 90, scale: FURN },
				{ at: [-1.8, 0, 0], rot: 90, scale: FURN }
			]
		},
		{
			id: 'chair',
			model: f('chair'),
			placements: [
				{ at: [-0.45, 0, -2.3], scale: FURN },
				{ at: [0.45, 0, -2.3], scale: FURN },
				{ at: [-0.45, 0, 2.3], rot: 180, scale: FURN },
				{ at: [0.45, 0, 2.3], rot: 180, scale: FURN },
				{ at: [2.5, 0, -0.45], rot: -90, scale: FURN },
				{ at: [2.5, 0, 0.45], rot: -90, scale: FURN },
				{ at: [-2.5, 0, -0.45], rot: 90, scale: FURN },
				{ at: [-2.5, 0, 0.45], rot: 90, scale: FURN }
			]
		},
		// North table: a place setting.
		{ id: 'plate', model: food('plate'), placements: [{ at: [-0.35, TABLE_TOP, -1.55], scale: 0.4 }] },
		{
			id: 'fork',
			model: food('utensil-fork'),
			placements: [{ at: [-0.65, TABLE_TOP, -1.55], rot: 90, scale: 0.55 }]
		},
		{
			id: 'knife',
			model: food('utensil-knife'),
			placements: [{ at: [-0.05, TABLE_TOP, -1.55], rot: 90, scale: 0.5 }]
		},
		{ id: 'glass', model: food('glass'), placements: [{ at: [0.3, TABLE_TOP, -1.75], scale: 0.6 }] },
		{ id: 'salt', model: food('shaker-salt'), placements: [{ at: [0.6, TABLE_TOP, -1.45], scale: 0.8 }] },
		// East table: soup and tea.
		{ id: 'soup', model: food('bowl-soup'), placements: [{ at: [1.75, TABLE_TOP, -0.45], scale: 0.6 }] },
		{ id: 'spoon', model: food('utensil-spoon'), placements: [{ at: [1.5, TABLE_TOP, -0.05], scale: 0.55 }] },
		{ id: 'tea', model: food('cup-tea'), placements: [{ at: [1.85, TABLE_TOP, 0.2], scale: 0.7 }] },
		{ id: 'bread', model: food('loaf-round'), placements: [{ at: [1.75, TABLE_TOP, 0.6], scale: 0.4 }] },
		// South table: mains.
		{ id: 'fish', model: food('fish'), placements: [{ at: [-0.4, TABLE_TOP, 1.6], rot: 90, scale: 0.6 }] },
		{ id: 'chicken', model: food('turkey'), placements: [{ at: [0.25, TABLE_TOP, 1.6], scale: 0.4 }] },
		{
			id: 'pepper',
			model: food('shaker-pepper'),
			placements: [{ at: [0.65, TABLE_TOP, 1.4], scale: 0.8 }]
		},
		// West table: salad and dessert.
		{ id: 'salad', model: food('salad'), placements: [{ at: [-1.8, TABLE_TOP, -0.4], scale: 0.6 }] },
		{ id: 'cake', model: food('cake'), placements: [{ at: [-1.8, TABLE_TOP, 0.4], scale: 0.5 }] }
	],
	decor: [
		// The kitchen door the waiter uses in "Order a meal" (order.ts).
		{ model: f('doorway'), placements: [{ at: [1.6, 0, -2.9], scale: FURN }] },
		{
			model: f('pottedPlant'),
			placements: [
				{ at: [2.6, 0, 2.6], scale: 2.2 },
				{ at: [-2.6, 0, 2.6], scale: 2.2 },
				{ at: [2.6, 0, -2.6], scale: 2.2 },
				{ at: [-2.6, 0, -2.6], scale: 2.2 }
			]
		}
	]
};

/** In order of difficulty. */
export const ROOMS: Room[] = [KITCHEN, BATHROOM, RESTAURANT];

export function getRoom(id: string): Room {
	return ROOMS.find((r) => r.id === id) ?? ROOMS[0];
}

/** Every concept any room uses, for the vocab script. */
export function usedConcepts(): string[] {
	return [...new Set(ROOMS.flatMap((r) => r.objects.map((o) => o.id)))];
}
