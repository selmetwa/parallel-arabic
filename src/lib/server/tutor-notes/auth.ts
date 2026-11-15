import { json } from '@sveltejs/kit';
import { getUserHasActiveSubscription } from '$lib/helpers/get-user-has-active-subscription';

// hooks.server.ts sets locals.auth, but App.Locals doesn't declare it.
type AuthLocals = {
	auth?: { validate(): Promise<{ sessionId?: string | null; user?: { id: string } | null } | null> };
};

/** Tutor notes are subscriber-only. Returns the user id, or the 401/403 response to send. */
export async function requireSubscriber(locals: unknown): Promise<{ userId: string } | { error: Response }> {
	const { sessionId, user } = (await (locals as AuthLocals).auth?.validate()) ?? {};
	if (!sessionId || !user) return { error: json({ error: 'Unauthorized' }, { status: 401 }) };
	if (!(await getUserHasActiveSubscription(user.id))) {
		return {
			error: json({ error: 'Tutor notes are part of a subscription.', requiresSubscription: true }, { status: 403 })
		};
	}
	return { userId: user.id };
}
