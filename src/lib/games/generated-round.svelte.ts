import type { GameDialect } from './themes';
import type { GameLevel } from './levels';

export type RoundStatus = 'idle' | 'loading' | 'playing' | 'error';

/**
 * Client state for a Premium puzzle round: ask the endpoint for a fresh batch
 * and route sign-in and paywall responses to the right modal.
 */
export function createGeneratedRound<T>(
	endpoint: string,
	access: () => { isSubscribed: boolean; signedIn: boolean }
) {
	let status = $state<RoundStatus>('idle');
	let items = $state<T[]>([]);
	let error = $state('');
	let modal = $state<'auth' | 'paywall' | null>(null);
	let roundId = $state(0);

	async function start(dialect: GameDialect, level: GameLevel) {
		const { isSubscribed, signedIn } = access();
		if (!signedIn) {
			modal = 'auth';
			return;
		}
		if (!isSubscribed) {
			modal = 'paywall';
			return;
		}

		status = 'loading';
		error = '';
		try {
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ dialect, level })
			});
			if (res.status === 401 || res.status === 403) {
				modal = res.status === 401 ? 'auth' : 'paywall';
				status = 'idle';
				return;
			}
			const body = await res.json().catch(() => ({}));
			if (!res.ok || !Array.isArray(body.items)) {
				throw new Error(body.error || 'Something went wrong. Try again.');
			}
			items = body.items;
			roundId++;
			status = 'playing';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong. Try again.';
			status = 'error';
		}
	}

	return {
		get status() {
			return status;
		},
		get items() {
			return items;
		},
		get error() {
			return error;
		},
		get modal() {
			return modal;
		},
		get roundId() {
			return roundId;
		},
		start,
		/** Open the sign-in or paywall modal, e.g. from the sample puzzle's Start button. */
		block() {
			modal = access().signedIn ? 'paywall' : 'auth';
		},
		closeModal() {
			modal = null;
		}
	};
}
