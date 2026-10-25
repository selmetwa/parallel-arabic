import { browser } from '$app/environment';
import { freeRounds, readRoundsUsed, recordRound } from './free-rounds';
import { trackEvent } from '$lib/analytics';

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
	const limit = () => freeRounds(game, !!access().userId);

	$effect(() => {
		used = readRoundsUsed(storage(), game, who());
		ready = true;
	});

	function block() {
		modal = access().userId ? 'paywall' : 'auth';
		trackEvent('game_gate_shown', { game, modal, used });
	}

	function canStart() {
		return access().isSubscribed || used < limit();
	}

	// A round started counts toward the daily goal.
	function logRound() {
		if (!access().userId) return;
		fetch('/api/activity', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ kind: 'game' })
		}).catch(() => {});
	}

	function tryStartRound() {
		if (access().isSubscribed) {
			logRound();
			return true;
		}
		if (used >= limit()) {
			block();
			return false;
		}
		used = Math.max(used + 1, recordRound(storage(), game, who()));
		logRound();
		// Signed-in rounds are already in activity_event.
		if (!access().userId) trackEvent('game_round_started', { game, round: used });
		return true;
	}

	return {
		get ready() {
			return ready;
		},
		get unlimited() {
			return access().isSubscribed;
		},
		get limit() {
			return limit();
		},
		get remaining() {
			return Math.max(0, limit() - used);
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
	return `${gate.remaining} of ${gate.limit} free ${roundName} left`;
}
