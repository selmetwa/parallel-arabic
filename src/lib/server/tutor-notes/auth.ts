import { json } from '@sveltejs/kit';
import { getUserHasActiveSubscription } from '$lib/helpers/get-user-has-active-subscription';

// hooks.server.ts sets locals.auth, but App.Locals doesn't declare it.
type AuthLocals = {
	auth?: { validate(): Promise<{ sessionId?: string | null; user?: { id: string } | null } | null> };
};

/** Signed-in check only, for calls made on every lesson step. Returns the user id, or the 401 to send. */
export async function requireUser(locals: unknown): Promise<{ userId: string } | { error: Response }> {
	const { sessionId, user } = (await (locals as AuthLocals).auth?.validate()) ?? {};
	if (!sessionId || !user) return { error: json({ error: 'Unauthorized' }, { status: 401 }) };
	return { userId: user.id };
}

/** Tutor notes are subscriber-only. Returns the user id, or the 401/403 response to send. */
export async function requireSubscriber(locals: unknown): Promise<{ userId: string } | { error: Response }> {
	const auth = await requireUser(locals);
	if ('error' in auth) return auth;
	if (!(await getUserHasActiveSubscription(auth.userId))) {
		return {
			error: json({ error: 'Tutor notes are part of a subscription.', requiresSubscription: true }, { status: 403 })
		};
	}
	return auth;
}
