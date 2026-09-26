import type { GameWord, PoolKind } from './word-pool';

export interface WordPoolResponse {
	theme: string;
	words: GameWord[];
}

const cache = new Map<string, Promise<WordPoolResponse>>();

/**
 * Load a theme's word list. The list is fetched after the page mounts rather
 * than rendered into it: the `word` table is licensed content that must not
 * become indexable page text.
 */
export function fetchWordPool(
	kind: PoolKind,
	dialect: string,
	theme: string
): Promise<WordPoolResponse> {
	const key = `${kind}|${dialect}|${theme}`;
	const cached = cache.get(key);
	if (cached) return cached;

	const params = new URLSearchParams({ kind, dialect, theme });
	const request = fetch(`/api/games/word-pool?${params}`).then(async (res) => {
		if (!res.ok) throw new Error('Could not load words');
		return (await res.json()) as WordPoolResponse;
	});
	// A failed request shouldn't be cached forever.
	request.catch(() => cache.delete(key));
	cache.set(key, request);
	return request;
}
