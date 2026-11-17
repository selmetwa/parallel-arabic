import { NUR_ENABLED } from '$lib/constants/feature-flags';
import { getVarietyInfo, isVarietyOf, resolveVariety, type VarietyInfo } from '$lib/constants/varieties';

type VarietyUser = { target_dialect?: string | null; target_variety?: string | null } | null;

/**
 * The variety to write and speak in for this request. `requested` is an accent
 * the page picked for this session (the tutor's accent chips); it wins when it
 * belongs to the dialect. Otherwise the learner's saved variety, or the default.
 */
export function learnerVariety(locals: App.Locals, dialect: string, requested?: unknown): VarietyInfo | undefined {
	if (NUR_ENABLED && isVarietyOf(requested, dialect)) return getVarietyInfo(requested);
	return resolveVariety(dialect, (locals as { user?: VarietyUser }).user);
}
