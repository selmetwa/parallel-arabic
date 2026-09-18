import { supabase } from '$lib/supabaseClient';
import { StripeService } from '$lib/services/stripe.service';
import { checkUserSubscription } from '$lib/helpers/subscription';

/**
 * Stripe subscription -> user row sync
 *
 * Single source of truth for turning a Stripe subscription into the
 * is_subscriber / subscriber_id / subscription_end_date columns. Used by both
 * the post-checkout return page and the webhook so trials, renewals and failed
 * charges can't drift apart.
 *
 * Statuses that grant access. 'trialing' is included because a card-up-front
 * trial is premium access we have already promised.
 */
const ACTIVE_STATUSES = ['trialing', 'active'];

type SyncResult = {
	updated: boolean;
	isTrial: boolean;
	endDate: number | null;
};

const NO_CHANGE: SyncResult = { updated: false, isTrial: false, endDate: null };

/**
 * @param subscriptionId - Stripe subscription id (sub_...)
 * @param userIdHint - user.id from checkout's client_reference_id, when we have it
 */
export async function syncStripeSubscription(
	subscriptionId: string | null | undefined,
	userIdHint?: string | null
): Promise<SyncResult> {
	if (!subscriptionId) return NO_CHANGE;

	const subscription = await StripeService.getSubscription(subscriptionId);
	if (!subscription) {
		console.error('[stripe-link] Could not retrieve subscription', subscriptionId);
		return NO_CHANGE;
	}

	// Prefer the row already pointing at this subscription; fall back to the id
	// checkout gave us, then to the metadata we stamp on the subscription.
	const { data: bySubscriber } = await supabase
		.from('user')
		.select('*')
		.eq('subscriber_id', subscriptionId)
		.maybeSingle();

	let user = bySubscriber;
	let matchedBySubscriberId = !!bySubscriber;

	if (!user) {
		const hintedId = userIdHint ?? subscription.metadata?.user_id ?? null;
		if (!hintedId) {
			console.error('[stripe-link] No user could be resolved for', subscriptionId);
			return NO_CHANGE;
		}

		const { data: byId } = await supabase
			.from('user')
			.select('*')
			.eq('id', hintedId)
			.maybeSingle();
		user = byId;
	}

	if (!user) {
		console.error('[stripe-link] Resolved id did not match a user for', subscriptionId);
		return NO_CHANGE;
	}

	// Apple guard: never let a Stripe event touch a user whose live subscription
	// is an Apple IAP one. Apple ids are original transaction ids, never sub_...
	const hasAppleSubscription = !!user.subscriber_id && !user.subscriber_id.startsWith('sub_');
	if (!matchedBySubscriberId && hasAppleSubscription && checkUserSubscription(user)) {
		console.warn(
			'[stripe-link] Skipping Stripe sync for user with an active Apple subscription',
			{ userId: user.id, subscriptionId }
		);
		return NO_CHANGE;
	}

	const isActive = ACTIVE_STATUSES.includes(subscription.status);
	// Stripe keeps trial_end populated after a trial converts, so it only means
	// "currently on trial" while the status says so. hasTrialed stays true for
	// good, which is what gates a second trial.
	const isTrial = subscription.status === 'trialing';
	const hasTrialed = !!subscription.trial_end;

	if (isActive) {
		// While trialing these are the same date; after conversion trial_end is
		// in the past, so only current_period_end is safe to store.
		const endDate = isTrial
			? (subscription.trial_end ?? subscription.current_period_end ?? null)
			: (subscription.current_period_end ?? null);

		const { error } = await supabase
			.from('user')
			.update({
				is_subscriber: true,
				subscriber_id: subscriptionId,
				subscription_end_date: endDate,
				// A trial only ever gets offered once per account.
				...(hasTrialed && { has_used_trial: true })
			})
			.eq('id', user.id);

		if (error) {
			console.error('[stripe-link] Error granting access:', error);
			return NO_CHANGE;
		}

		return { updated: true, isTrial, endDate };
	}

	// past_due / unpaid / canceled / incomplete_expired. Only revoke when this
	// subscription is the one the user is actually on, so a stale event can't
	// remove access granted elsewhere. subscriber_id is deliberately left in
	// place: if Stripe recovers the payment, the next event finds this row
	// again and flips access back on.
	if (user.subscriber_id !== subscriptionId) {
		return NO_CHANGE;
	}

	const { error } = await supabase
		.from('user')
		.update({
			is_subscriber: false,
			...(hasTrialed && { has_used_trial: true })
		})
		.eq('id', user.id);

	if (error) {
		console.error('[stripe-link] Error revoking access:', error);
		return NO_CHANGE;
	}

	return { updated: true, isTrial, endDate: null };
}
