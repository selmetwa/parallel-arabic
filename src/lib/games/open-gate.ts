import type { RoundGate } from './free-rounds.svelte';

/**
 * A round gate that never blocks, for the short games embedded in blog posts:
 * reading an article shouldn't spend a game's free rounds or stop mid-post.
 * The sign-up nudge on the results screen still shows for signed-out readers.
 */
export function openGate(): RoundGate {
	return {
		ready: true,
		unlimited: true,
		remaining: Infinity,
		modal: null,
		canStart: () => true,
		tryStartRound: () => true,
		block: () => {},
		closeModal: () => {}
	};
}
