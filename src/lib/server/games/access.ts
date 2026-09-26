import { json } from '@sveltejs/kit';
import { getUserHasActiveSubscription } from '$lib/helpers/get-user-has-active-subscription';

/**
 * Gate for the Premium game endpoints. Returns null when the caller is a
 * subscriber, otherwise the 401/403 response to send back. The client opens
 * the sign-in modal on 401 and the paywall on 403.
 */
// App.Locals is not typed in this repo; this is the part hooks.server.ts provides.
type SessionLocals = {
	safeGetSession: () => Promise<{ session: unknown; user: { id: string } | null }>;
};

export async function requireSubscriber(locals: App.Locals): Promise<Response | null> {
	const { session, user } = await (locals as unknown as SessionLocals).safeGetSession();
	if (!session || !user) {
		return json({ error: 'Sign in to play' }, { status: 401 });
	}

	if (!(await getUserHasActiveSubscription(user.id))) {
		return json({ error: 'Premium required', requiresSubscription: true }, { status: 403 });
	}

	return null;
}
