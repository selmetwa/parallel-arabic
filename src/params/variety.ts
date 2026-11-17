import type { ParamMatcher } from '@sveltejs/kit';
import { NUR_ENABLED } from '$lib/constants/feature-flags';
import { getVarietyBySlug } from '$lib/constants/varieties';

/** /lebanese-arabic, /kuwaiti-arabic, ... (404 while the flag is off). */
export const match: ParamMatcher = (param) => NUR_ENABLED && Boolean(getVarietyBySlug(param));
