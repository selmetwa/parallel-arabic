import type { Variety } from './varieties';

/**
 * Side-by-side Levantine content for /levantine-dialects and the blog post
 * comparing the four varieties. Every Arabic line is recorded in the matching
 * Nur voice by scripts/generate-variety-audio.ts, at the path clipPath() gives.
 */
export const LEVANTINE_VARIETIES = ['syrian', 'lebanese', 'jordanian', 'palestinian'] as const satisfies readonly Variety[];
export type LevantineVariety = (typeof LEVANTINE_VARIETIES)[number];

export interface Spoken {
	arabic: string;
	transliteration: string;
}

/** The same sentence in each variety. */
export interface CompareSentence {
	id: string;
	english: string;
	forms: Record<LevantineVariety, Spoken>;
}

/** A word that changes from one variety to the next. */
export interface CompareWord {
	id: string;
	english: string;
	forms: Record<LevantineVariety, Spoken>;
	note?: string;
}

/** A word all four share, recorded once. */
export interface SharedWord extends Spoken {
	id: string;
	english: string;
}

export const COMPARE_SENTENCES: CompareSentence[] = [
	{
		id: 'what-now',
		english: 'What do you want to do now?',
		forms: {
			syrian: { arabic: 'شو بدك تعمل هلّق؟', transliteration: 'shu baddak ta3mel halla2?' },
			lebanese: { arabic: 'شو بدّك تعمل هلّق؟', transliteration: 'shu baddak ta3mil halla2?' },
			jordanian: { arabic: 'شو بدك تعمل هسّا؟', transliteration: 'shu biddak ti3mal hassa?' },
			palestinian: { arabic: 'إيش بدك تعمل هلقيت؟', transliteration: 'eesh biddak ti3mal halla2eet?' }
		}
	},
	{
		id: 'this-is-nice',
		english: 'This is really nice.',
		forms: {
			syrian: { arabic: 'هاد كتير حلو', transliteration: 'hada kteer 7ilu' },
			lebanese: { arabic: 'هيدا كتير حلو', transliteration: 'hayda kteer 7ilu' },
			jordanian: { arabic: 'هاد كتير حلو', transliteration: 'hada kteer 7ilu' },
			palestinian: { arabic: 'هاد كتير حلو', transliteration: 'hada kteer 7ilu' }
		}
	},
	{
		id: 'coming-now',
		english: "I'm coming now.",
		forms: {
			syrian: { arabic: 'جاي هلّق', transliteration: 'jaay halla2' },
			lebanese: { arabic: 'جايي هلّق', transliteration: 'jaaye halla2' },
			jordanian: { arabic: 'هسّا جاي', transliteration: 'hassa jaay' },
			palestinian: { arabic: 'هلقيت جاي', transliteration: 'halla2eet jaay' }
		}
	},
	{
		id: 'anything',
		english: 'Is something wrong?',
		forms: {
			syrian: { arabic: 'في شي؟', transliteration: 'fi shi?' },
			lebanese: { arabic: 'في شي؟', transliteration: 'fi shi?' },
			jordanian: { arabic: 'في إشي؟', transliteration: 'fi ishi?' },
			palestinian: { arabic: 'في إشي؟', transliteration: 'fi ishi?' }
		}
	}
];

export const COMPARE_WORDS: CompareWord[] = [
	{
		id: 'now',
		english: 'now',
		forms: {
			syrian: { arabic: 'هلّق', transliteration: 'halla2' },
			lebanese: { arabic: 'هلّق', transliteration: 'halla2' },
			jordanian: { arabic: 'هسّا', transliteration: 'hassa' },
			palestinian: { arabic: 'هلقيت', transliteration: 'halla2eet' }
		},
		note: 'The quickest tell. Hassa is heard in parts of Palestine too.'
	},
	{
		id: 'what',
		english: 'what',
		forms: {
			syrian: { arabic: 'شو', transliteration: 'shu' },
			lebanese: { arabic: 'شو', transliteration: 'shu' },
			jordanian: { arabic: 'شو', transliteration: 'shu' },
			palestinian: { arabic: 'إيش', transliteration: 'eesh' }
		},
		note: 'Palestinians say shu as well; eesh is the one you only hear there.'
	},
	{
		id: 'this',
		english: 'this (masculine)',
		forms: {
			syrian: { arabic: 'هاد', transliteration: 'hada' },
			lebanese: { arabic: 'هيدا', transliteration: 'hayda' },
			jordanian: { arabic: 'هاد', transliteration: 'hada' },
			palestinian: { arabic: 'هاد', transliteration: 'hada' }
		},
		note: 'Hayda marks a Lebanese speaker straight away.'
	},
	{
		id: 'this-f',
		english: 'this (feminine)',
		forms: {
			syrian: { arabic: 'هي', transliteration: 'hayy' },
			lebanese: { arabic: 'هيدي', transliteration: 'hayde' },
			jordanian: { arabic: 'هاي', transliteration: 'hay' },
			palestinian: { arabic: 'هاي', transliteration: 'hay' }
		}
	},
	{
		id: 'thing',
		english: 'thing, something',
		forms: {
			syrian: { arabic: 'شي', transliteration: 'shi' },
			lebanese: { arabic: 'شي', transliteration: 'shi' },
			jordanian: { arabic: 'إشي', transliteration: 'ishi' },
			palestinian: { arabic: 'إشي', transliteration: 'ishi' }
		}
	},
	{
		id: 'not',
		english: 'not (before a noun or adjective)',
		forms: {
			syrian: { arabic: 'مو', transliteration: 'mu' },
			lebanese: { arabic: 'مش', transliteration: 'mish' },
			jordanian: { arabic: 'مش', transliteration: 'mish' },
			palestinian: { arabic: 'مش', transliteration: 'mish' }
		},
		note: 'Verbs take ma everywhere: ma ba3ref, I don’t know.'
	},
	{
		id: 'yes',
		english: 'yes',
		forms: {
			syrian: { arabic: 'إي', transliteration: 'ee' },
			lebanese: { arabic: 'إيه', transliteration: 'eh' },
			jordanian: { arabic: 'آه', transliteration: 'aah' },
			palestinian: { arabic: 'آه', transliteration: 'aah' }
		}
	}
];

export const SHARED_WORDS: SharedWord[] = [
	{ id: 'want', english: 'I want', arabic: 'بدّي', transliteration: 'baddi / biddi' },
	{ id: 'where', english: 'where', arabic: 'وين', transliteration: 'wein' },
	{ id: 'like-this', english: 'like this', arabic: 'هيك', transliteration: 'heek' },
	{ id: 'a-lot', english: 'a lot, very', arabic: 'كتير', transliteration: 'kteer' },
	{ id: 'good', english: 'good', arabic: 'منيح', transliteration: 'mnee7' },
	{ id: 'how-much', english: 'how much', arabic: 'قدّيش', transliteration: '2addeish' }
];

/** The voice shared words are recorded in. */
export const SHARED_VOICE: LevantineVariety = 'syrian';

export function clipPath(kind: 'sentence' | 'word' | 'shared', id: string, variety: LevantineVariety): string {
	return `/audio/levantine/${kind}-${id}-${variety}.mp3`;
}

/** Every clip both pages play, for the recording script. */
export function levantineClips(): { path: string; arabic: string; variety: LevantineVariety }[] {
	return [
		...COMPARE_SENTENCES.flatMap((s) =>
			LEVANTINE_VARIETIES.map((v) => ({ path: clipPath('sentence', s.id, v), arabic: s.forms[v].arabic, variety: v }))
		),
		...COMPARE_WORDS.flatMap((w) =>
			LEVANTINE_VARIETIES.map((v) => ({ path: clipPath('word', w.id, v), arabic: w.forms[v].arabic, variety: v }))
		),
		...SHARED_WORDS.map((w) => ({ path: clipPath('shared', w.id, SHARED_VOICE), arabic: w.arabic, variety: SHARED_VOICE }))
	];
}
