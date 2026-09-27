/**
 * Render per-letter colored Arabic as the fewest possible spans.
 *
 * WebKit (every iOS browser) shapes each inline element separately, so one
 * span per letter breaks cursive joining. Consecutive letters that share a
 * class are merged into one span, and a zero-width joiner is placed only at
 * the boundaries between spans so the letters on either side keep their
 * joining forms.
 */
export function arabicRunsHtml<T>(
	items: T[],
	char: (item: T) => string,
	cls: (item: T) => string
): string {
	const runs: { cls: string; text: string }[] = [];
	for (const item of items) {
		const c = cls(item);
		const last = runs.at(-1);
		if (last && last.cls === c) last.text += char(item);
		else runs.push({ cls: c, text: char(item) });
	}

	return runs
		.map(({ cls, text }, i) => {
			const pre = i > 0 ? '&zwj;' : '';
			const post = i < runs.length - 1 ? '&zwj;' : '';
			return `<span class="${cls}">${pre}${text}${post}</span>`;
		})
		.join('');
}
