/** PostgREST `.or()` filter for saved words due for review: never scheduled, or due by `now`. */
export function dueFilter(now = Date.now()) {
	return `next_review_date.is.null,next_review_date.lte.${now}`;
}
