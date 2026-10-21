<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import SentenceScramble from '$lib/components/games/SentenceScramble.svelte';
	import type { ScrambleSentence } from '$lib/games/sentence-scramble';
	import type { GameDialect } from '$lib/games/themes';

	interface Props {
		sentences: ScrambleSentence[];
		dialect: GameDialect;
		onDone: () => void;
		onSkip: () => void;
	}

	let { sentences, dialect, onDone, onSkip }: Props = $props();
</script>

<div class="mx-auto max-w-xl" in:fly={{ y: 20, duration: 400, easing: cubicOut }}>
	<div class="mb-6 text-center">
		<p class="font-arabic mb-2 text-2xl font-bold text-text-300/80 sm:text-3xl" dir="rtl" lang="ar">العب</p>
		<h2 class="mb-1.5 text-2xl font-bold tracking-tight text-text-300 sm:text-3xl">Build it yourself</h2>
		<p class="text-sm text-text-200 sm:text-base">
			These are the lines you just said. Tap the words back into order.
		</p>
	</div>

	<SentenceScramble
		{sentences}
		{dialect}
		signedIn
		accent="#0ea5e9"
		deep="#0369a1"
		onFinish={onDone}
	/>

	<div class="mt-6 flex justify-center">
		<button
			type="button"
			onclick={onSkip}
			class="text-xs text-text-200/80 underline underline-offset-2 hover:text-text-300"
		>
			Skip for now
		</button>
	</div>
</div>
