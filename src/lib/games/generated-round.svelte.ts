import type { GameDialect } from './themes';
import type { GameLevel } from './levels';

export type RoundStatus = 'idle' | 'loading' | 'playing' | 'error';

/**
 * Client state for a generated puzzle round: ask the endpoint for a fresh
 * batch and turn its refusals into the right modal — 401 means sign up, 403
 * means the free rounds are used and it's time for the paywall.
 */
export function createGeneratedRound<T>(endpoint: string) {
	let status = $state<RoundStatus>('idle');
	let items = $state<T[]>([]);
	let error = $state('');
	let modal = $state<'auth' | 'paywall' | null>(null);
	let roundId = $state(0);

	/** Resolves true once a round is ready to play. */
	async function start(dialect: GameDialect, level: GameLevel): Promise<boolean> {
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
				return false;
			}
			const body = await res.json().catch(() => ({}));
			if (!res.ok || !Array.isArray(body.items)) {
				throw new Error(body.error || 'Something went wrong. Try again.');
			}
			items = body.items;
			roundId++;
			status = 'playing';
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong. Try again.';
			status = 'error';
			return false;
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
		closeModal() {
			modal = null;
		}
	};
}
