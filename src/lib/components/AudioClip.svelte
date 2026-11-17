<script lang="ts" module>
	// One player for the whole page, so starting a clip stops the last one.
	let current: HTMLAudioElement | null = null;
</script>

<script lang="ts">
	// A play button for a pre-recorded clip (static mp3). Free and instant, unlike
	// AudioButton, which generates speech on request and counts against the free plays.
	interface Props {
		src: string;
		/** What the clip says, for screen readers: "Play: shu baddak". */
		label: string;
		/** Optional visible text after the icon. */
		text?: string;
	}

	let { src, label, text }: Props = $props();
	let playing = $state(false);

	function play() {
		current?.pause();
		const audio = new Audio(src);
		current = audio;
		playing = true;
		const done = () => (playing = false);
		audio.onended = done;
		audio.onpause = done;
		audio.play().catch(done);
	}
</script>

<button type="button" class={['clip', { 'is-playing': playing }]} onclick={play} aria-label="Play: {label}">
	<span class="clip-icon" aria-hidden="true">{playing ? '❚❚' : '▶'}</span>
	{#if text}<span class="clip-text">{text}</span>{/if}
</button>

<style>
	.clip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border-radius: 100px;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 0.2rem 0.55rem;
		font-size: 0.8rem;
		font-weight: 600;
		line-height: 1.2;
		color: var(--text1);
		cursor: pointer;
		vertical-align: middle;
		transition: border-color 0.15s ease;
	}
	.clip:hover,
	.clip.is-playing {
		border-color: #10b981;
	}
	.clip-icon {
		font-size: 0.65rem;
		color: #047857;
	}
</style>
