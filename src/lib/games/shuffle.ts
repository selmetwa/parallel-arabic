/**
 * Unbiased shuffling for the games. The older `sort(() => Math.random() - 0.5)`
 * call sites elsewhere are biased; new code uses these instead.
 */

/** Fisher–Yates. Returns a shuffled copy; the input is not touched. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/**
 * Shuffle until the order differs from the original, so a scramble never
 * starts already solved. Gives up after `tries` — identical items (or a single
 * item) can't be reordered, and the caller should not hang on them.
 */
export function shuffleUntilDifferent<T>(
	items: readonly T[],
	same: (a: T, b: T) => boolean = (a, b) => a === b,
	random: () => number = Math.random,
	tries = 10
): T[] {
	let out = shuffle(items, random);
	for (let i = 0; i < tries && out.every((item, idx) => same(item, items[idx])); i++) {
		out = shuffle(items, random);
	}
	return out;
}
