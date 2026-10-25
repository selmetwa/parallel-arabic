import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

/**
 * The signed-in user's Stripe subscription id, or the response to send when
 * there isn't one. Apple subscriptions are managed in iOS Settings, not here.
 */
export async function ownStripeSubscription(
	locals: App.Locals
): Promise<{ subscriptionId: string } | { denied: Response }> {
	const { session, user } = await (
		locals as unknown as {
			safeGetSession: () => Promise<{ session: unknown; user: { id: string } | null }>;
		}
	).safeGetSession();
	if (!session || !user) {
		return { denied: json({ error: 'You must be logged in' }, { status: 401 }) };
	}

	const { data, error } = await supabase
		.from('user')
		.select('subscriber_id')
		.eq('id', user.id)
		.single();
	if (error) {
		console.error('Error fetching user:', error);
		return { denied: json({ error: 'Failed to fetch user data' }, { status: 500 }) };
	}
	if (!data?.subscriber_id?.startsWith('sub_')) {
		return { denied: json({ error: 'No web subscription found' }, { status: 400 }) };
	}
	return { subscriptionId: data.subscriber_id };
}
