<script lang="ts">
	import { onMount } from 'svelte';
	import cn from 'classnames';
	import type { PracticeLetter } from './practice-data';

	type Props = { letters: PracticeLetter[] };
	let { letters }: Props = $props();

	let target = $state<PracticeLetter | undefined>(undefined);
	let options = $state<PracticeLetter[]>([]);
	let selectedKey = $state<string | null>(null);
	let score = $state(0);
	let answered = $state(0);

	const isAnswered = $derived(selectedKey !== null);

	function pickNew(autoplay = true) {
		const next = letters[Math.floor(Math.random() * letters.length)];
		const distractors = letters
			.filter((l) => l.key !== next.key)
			.sort(() => Math.random() - 0.5)
			.slice(0, 3);
		options = [next, ...distractors].sort(() => Math.random() - 0.5);
		target = next;
		selectedKey = null;
		if (autoplay) playTarget();
	}

	function playTarget() {
		if (!target) return;
		new Audio(`/letters/audios/${target.key}.mp3`).play();
	}

	function choose(option: PracticeLetter) {
		if (isAnswered || !target) return;
		selectedKey = option.key;
		answered += 1;
		if (option.key === target.key) score += 1;
	}

	// Set up the first round without auto-playing (browsers block autoplay on load).
	onMount(() => pickNew(false));
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between gap-3">
		<button
			onclick={playTarget}
			class="flex items-center gap-2 rounded-full border border-tile-600 bg-tile-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-tile-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300 active:scale-95"
		>
			<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4.03v8.05A4.5 4.5 0 0016.5 12z" />
			</svg>
			<span>Play sound</span>
		</button>
		<span class="text-sm text-text-200">Score: {score}/{answered}</span>
	</div>

	<p class="text-sm text-text-200">Which letter did you hear?</p>

	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		{#each options as option (option.key)}
			{@const correct = option.key === target?.key}
			<button
				onclick={() => choose(option)}
				disabled={isAnswered}
				class={cn(
					'flex aspect-square items-center justify-center rounded-xl border text-5xl text-text-300 shadow-sm transition-all duration-200',
					isAnswered && correct && 'border-green-600 bg-green-500/15',
					isAnswered && !correct && selectedKey === option.key && 'border-red-500 bg-red-500/15',
					isAnswered &&
						!correct &&
						selectedKey !== option.key &&
						'border-tile-500 bg-tile-200 opacity-50',
					!isAnswered &&
						'cursor-pointer border-tile-500 bg-tile-200 hover:-translate-y-1 hover:border-text-200 hover:bg-tile-400 hover:shadow-md active:scale-95'
				)}
			>
				{option.isolated}
			</button>
		{/each}
	</div>

	{#if isAnswered}
		<div
			class="flex items-center justify-between gap-3 rounded-lg border border-tile-500 bg-tile-400 p-3"
		>
			<p class="text-sm text-text-200">
				{#if selectedKey === target?.key}
					<span class="font-semibold text-green-700">Correct!</span>
				{:else}
					<span class="font-semibold text-red-500">Not quite.</span>
				{/if}
				That was <span class="font-semibold text-text-300">{target?.isolated}</span> — {target?.letterName}.
			</p>
			<button
				onclick={() => pickNew()}
				class="flex-none rounded-full border border-tile-500 bg-tile-300 px-4 py-2 text-sm font-semibold text-text-300 transition-colors hover:bg-tile-500 active:scale-95"
			>
				Next →
			</button>
		</div>
	{/if}
</div>
