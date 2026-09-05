<script lang="ts">
	import InlineAudioButton from '$lib/components/InlineAudioButton.svelte';
	import RecordButton from '$lib/components/RecordButton.svelte';
	import AudioLoading from '$lib/components/AudioLoading.svelte';
	import Similarity from '$lib/components/Similarity.svelte';
	import {
		PASS_THRESHOLD,
		describeRecordingError,
		scorePronunciation,
		transcribe
	} from '$lib/utils/pronunciation';
	import type { PracticeWord } from '$lib/types/words';
	import type { Dialect } from '$lib/types/index';

	interface Props {
		word: PracticeWord;
		dialect: Dialect;
		onResult: (correct: boolean) => void;
		/** The speaking allowance ran out; the round should stop asking. */
		onUnavailable: () => void;
	}

	let { word, dialect, onResult, onUnavailable }: Props = $props();

	/** Two goes, then the answer and move on. Never a dead end. */
	const MAX_ATTEMPTS = 2;

	let recording = $state(false);
	let processing = $state(false);
	let attempts = $state(0);
	let spokenText = $state('');
	let score = $state<number | null>(null);
	let errorMessage = $state('');

	let mediaRecorder: MediaRecorder | null = null;
	let activeStream: MediaStream | null = null;
	let audioChunks: Blob[] = [];

	const passed = $derived(score !== null && score >= PASS_THRESHOLD.word);
	const outOfAttempts = $derived(attempts >= MAX_ATTEMPTS);

	async function startRecording() {
		errorMessage = '';
		spokenText = '';
		score = null;

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			activeStream = stream;
			audioChunks = [];

			mediaRecorder = new MediaRecorder(stream);
			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) audioChunks.push(e.data);
			};
			mediaRecorder.onstop = async () => {
				activeStream?.getTracks().forEach((t) => t.stop());
				activeStream = null;

				const blob = new Blob(audioChunks, { type: 'audio/webm' });
				audioChunks = [];

				if (blob.size < 1000) {
					errorMessage = 'That recording was too short. Try again.';
					return;
				}

				await submit(blob);
			};

			mediaRecorder.start();
			recording = true;
		} catch (e) {
			recording = false;
			errorMessage = describeRecordingError(e);
			// A denied mic means every later speaking slot would fail the same way.
			if (e instanceof DOMException && e.name === 'NotAllowedError') onUnavailable();
		}
	}

	function stopRecording() {
		if (mediaRecorder && recording) {
			mediaRecorder.stop();
			recording = false;
		}
	}

	async function submit(blob: Blob) {
		processing = true;
		try {
			spokenText = await transcribe(blob, dialect);
			score = scorePronunciation(word.arabic, spokenText);
			attempts += 1;
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Could not hear that. Try again.';
			errorMessage = message;
			// The endpoint refuses once the free speaking allowance is gone.
			if (/Subscription required|Too many requests/i.test(message)) onUnavailable();
		} finally {
			processing = false;
		}
	}

	function retry() {
		spokenText = '';
		score = null;
		errorMessage = '';
	}
</script>

<div class="flex flex-col items-center gap-5">
	<div class="text-center">
		<p class="mb-2 text-xs text-text-200">Say this out loud</p>
		<p class="mb-1 text-lg text-text-200">{word.english}</p>
		<div class="flex items-center justify-center gap-3">
			<p class="text-4xl font-bold text-text-300" dir="rtl">{word.arabic}</p>
			<InlineAudioButton text={word.arabic} {dialect} audioUrl={word.audioUrl ?? undefined} />
		</div>
		<p class="mt-1 text-sm italic text-text-200">{word.transliteration}</p>
	</div>

	{#if score === null}
		<div class="flex flex-col items-center gap-3">
			{#if processing}
				<AudioLoading />
				<p class="text-text-200">Listening back…</p>
			{:else if recording}
				<button type="button" onclick={stopRecording} aria-label="Stop recording">
					<AudioLoading />
				</button>
				<p class="text-text-200">Recording — tap to stop</p>
			{:else}
				<button type="button" onclick={startRecording} aria-label="Start recording">
					<RecordButton />
				</button>
				<p class="text-text-200">Tap the microphone and say it</p>
			{/if}
		</div>
	{:else}
		<div class="flex flex-col items-center gap-3">
			<Similarity {score} />
			<p class="text-lg font-semibold {passed ? 'text-green-700' : 'text-text-300'}">
				{passed ? 'That sounded right' : 'Not quite'}
			</p>
			{#if spokenText}
				<p class="text-text-200">
					We heard <span class="font-semibold text-text-300" dir="rtl">{spokenText}</span>
				</p>
			{/if}
		</div>
	{/if}

	{#if errorMessage}
		<p class="text-center text-sm text-red-600">{errorMessage}</p>
	{/if}

	<div class="flex flex-wrap justify-center gap-3">
		{#if score !== null && !passed && !outOfAttempts}
			<button
				type="button"
				onclick={retry}
				class="rounded-lg border border-tile-600 bg-tile-500 px-5 py-2.5 font-semibold text-text-300 transition-colors hover:bg-tile-600"
			>
				Try again
			</button>
		{/if}
		{#if score !== null}
			<button
				type="button"
				onclick={() => onResult(passed)}
				class="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700"
			>
				Continue
			</button>
		{:else if !recording && !processing}
			<button
				type="button"
				onclick={() => onResult(false)}
				class="text-sm text-text-200 underline hover:text-text-300"
			>
				Skip this one
			</button>
		{/if}
	</div>
</div>
