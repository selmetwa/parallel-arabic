/**
 * The web cancel flow: why they're leaving, an offer that fits the reason,
 * then cancel anyway. Apple subscriptions are cancelled in iOS Settings and
 * never reach this.
 *
 * Pausing stops billing for 1–3 months. Access runs to the end of the period
 * they already paid for, then stops until billing restarts. Stripe keeps the
 * subscription `active` while paused, so the paid-through date is stamped on
 * its metadata and read back by `stripeAccessEnd`.
 */

export type CancelReasonId =
	| 'too_expensive'
	| 'not_using'
	| 'missing_content'
	| 'temporary'
	| 'switched'
	| 'other';

type StripeFeedback = 'too_expensive' | 'unused' | 'missing_features' | 'switched_service' | 'other';

export interface CancelReason {
	id: CancelReasonId;
	label: string;
	/** Sent to Stripe so the reason shows on the subscription in the dashboard. */
	feedback: StripeFeedback;
	/** Offer a pause before cancelling. */
	pause: boolean;
	/** Ask for a sentence more. */
	askDetail?: string;
	/** Shown above the offer. */
	pitch?: string;
}

export const CANCEL_REASONS: CancelReason[] = [
	{
		id: 'too_expensive',
		label: "It's too expensive",
		feedback: 'too_expensive',
		pause: true,
		pitch: "Pause instead and you won't be charged until you're ready. Your words and progress stay put."
	},
	{
		id: 'not_using',
		label: "I'm not using it enough",
		feedback: 'unused',
		pause: true,
		pitch: 'Life gets busy. Pause, and everything is waiting when you come back.'
	},
	{
		id: 'missing_content',
		label: "It doesn't have what I need",
		feedback: 'missing_features',
		pause: true,
		askDetail: 'What were you looking for?',
		pitch:
			'Thanks, that goes straight to the person building it. New lessons and dialects keep arriving (Iraqi, Gulf and Saudi are the latest), so you could pause and check back.'
	},
	{
		id: 'temporary',
		label: 'I only needed it for a while (a trip, a class)',
		feedback: 'other',
		pause: true,
		pitch: "Pause until you need it again. You won't be charged in the meantime."
	},
	{ id: 'switched', label: 'I found something else', feedback: 'switched_service', pause: false },
	{
		id: 'other',
		label: 'Something else',
		feedback: 'other',
		pause: false,
		askDetail: 'Anything you want to tell us?'
	}
];

export function cancelReason(id: unknown): CancelReason | undefined {
	return CANCEL_REASONS.find((r) => r.id === id);
}

export const PAUSE_MONTHS = [1, 2, 3] as const;
export type PauseMonths = (typeof PAUSE_MONTHS)[number];

export function isPauseMonths(value: unknown): value is PauseMonths {
	return PAUSE_MONTHS.includes(value as PauseMonths);
}

/** Longest free-text detail kept with a cancellation. */
export const DETAIL_MAX = 500;

/** Metadata key holding the end of the last paid period while paused (unix seconds). */
export const PAID_THROUGH_KEY = 'paid_through';

/** An hour's margin, so billing restarts before the renewal invoice is created rather than after. */
const RESUME_MARGIN_SECONDS = 60 * 60;

/**
 * When billing restarts: `months` billing periods after the paid one ends,
 * just ahead of the renewal, so the first invoice back is charged rather than
 * voided.
 */
export function pauseResumesAt(paidThrough: number, months: number): number {
	const date = new Date(paidThrough * 1000);
	const day = date.getUTCDate();
	date.setUTCMonth(date.getUTCMonth() + months);
	// Jan 31 + 1 month rolls into March; Stripe renews on the last day of February.
	if (date.getUTCDate() !== day) date.setUTCDate(0);
	return Math.floor(date.getTime() / 1000) - RESUME_MARGIN_SECONDS;
}

/** Only a monthly plan that's paying, not cancelling and not already paused can pause. */
export function canPause(details: {
	status: string | null;
	interval?: string | null;
	cancelAtPeriodEnd: boolean;
	pausedUntil?: number | null;
}): boolean {
	return (
		details.status === 'active' &&
		details.interval === 'month' &&
		!details.cancelAtPeriodEnd &&
		!details.pausedUntil
	);
}

interface SubscriptionLike {
	status: string;
	trial_end?: number | null;
	current_period_end?: number | null;
	pause_collection?: { resumes_at?: number | null } | null;
	metadata?: Record<string, string> | null;
}

/** The paid-through date while paused, or null when the subscription isn't paused. */
export function pausedPaidThrough(subscription: SubscriptionLike): number | null {
	if (!subscription.pause_collection) return null;
	const paidThrough = Number(subscription.metadata?.[PAID_THROUGH_KEY]);
	return Number.isFinite(paidThrough) && paidThrough > 0 ? paidThrough : null;
}

/**
 * When access ends for a Stripe subscription in a granting status: the paid
 * period while paused, otherwise the trial or current period.
 */
export function stripeAccessEnd(subscription: SubscriptionLike): number | null {
	const paidThrough = pausedPaidThrough(subscription);
	if (paidThrough) return paidThrough;
	// While trialing these are the same date; after conversion trial_end is in
	// the past, so only current_period_end is safe to use.
	return subscription.status === 'trialing'
		? (subscription.trial_end ?? subscription.current_period_end ?? null)
		: (subscription.current_period_end ?? null);
}
