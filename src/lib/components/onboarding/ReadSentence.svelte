<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import type { ScenarioDialog, ScenarioLine } from '$lib/constants/tutor-scenarios';
	import type { Dialect } from '$lib/types';

	interface Props {
		dialog: ScenarioDialog;
		lines: ScenarioLine[];
		dialect: Dialect;
		onDone: () => void;
		onSkip: () => void;
	}

	let { dialog, lines, dialect, onDone, onSkip }: Props = $props();
</script>

<div class="mx-auto max-w-xl" in:fly={{ y: 20, duration: 400, easing: cubicOut }}>
	<div class="mb-6 text-center">
		<p class="font-arabic mb-2 text-2xl font-bold text-text-300/80 sm:text-3xl" dir="rtl" lang="ar">اقرأ</p>
		<h2 class="mb-1.5 text-2xl font-bold tracking-tight text-text-300 sm:text-3xl">Read your first line</h2>
		<p class="text-sm text-text-200 sm:text-base">
			Every story shows you the Arabic, how to say it, and what it means, word for word.
		</p>
	</div>

	<div class="flex flex-col gap-3">
		{#each lines as line, i (i)}
			<div class="rounded-2xl border-2 border-tile-500 bg-tile-300 p-5 text-center">
				<span
					class="rounded-full px-2 py-0.5 text-xs font-bold {line.speaker === 'student'
						? 'bg-emerald-500/15 text-emerald-700'
						: 'bg-sky-500/15 text-sky-700'}"
				>
					{line.speaker === 'student' ? 'You' : dialog.otherRoleEnglish}
				</span>
				<p class="font-arabic mt-3 mb-2 text-3xl font-bold text-text-300" dir="rtl" lang="ar">
					{line.arabic}
				</p>
				<p class="mb-1 text-lg text-text-200">{line.transliteration}</p>
				<p class="text-sm text-text-300">{line.english}</p>
				<div class="mt-4 flex justify-center">
					<AudioButton text={line.arabic} {dialect} bypassPaywall>Hear Audio</AudioButton>
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-6 flex flex-col items-center gap-4">
		<button
			type="button"
			onclick={onDone}
			class="rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
		>
			Say it yourself →
		</button>
		<button
			type="button"
			onclick={onSkip}
			class="text-xs text-text-200/80 underline underline-offset-2 hover:text-text-300"
		>
			Skip for now
		</button>
	</div>
</div>
