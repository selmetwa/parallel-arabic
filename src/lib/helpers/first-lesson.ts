import { getCurriculumV2 } from '$lib/data/curriculum-v2';

export interface FirstLesson {
	href: string;
	title: string;
}

/**
 * The single lesson a new learner should open next — a deep link, not a hub
 * page to choose from (docs/onboarding-v3-plan.md). Shared by the onboarding
 * plan screen, the first-run home card and the day-1/day-3 nudge emails.
 *
 * - A1 starts with the alphabet.
 * - Dialects with a v2 curriculum open a lesson directly via `?lessonId=`.
 *   Free accounts can only open the very first lesson, so subscribers get the
 *   first lesson at their level and everyone else gets lesson one.
 * - Anything else falls back to that dialect's lesson path.
 */
export function firstLesson(
	dialect: string | null | undefined,
	level: string | null | undefined,
	isSubscribed = false
): FirstLesson {
	if (!level || level === 'A1') {
		return { href: '/alphabet/learn', title: 'The Arabic alphabet' };
	}

	const d = dialect || 'egyptian-arabic';
	const modules = getCurriculumV2(d);
	if (!modules?.length) {
		return { href: `/lessons/structured/${d}`, title: 'Your first lesson' };
	}

	const module = (isSubscribed && modules.find((m) => m.level === level)) || modules[0];
	const topic = module.topics[0];
	return {
		href: `/lessons/structured/${d}?lessonId=${encodeURIComponent(topic.id)}`,
		title: topic.title
	};
}
