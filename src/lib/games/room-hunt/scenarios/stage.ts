/**
 * How a scenario is staged in 3D: the place, where the player stands, where the
 * other person comes from and goes to fetch things, where handed-over things
 * appear, and (for the taxi) the vehicle and its drives.
 *
 * Coordinates are metres in the setting's own space (see rooms.ts for the
 * conventions). Plain data; ScenarioPlayer.svelte turns it into motion.
 */
import type { Pose } from '../scene';
import type { Placement, Room } from '../rooms';

export type FloorPoint = [number, number];

export interface Prop {
	model: string;
	placement: Placement;
}

export interface Stage {
	setting: Room;
	/** Where the player stands or sits. */
	pose: Pose;
	/** Setting objects to hide (the restaurant clears the player's table). */
	hide?: string[];
	npc?: {
		/** Character model per gender (WAITER-style: matches the voice). */
		model: Record<'m' | 'f', string>;
		start: FloorPoint;
		/** From `start` to where they talk to the player. */
		route: FloorPoint[];
		/** Where they go to get things, from the talking spot; they come back the same way. */
		fetch?: { route: FloorPoint[]; disappear?: boolean };
		/** What they face while handing things over. */
		handOver?: FloorPoint;
		/** Clip to stand in (a shopkeeper behind a counter might lean). */
		idle?: string;
		/** Taller than the default, to show above a counter. */
		scale?: number;
	};
	/** Where each handed-over thing appears, by item id. */
	give: Record<string, Prop[]>;
	/** People around for atmosphere. */
	extras?: { model: string; at: [number, number, number]; rot: number; animation: string }[];
	vehicle?: {
		model: string;
		scale: number;
		/** Where it appears, and the heading (degrees) it faces there. */
		start: [number, number, number];
		/** Driven before the conversation starts (pulling up to the player). */
		arrive: FloorPoint[];
		/** The camera's place behind the vehicle while it drives, in its own space. */
		follow: [number, number, number];
		drives: Record<string, { path: FloorPoint[]; then: Pose }>;
	};
}

export const CHARACTERS = '/games/room-hunt/models/characters';
export const characterUrl = (model: string) => `${CHARACTERS}/${model}.glb`;

/** The mini characters have big heads; at full adult height the head fills the view. */
export const CHARACTER_SCALE = 1.6;
