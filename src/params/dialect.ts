import type { ParamMatcher } from '@sveltejs/kit';

const DIALECTS = new Set(['egyptian-arabic', 'levantine', 'darija', 'fusha']);

export const match: ParamMatcher = (param) => DIALECTS.has(param);
