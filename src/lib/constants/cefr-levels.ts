export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

type LevelInfo = {
	label: string;
	/** Caption shown under the slider on the "where are you now" screen. */
	now: string;
	/** Caption shown under the slider on the "where do you want to get to" screen. */
	goal: string;
};

export const CEFR_LEVEL_INFO: Record<CefrLevel, LevelInfo> = {
	A1: {
		label: 'Complete Beginner',
		now: "I'm starting from scratch",
		goal: 'I want to read the alphabet and greet people'
	},
	A2: {
		label: 'Elementary',
		now: 'I know greetings and a few basic phrases',
		goal: 'I want to order food, shop and handle the basics'
	},
	B1: {
		label: 'Intermediate',
		now: 'I can get through simple everyday chats',
		goal: 'I want to hold conversations on familiar topics'
	},
	B2: {
		label: 'Upper Intermediate',
		now: 'I can talk about most topics without much effort',
		goal: 'I want to speak comfortably about almost anything'
	},
	C1: {
		label: 'Advanced',
		now: 'I can handle complex discussions',
		goal: 'I want to follow films and debates, and argue my point'
	},
	C2: {
		label: 'Proficient',
		now: 'I can use Arabic like a native speaker',
		goal: 'I want to pass for a native speaker'
	}
};

export function isCefrLevel(value: unknown): value is CefrLevel {
	return typeof value === 'string' && (CEFR_LEVELS as readonly string[]).includes(value);
}
