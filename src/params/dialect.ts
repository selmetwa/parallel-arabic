import type { ParamMatcher } from '@sveltejs/kit';
import { isDialect } from '$lib/constants/dialects';

export const match: ParamMatcher = (param) => isDialect(param);
