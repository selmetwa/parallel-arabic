import type { ParamMatcher } from '@sveltejs/kit';
import { COMPARISON_SLUGS } from '$lib/constants/dialect-comparisons';

const slugs = new Set(COMPARISON_SLUGS);

export const match: ParamMatcher = (param) => slugs.has(param);
