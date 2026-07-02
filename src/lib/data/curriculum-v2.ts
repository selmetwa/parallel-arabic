/**
 * Registry of v2 curricula, keyed by dialect.
 *
 * The A1–B1 topics are universal life topics that transfer to any dialect; the
 * B2–C2 units contain culture-specific material. To add a dialect, provide its
 * `CurriculumV2Module[]` here (reuse the A1–B1 structure, swap culture-specific
 * higher-level units) — everything downstream is dialect-agnostic.
 */

import { type Dialect } from '$lib/types/index';
import {
	curriculumEgyptianV2,
	type CurriculumV2Module,
	type CurriculumV2Topic
} from './curriculum-egyptian-v2';
import { baseCurriculumV2A1B2 } from './curriculum-base-v2';

export type { CurriculumV2Module, CurriculumV2Topic };
export { baseCurriculumV2A1B2 };

/**
 * v2 curricula by dialect.
 *
 * - Egyptian uses its bespoke full A1–C2 curriculum.
 * - Other dialects use the shared, dialect-neutral A1–B2 base
 *   (`baseCurriculumV2A1B2`) — C1/C2 are Egypt/literary-specific and authored
 *   per dialect if/when needed.
 *
 * To enable a dialect's v2 path, add it here, e.g.:
 *   levantine: baseCurriculumV2A1B2,
 *   darija: baseCurriculumV2A1B2,
 *
 * NOTE: enabling a dialect switches its /lessons/structured path from the legacy
 * system to v2 (empty until its lessons are generated), so only add a dialect
 * once you intend to generate and ship its v2 lessons.
 */
export const curriculumV2: Partial<Record<Dialect, CurriculumV2Module[]>> = {
	'egyptian-arabic': curriculumEgyptianV2
};

/** Dialects that currently have a v2 curriculum (and therefore v2 lessons). */
export const V2_DIALECTS = Object.keys(curriculumV2) as Dialect[];

export function hasV2Curriculum(dialect: string): boolean {
	return Boolean(curriculumV2[dialect as Dialect]);
}

export function getCurriculumV2(dialect: string): CurriculumV2Module[] | null {
	return curriculumV2[dialect as Dialect] ?? null;
}

export function findV2Topic(
	dialect: string,
	topicId: string
): { module: CurriculumV2Module; topic: CurriculumV2Topic } | null {
	const modules = getCurriculumV2(dialect);
	if (!modules) return null;
	for (const module of modules) {
		const topic = module.topics.find((t) => t.id === topicId);
		if (topic) return { module, topic };
	}
	return null;
}
