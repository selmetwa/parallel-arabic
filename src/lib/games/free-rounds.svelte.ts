import { browser } from '$app/environment';
import { FREE_ROUNDS_PER_DAY, localDay, readRoundsUsed, recordRound } from './free-rounds';

export type GateModal = 'auth' | 'paywall' | null;

function storage(): Storage | null {
	try {
		return browser ? localStorage : null;
	} catch {
		return null;
	}
}

/**
 * Reactive wrapper around the free-round allowance for one game. Storage is
 * only read after mount, so the server render never depends on it.
 *
 * Call `tryStartRound()` on the first move of a round: it counts the round, or
 * opens the sign-up / paywall modal and returns false when the allowance is used.
 */
export function createRoundGate(
	game: string,
	access: () => { isSubscribed: boolean; userId: string | null }
) {
	let used = $state(0);
	let ready = $state(false);
	let modal = $state<GateModal>(null);

	const who = () => access().userId ?? 'anon';

	$effect(() => {
		used = readRoundsUsed(storage(), game, who(), localDay());
		ready = true;
	});

	function block() {
		modal = access().userId ? 'paywall' : 'auth';
	}

	function canStart() {
		return access().isSubscribed || used < FREE_ROUNDS_PER_DAY;
	}

	function tryStartRound() {
		if (access().isSubscribed) return true;
		if (used >= FREE_ROUNDS_PER_DAY) {
			block();
			return false;
		}
		used = Math.max(used + 1, recordRound(storage(), game, who(), localDay()));
		return true;
	}

	return {
		get ready() {
			return ready;
		},
		get unlimited() {
			return access().isSubscribed;
		},
		get remaining() {
			return Math.max(0, FREE_ROUNDS_PER_DAY - used);
		},
		get modal() {
			return modal;
		},
		canStart,
		tryStartRound,
		block,
		closeModal() {
			modal = null;
		}
	};
}

export type RoundGate = ReturnType<typeof createRoundGate>;
