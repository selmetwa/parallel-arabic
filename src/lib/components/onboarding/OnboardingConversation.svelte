<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import AudioLoading from '$lib/components/AudioLoading.svelte';
	import RecordButton from '$lib/components/RecordButton.svelte';
	import Similarity from '$lib/components/Similarity.svelte';
	import { onboardingScenario } from '$lib/constants/tutor-scenarios';
	import { userLevel, userXp } from '$lib/store/xp-store';
	import { calculateWordSimilarity } from '$lib/utils/pronunciation-similarity';
	import { trackEvent } from '$lib/analytics';
	import { requestAppReview } from '$lib/helpers/request-app-review';
	import type { Dialect } from '$lib/types';

	interface Props {
		dialect: Dialect;
		learningReason: string;
		/** `completed` is false when they skipped or there was no dialog to practise. */
		onFinish: (completed: boolean) => void;
	}

	let { dialect, learningReason, onFinish }: Props = $props();

	const PRONUNCIATION_THRESHOLD = 60;

	let scenario = $derived(onboardingScenario(learningReason, dialect));
	let dialog = $derived(scenario?.dialogs[dialect]);
	let lines = $derived(dialog?.lines ?? []);

	let phase = $state<'line' | 'finished'>('line');
	let xpAwarded = $state(0);
	let currentIndex = $state(0);
	let attempts = $state(0);
	let result = $state<{ similarity: number; passed: boolean } | null>(null);

	let recording = $state(false);
	let isProcessing = $state(false);
	let recordingSeconds = $state(0);
	let recordingError = $state<string | null>(null);
	let recordingTimer: ReturnType<typeof setInterval> | null = null;
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let discardRecording = false;

	let currentLine = $derived(lines[currentIndex] ?? null);

	$effect(() => {
		if (!dialog) {
			onFinish(false);
			return;
		}
		trackEvent('onboarding_conversation_started', { dialect, scenario: scenario?.id });
	});

	function formatRecordingTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = String(seconds % 60).padStart(2, '0');
		return `${m}:${s}`;
	}

	async function toggleRecording() {
		if (recording) {
			stopRecording();
		} else {
			await startRecording();
		}
	}

	async function retryRecording() {
		result = null;
		recordingError = null;
		await startRecording();
	}

	async function startRecording() {
		recordingError = null;
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream);
			audioChunks = [];

			mediaRecorder.ondataavailable = (event: BlobEvent) => {
				if (event.data.size > 0) audioChunks.push(event.data);
			};

			mediaRecorder.onstop = async () => {
				stream.getTracks().forEach((track) => track.stop());
				if (discardRecording) {
					discardRecording = false;
					audioChunks = [];
				} else {
					await processRecording();
				}
			};

			mediaRecorder.start();
			recording = true;
			recordingSeconds = 0;
			recordingTimer = setInterval(() => (recordingSeconds += 1), 1000);
		} catch (err) {
			console.error('Error starting recording:', err);
			recording = false;
			recordingError = "Couldn't access your microphone. Check browser permissions, or skip this practice.";
		}
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
			recording = false;
		}
		if (recordingTimer) {
			clearInterval(recordingTimer);
			recordingTimer = null;
		}
	}

	async function processRecording() {
		if (audioChunks.length === 0 || !currentLine) return;

		isProcessing = true;
		recordingError = null;

		try {
			const blob = new Blob(audioChunks, { type: 'audio/webm' });
			const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
			const formData = new FormData();
			formData.append('audio', file);
			formData.append('language', 'ar');
			formData.append('dialect', dialect);

			const response = await fetch('/api/speech-to-text', { method: 'POST', body: formData });
			if (!response.ok) throw new Error('Transcription failed');

			const data = await response.json();
			const transcript = data.text?.trim();
			if (!transcript) throw new Error('No text transcribed');

			const similarity = calculateWordSimilarity(transcript, currentLine.arabic);
			const passed = similarity >= PRONUNCIATION_THRESHOLD;
			attempts += 1;
			result = { similarity, passed };
			trackEvent('onboarding_conversation_attempt', { dialect, line_index: currentIndex, attempt: attempts, similarity, passed });
		} catch (err) {
			console.error('Error processing recording:', err);
			recordingError = "Couldn't hear that clearly. Try again, or skip this practice.";
		} finally {
			isProcessing = false;
		}
	}

	function advanceLine() {
		if (currentIndex < lines.length - 1) {
			currentIndex += 1;
			attempts = 0;
			result = null;
			recordingError = null;
		} else {
			finish();
		}
	}

	function skipPractice() {
		discardRecording = recording;
		stopRecording();
		trackEvent('onboarding_conversation_skipped', { dialect, scenario: scenario?.id, line_index: currentIndex });
		onFinish(false);
	}

	function finish() {
		trackEvent('onboarding_conversation_finished', { dialect, scenario: scenario?.id });
		phase = 'finished';
		awardFirstWin();
		// They just spoke their first Arabic: the best moment to ask for a rating.
		requestAppReview();
	}

	/** The first conversation counts: XP, and day one of their streak. */
	async function awardFirstWin() {
		try {
			const res = await fetch('/api/award-xp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventType: 'onboarding_conversation' })
			});
			const result = await res.json();
			if (result.success) {
				xpAwarded = result.xpAwarded;
				userXp.set(result.newTotalXp);
				if (result.leveledUp) userLevel.set(result.newLevel);
			}
		} catch {
			// XP is non-critical.
		}
	}
</script>

{#if dialog}
	<div class="max-w-xl mx-auto" in:fly={{ y: 20, duration: 400, easing: cubicOut }}>
		{#if phase === 'line' && currentLine}
			<div class="text-center mb-6">
				<p class="font-arabic font-bold text-2xl sm:text-3xl text-text-300/80 mb-2" dir="rtl" lang="ar">يلّا نبدأ</p>
				<h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-1.5 tracking-tight">Let's say your first words</h2>
				<p class="text-text-200 text-sm sm:text-base">
					A quick scripted conversation: {scenario?.title.toLowerCase()}.
				</p>
			</div>

			<div class="flex items-center justify-between mb-2">
				<span class="text-xs font-semibold text-text-200">
					Line {currentIndex + 1} of {lines.length}
				</span>
				<button
					type="button"
					onclick={skipPractice}
					class="text-xs text-text-200 hover:text-text-300 underline underline-offset-2"
				>
					Skip this practice →
				</button>
			</div>
			<div class="h-1.5 w-full bg-tile-500 rounded-full overflow-hidden mb-6">
				<div
					class="h-full bg-emerald-500 transition-all duration-300"
					style="width: {(currentIndex / lines.length) * 100}%"
				></div>
			</div>

			<div class="bg-tile-300 border-2 border-tile-500 rounded-2xl p-6 text-center">
				{#if currentLine.speaker === 'other'}
					<span class="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-700">
						🎤 Repeat as {dialog.otherRoleEnglish}
					</span>
				{:else}
					<span class="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700">
						🎤 Your turn
					</span>
				{/if}
				<p class="font-bold text-text-300 text-3xl mt-4 mb-2" dir="rtl" lang="ar">{currentLine.arabic}</p>
				<p class="text-lg text-text-200 mb-1">{currentLine.transliteration}</p>
				<p class="text-sm text-text-200 mb-5">{currentLine.english}</p>
				<div class="flex justify-center">
					<AudioButton text={currentLine.arabic} {dialect} bypassPaywall>Hear Audio</AudioButton>
				</div>
			</div>

			<div class="mt-6 flex flex-col items-center gap-4">
				{#if result}
					<div class="flex flex-col items-center gap-2">
						<Similarity score={result.similarity} />
						<p class="text-sm font-semibold {result.passed ? 'text-emerald-600' : 'text-orange-500'}">
							{result.passed ? 'Nice — that sounded great!' : 'Not quite — want to try again?'}
						</p>
					</div>
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={retryRecording}
							disabled={isProcessing}
							class="px-5 py-2.5 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed
								{result.passed ? 'bg-tile-500 text-text-300 hover:bg-tile-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}"
						>
							Try again
						</button>
						<button
							type="button"
							onclick={advanceLine}
							class="px-5 py-2.5 font-semibold rounded-xl transition-colors
								{result.passed ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-tile-500 text-text-300 hover:bg-tile-600'}"
						>
							{currentIndex < lines.length - 1 ? 'Next →' : 'Finish →'}
						</button>
					</div>
				{:else}
					<button
						type="button"
						onclick={toggleRecording}
						disabled={isProcessing}
						class="flex items-center justify-center gap-3 px-6 py-3 rounded-xl border-2 font-semibold text-text-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed {recording ? 'border-red-500 bg-red-500/15 shadow-lg' : 'border-tile-600 bg-tile-300 hover:bg-tile-500'}"
						aria-label={recording ? 'Stop recording' : 'Record your pronunciation'}
					>
						{#if recording}
							<span class="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
							<span class="tabular-nums text-sm">{formatRecordingTime(recordingSeconds)}</span>
							<span class="text-sm font-medium">Listening — tap when done</span>
						{:else if isProcessing}
							<AudioLoading />
							<span class="text-sm font-medium">Checking…</span>
						{:else}
							<RecordButton />
							<span>Now you try</span>
						{/if}
					</button>
					{#if recordingError}
						<p class="text-xs text-orange-500 text-center max-w-xs">{recordingError}</p>
					{/if}
				{/if}
			</div>
		{:else if phase === 'finished'}
			<div class="flex flex-col items-center text-center" in:fade={{ duration: 300 }}>
				<span class="text-5xl mb-4">🎉</span>
				<h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-2 tracking-tight">
					You just had your first conversation in Arabic!
				</h2>
				<p class="text-text-200 text-sm sm:text-base mb-5 max-w-sm">
					That's the hardest part done. Let's keep the momentum going.
				</p>
				<div class="mb-8 flex min-h-8 flex-wrap justify-center gap-2">
					{#if xpAwarded}
						<span class="win-pill" in:fly={{ y: 8, duration: 300 }}>+{xpAwarded} XP</span>
						<span class="win-pill" in:fly={{ y: 8, duration: 300, delay: 120 }}>🔥 Streak started</span>
					{/if}
				</div>
				<button
					type="button"
					onclick={() => onFinish(true)}
					class="px-8 py-3 bg-text-300 text-tile-300 rounded-full font-semibold hover:-translate-y-0.5 transition-all duration-300"
				>
					Continue
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.win-pill {
		border-radius: 100px;
		border: 2px solid #f59e0b;
		background: color-mix(in srgb, #f59e0b 14%, var(--tile3));
		padding: 0.3rem 0.85rem;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text1);
	}
</style>
