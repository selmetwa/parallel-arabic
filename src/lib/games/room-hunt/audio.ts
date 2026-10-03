/**
 * Room Hunt's clips are short static mp3s, so one plain <audio> at a time is
 * enough: a new clip cuts off the one still playing.
 */
let current: HTMLAudioElement | null = null;
let finishCurrent: (() => void) | null = null;

/** Plays a clip; resolves when it ends, is cut off, or can't play. */
export function playClip(url: string): Promise<void> {
	stopClip();
	const audio = new Audio(url);
	current = audio;
	return new Promise((resolve) => {
		finishCurrent = resolve;
		audio.addEventListener('ended', () => resolve(), { once: true });
		audio.addEventListener('error', () => resolve(), { once: true });
		// Autoplay can be refused before the first tap; the replay button is the fallback.
		audio.play().catch(() => resolve());
	});
}

export function stopClip() {
	current?.pause();
	current = null;
	finishCurrent?.();
	finishCurrent = null;
}
