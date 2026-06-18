<script lang="ts">
	import cn from 'classnames';
	import levenshtein from 'fast-levenshtein';
	import { type Dialect } from '$lib/types/index';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import type { PracticeWord } from './practice-data';

	type Props = { words: PracticeWord[]; dialect?: Dialect };
	let { words, dialect = 'egyptian-arabic' }: Props = $props();

	let index = $state(0);
	let isRecording = $state(false);
	let isTranscribing = $state(false);
	let transcribedText = $state('');
	let similarity = $state(0);
	let mediaRecorder = $state<MediaRecorder | null>(null);
	let audioChunks = $state<Blob[]>([]);

	const prompt = $derived(words[index]);

	function calculateSimilarity(transcribed: string, targetText: string): number {
		const clean = (t: string) => t.replace(/\./g, '');
		const a = clean(transcribed);
		const b = clean(targetText);
		if (a === b) return 100;
		if (!a || !b) return 0;
		const distance = levenshtein.get(b, a);
		const maxLen = Math.max(a.length, b.length);
		return (1 - distance / maxLen) * 100;
	}

	function getFeedback(score: number): { text: string; emoji: string; color: string } {
		if (score >= 90) return { text: 'Excellent!', emoji: '🎉', color: 'text-green-700' };
		if (score >= 75) return { text: 'Great job!', emoji: '👏', color: 'text-emerald-500' };
		if (score >= 60) return { text: 'Good effort!', emoji: '👍', color: 'text-yellow-500' };
		if (score >= 40) return { text: 'Keep practicing!', emoji: '💪', color: 'text-orange-500' };
		return { text: 'Try again!', emoji: '🔄', color: 'text-red-500' };
	}

	function reset() {
		transcribedText = '';
		similarity = 0;
		isRecording = false;
		isTranscribing = false;
	}

	function next() {
		index = (index + 1) % words.length;
		reset();
	}

	async function processRecording() {
		isTranscribing = true;
		try {
			const blob = new Blob(audioChunks, { type: 'audio/webm' });
			const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
			const formData = new FormData();
			formData.append('audio', file);
			formData.append('dialect', dialect);
			formData.append('language', 'ar');

			const res = await fetch('/api/speech-to-text', { method: 'POST', body: formData });
			const data = await res.json();
			transcribedText = data.text || '';
			similarity = calculateSimilarity(transcribedText, prompt.arabic);
		} catch {
			transcribedText = '';
			similarity = 0;
		} finally {
			isTranscribing = false;
		}
	}

	async function toggleRecording() {
		if (isRecording) {
			mediaRecorder?.stop();
			isRecording = false;
			return;
		}
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			audioChunks = [];
			const recorder = new MediaRecorder(stream);
			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) audioChunks = [...audioChunks, e.data];
			};
			recorder.onstop = async () => {
				stream.getTracks().forEach((t) => t.stop());
				await processRecording();
			};
			recorder.start();
			mediaRecorder = recorder;
			isRecording = true;
		} catch {
			console.error('Microphone access denied');
		}
	}
</script>

<div class="space-y-4">
	<!-- Prompt -->
	<div class="space-y-3 rounded-2xl border border-tile-500 bg-tile-400 p-5 shadow-sm">
		<p class="text-base text-text-200">{prompt.meaning}</p>
		<div class="flex items-center justify-between gap-3">
			<p
				class="font-arabic flex-1 text-right text-2xl font-bold text-text-300 sm:text-3xl"
				dir="rtl"
			>
				{prompt.arabic}
			</p>
			<AudioButton text={prompt.arabic} {dialect} />
		</div>
		<p class="text-sm italic text-text-200">{prompt.franco}</p>
	</div>

	<!-- Record button -->
	<div class="flex justify-center">
		<button
			onclick={toggleRecording}
			disabled={isTranscribing}
			class={cn(
				'group flex flex-col items-center gap-3 rounded-3xl border-4 p-6 transition-all duration-300 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
				isRecording
					? 'border-red-500 bg-red-500/20 shadow-lg shadow-red-500/30'
					: 'bg-tile-300/50 hover:bg-tile-400/50 border-tile-500 hover:border-tile-600'
			)}
		>
			<div
				class={cn(
					'flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300',
					isRecording ? 'animate-pulse bg-red-500' : 'bg-gradient-to-br from-red-400 to-red-600'
				)}
			>
				{#if isRecording}
					<div class="h-7 w-7 rounded-sm bg-white" aria-hidden="true"></div>
				{:else}
					<svg
						class="h-9 w-9 text-white"
						fill="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
						/>
						<path
							d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
						/>
					</svg>
				{/if}
			</div>
			<span class={cn('font-bold', isRecording ? 'text-red-500' : 'text-text-300')}>
				{isTranscribing ? 'Processing...' : isRecording ? 'Tap to Stop' : 'Tap to Speak'}
			</span>
		</button>
	</div>

	{#if isTranscribing}
		<div class="flex flex-col items-center gap-3 py-4" role="status" aria-live="polite">
			<div
				class="h-10 w-10 animate-spin rounded-full border-4 border-tile-500 border-t-tile-700"
				aria-hidden="true"
			></div>
			<p class="text-sm text-text-200">Analyzing your speech...</p>
		</div>
	{/if}

	{#if !isTranscribing && transcribedText}
		{@const fb = getFeedback(similarity)}
		<div class="border-tile-500/50 bg-tile-300/50 space-y-4 rounded-2xl border-2 p-5">
			<div class="flex items-center justify-center gap-4">
				<span class="text-4xl">{fb.emoji}</span>
				<div class="text-center">
					<p class={cn('text-4xl font-bold', fb.color)}>{Math.round(similarity)}%</p>
					<p class={cn('text-base font-semibold', fb.color)}>{fb.text}</p>
				</div>
			</div>
			<div class="border-tile-500/30 border-t pt-3">
				<p class="mb-1 text-center text-xs font-bold uppercase tracking-wider text-text-200">
					You said:
				</p>
				<p class="font-arabic text-center text-xl text-text-300" dir="rtl">{transcribedText}</p>
			</div>
		</div>
	{/if}

	<div class="flex justify-center">
		<button
			onclick={next}
			class="rounded-full border border-tile-500 bg-tile-400 px-6 py-2.5 text-sm font-semibold text-text-300 transition-colors hover:bg-tile-500 active:scale-95"
		>
			{transcribedText ? 'Next →' : 'Skip →'}
		</button>
	</div>
</div>
