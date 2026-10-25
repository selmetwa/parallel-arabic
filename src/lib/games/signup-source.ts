import { anonId, trackEvent } from '$lib/analytics';

/**
 * Which game sent a visitor to sign up, kept on this device until the account
 * exists, so new accounts can be counted per game.
 */
const KEY = 'pa-game-signup';

export type SignupFrom = 'gate' | 'results' | 'hub';

export function noteGameSignup(game: string, from: SignupFrom, choice: 'signup' | 'login' = 'signup') {
	trackEvent('game_signup_clicked', { game, from, choice });
	try {
		localStorage.setItem(KEY, JSON.stringify({ game, from }));
	} catch {
		// No storage: the click is recorded, the account just won't be tied to it.
	}
}

/** Call on arrival after sign-up (`?newSignup=true`) to record the new account. */
export function recordGameAccount(url: URL) {
	if (url.searchParams.get('newSignup') !== 'true') return;
	let source: { game: string; from: SignupFrom } | null;
	try {
		source = JSON.parse(localStorage.getItem(KEY) ?? 'null');
		localStorage.removeItem(KEY);
	} catch {
		return;
	}
	if (source) trackEvent('game_account_created', { ...source, anon_id: anonId() });
}
