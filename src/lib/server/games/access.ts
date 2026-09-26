import { json, type Cookies } from '@sveltejs/kit';
import { getUserHasActiveSubscription } from '$lib/helpers/get-user-has-active-subscription';
import { consumeRateLimit, getRedisClient } from '$lib/server/redis';
import { FREE_ROUNDS } from '$lib/games/free-rounds';

// App.Locals is not typed in this repo; this is the part hooks.server.ts provides.
type SessionLocals = {
	safeGetSession: () => Promise<{ session: unknown; user: { id: string } | null }>;
};

interface GameEvent {
	locals: App.Locals;
	cookies: Cookies;
	getClientAddress: () => string;
}

/** Rounds per hour one IP can generate without a subscription — a cost ceiling. */
const IP_ROUNDS_PER_HOUR = 20;
const YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Free rounds for the generated games, counted where the browser can't reset
 * them: in Redis for accounts, in an httpOnly cookie for signed-out visitors
 * (backed by a per-IP hourly ceiling). Subscribers are never counted.
 *
 * Returns the 401 (sign up) / 403 (paywall) / 429 response to send, or a
 * `charge` to call once the round has actually been generated — a failed
 * generation shouldn't use up a free round.
 */
export async function checkGameAccess(
	{ locals, cookies, getClientAddress }: GameEvent,
	game: string
): Promise<{ denied: Response } | { charge: () => Promise<void> }> {
	const { session, user } = await (locals as unknown as SessionLocals).safeGetSession();
	const signedIn = !!session && !!user;

	if (signedIn && (await getUserHasActiveSubscription(user!.id))) {
		return { charge: async () => {} };
	}

	const { allowed } = await consumeRateLimit(
		`games:ip:${getClientAddress()}`,
		IP_ROUNDS_PER_HOUR,
		60 * 60
	);
	if (!allowed) {
		return {
			denied: json({ error: 'Too many rounds right now. Try again later.' }, { status: 429 })
		};
	}

	if (signedIn) {
		const key = `games:free:${game}:user:${user!.id}`;
		const redis = await getRedisClient();
		// Without Redis the count can't be kept; fail open, as the rate limiter does.
		const used = redis ? Number(await redis.get(key).catch(() => 0)) || 0 : 0;
		if (used >= FREE_ROUNDS) {
			return {
				denied: json({ error: 'Premium required', requiresSubscription: true }, { status: 403 })
			};
		}
		return {
			charge: async () => {
				try {
					if ((await redis?.incr(key)) === 1) await redis?.expire(key, YEAR_SECONDS);
				} catch (error) {
					console.error('Could not record a free game round:', error);
				}
			}
		};
	}

	const cookie = `pa_free_${game.replace(/-/g, '_')}`;
	const used = Number(cookies.get(cookie)) || 0;
	if (used >= FREE_ROUNDS) {
		return { denied: json({ error: 'Sign up to keep playing' }, { status: 401 }) };
	}
	return {
		charge: async () => {
			cookies.set(cookie, String(used + 1), {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: YEAR_SECONDS
			});
		}
	};
}
