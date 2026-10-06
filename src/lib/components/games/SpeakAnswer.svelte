<script lang="ts">
	import { onDestroy } from 'svelte';
	import {
		PASS_THRESHOLD,
		checkMediaRecorderSupport,
		describeRecordingError,
		scorePronunciation,
		transcribe
	} from '$lib/utils/pronunciation';
	import type { GameDialect } from '$lib/games/themes';

	interface Props {
		/** What the learner may say; the closest one counts. */
		targets: string[];
		dialect: GameDialect;
		/** `index` is the target heard best, or -1 when none passed. */
		onResult: (index: number, heard: string) => void;
		/** No mic, or the speaking allowance ran out: stop offering this. */
		onUnavailable: (reason: string) => void;
		/** Just the round mic button, for tight spaces. */
		compact?: boolean;
	}

	let { targets, dialect, onResult, onUnavailable, compact = false }: Props = $props();

	let status = $state<'idle' | 'recording' | 'processing'>('idle');
	let error = $state('');
	let recorder: MediaRecorder | null = null;
	let stream: MediaStream | null = null;
	let chunks: Blob[] = [];

	async function start() {
		error = '';
		if (!checkMediaRecorderSupport()) {
			onUnavailable('This browser can’t record audio.');
			return;
		}
		try {
			stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch (e) {
			const message = describeRecordingError(e);
			if (e instanceof DOMException && e.name === 'NotAllowedError') onUnavailable(message);
			else error = message;
			return;
		}
		chunks = [];
		recorder = new MediaRecorder(stream);
		recorder.ondataavailable = (e) => {
			if (e.data.size > 0) chunks.push(e.data);
		};
		recorder.onstop = submit;
		recorder.start();
		status = 'recording';
	}

	function stop() {
		if (recorder?.state === 'recording') recorder.stop();
	}

	async function submit() {
		stream?.getTracks().forEach((t) => t.stop());
		stream = null;
		const blob = new Blob(chunks, { type: 'audio/webm' });
		chunks = [];
		if (blob.size < 1000) {
			status = 'idle';
			error = 'That was too short. Hold on a little longer.';
			return;
		}
		status = 'processing';
		try {
			const heard = await transcribe(blob, dialect);
			const scores = targets.map((t) => scorePronunciation(t, heard, dialect));
			const best = scores.indexOf(Math.max(...scores));
			onResult(scores[best] >= PASS_THRESHOLD.word ? best : -1, heard);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Could not hear that. Try again.';
			// The endpoint refuses once the free speaking allowance is gone.
			if (/Subscription required|Too many requests/i.test(message)) onUnavailable(message);
			else error = message;
		} finally {
			status = 'idle';
		}
	}

	onDestroy(() => {
		if (recorder) recorder.onstop = null;
		if (recorder?.state === 'recording') recorder.stop();
		stream?.getTracks().forEach((t) => t.stop());
	});
</script>

<div class="speak">
	<button
		type="button"
		class="mic"
		class:compact
		class:on={status === 'recording'}
		disabled={status === 'processing'}
		onclick={status === 'recording' ? stop : start}
		aria-label={status === 'recording' ? 'Stop recording' : 'Say it out loud'}
	>
		<svg viewBox="0 0 384 512" aria-hidden="true"
			><path
				d="M192 0C139 0 96 43 96 96v160c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 89.1 66.2 162.7 152 174.4V464h-48c-13.3 0-24 10.7-24 24s10.7 24 24 24h144c13.3 0 24-10.7 24-24s-10.7-24-24-24h-48v-33.6C301.8 418.7 368 345.1 368 256v-40c0-13.3-10.7-24-24-24s-24 10.7-24 24v40c0 70.7-57.3 128-128 128S64 326.7 64 256v-40z"
			/></svg
		>
		{#if !compact}
			<span>
				{#if status === 'recording'}Tap to stop{:else if status === 'processing'}Listening…{:else}Say it{/if}
			</span>
		{/if}
	</button>
	{#if error}<p class="error" role="alert">{error}</p>{/if}
</div>

<style>
	.speak {
		display: grid;
		justify-items: center;
		gap: 0.35rem;
	}

	.mic {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 2.5rem;
		padding: 0.45rem 1rem;
		border-radius: 100px;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text1);
		background: var(--tile3);
		border: 2px solid var(--tile5);
		cursor: pointer;
	}

	.mic.compact {
		width: 2.25rem;
		min-height: 2.25rem;
		padding: 0;
		justify-content: center;
	}

	.mic.on {
		color: #fff;
		background: #e11d48;
		border-color: #be123c;
		animation: pulse 1.2s ease-in-out infinite;
	}

	.mic:disabled {
		opacity: 0.6;
		cursor: progress;
	}

	svg {
		width: 0.9rem;
		height: 0.9rem;
		fill: currentColor;
	}

	.error {
		font-size: 0.8rem;
		color: #e11d48;
	}

	@keyframes pulse {
		50% {
			box-shadow: 0 0 0 6px rgb(225 29 72 / 0.25);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.mic.on {
			animation: none;
		}
	}
</style>
