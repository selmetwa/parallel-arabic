import type { GameDialect } from '$lib/games/themes';
import type { VerbFile } from '$lib/games/verb-blitz';

/** The conjugation files, loaded per dialect on first use. */
const files = import.meta.glob<{ default: VerbFile }>('/src/lib/data/verb-conjugations/*/*.json');

const cache = new Map<GameDialect, Promise<VerbFile[]>>();

export function verbsFor(dialect: GameDialect): Promise<VerbFile[]> {
	let verbs = cache.get(dialect);
	if (!verbs) {
		const paths = Object.keys(files).filter(
			(p) => p.includes(`/verb-conjugations/${dialect}/`) && !p.endsWith('/index.json')
		);
		verbs = Promise.all(paths.map(async (p) => (await files[p]()).default));
		cache.set(dialect, verbs);
	}
	return verbs;
}
