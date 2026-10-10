/**
 * Everything Dialect Match can ask about: the hand-written sets, Room Hunt's
 * recorded words, and the phrasebook entries written for all four dialects.
 * All of it is our own content, so it can go into the page.
 */
import sets from '$lib/data/dialect-match/sets.json';
import { phraseSlugsFor, getPhrase } from '$lib/data/phrases/manifest';
import { GAME_DIALECTS, type GameDialect } from '$lib/games/themes';
import { VOCAB, wordFor } from '$lib/games/room-hunt/round';
import type { DialectItem } from '$lib/games/dialect-match';

function roomHuntItems(): DialectItem[] {
	return Object.keys(VOCAB).map((id) => {
		const forms = Object.fromEntries(
			GAME_DIALECTS.map((d) => {
				const w = wordFor(id, d);
				return [d, { arabic: w.arabic, transliteration: w.transliteration, audioUrl: w.audioUrl }];
			})
		) as DialectItem['forms'];
		return { id: `room-${id}`, english: `the ${wordFor(id, 'fusha').english}`, forms };
	});
}

function phraseItems(): DialectItem[] {
	const common = phraseSlugsFor('egyptian-arabic').filter((slug) =>
		GAME_DIALECTS.every((d) => getPhrase(d, slug))
	);
	return common.map((slug) => {
		const forms = Object.fromEntries(
			GAME_DIALECTS.map((d) => {
				const p = getPhrase(d, slug)!;
				return [d, { arabic: p.arabic, transliteration: p.transliteration }];
			})
		) as Record<GameDialect, { arabic: string; transliteration: string }>;
		return { id: `phrase-${slug}`, english: getPhrase('egyptian-arabic', slug)!.english, forms };
	});
}

let cached: DialectItem[] | null = null;

export function dialectMatchItems(): DialectItem[] {
	cached ??= [...(sets as DialectItem[]), ...roomHuntItems(), ...phraseItems()];
	return cached;
}
