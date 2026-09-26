import { browser } from '$app/environment';
import { FREE_ROUNDS, readRoundsUsed, recordRound } from './free-rounds';

export type GateModal = 'auth' | 'paywall' | null;

function storage(): Storage | null {
	try {
		return browser ? localStorage : null;
	} catch {
		return null;
	}
}

/**
 * Reactive wrapper around the free rounds for one game. Storage is
 * only read after mount, so the server render never depends on it.
 *
 * Call `tryStartRound()` on the first move of a round: it counts the round, or
 * opens the sign-up / paywall modal and returns false when the free rounds are used.
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
		used = readRoundsUsed(storage(), game, who());
		ready = true;
	});

	function block() {
		modal = access().userId ? 'paywall' : 'auth';
	}

	function canStart() {
		return access().isSubscribed || used < FREE_ROUNDS;
	}

	function tryStartRound() {
		if (access().isSubscribed) return true;
		if (used >= FREE_ROUNDS) {
			block();
			return false;
		}
		used = Math.max(used + 1, recordRound(storage(), game, who()));
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
			return Math.max(0, FREE_ROUNDS - used);
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

/**
 * The line under a game's heading for non-subscribers: how many free rounds
 * are left. Nothing for subscribers, and nothing until storage has been read.
 */
export function freeRoundsStatus(gate: RoundGate, roundName: string): string | undefined {
	if (!gate.ready || gate.unlimited) return undefined;
	if (gate.remaining === 0) return `You've used your free ${roundName}`;
	return `${gate.remaining} of ${FREE_ROUNDS} free ${roundName} left`;
}
