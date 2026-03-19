<script lang="ts">
	import SentenceBlock from '$lib/components/dialect-shared/sentences/SentenceBlock.svelte';
	import { userXp, userLevel } from '$lib/store/xp-store';
	import { showXpToast } from '$lib/helpers/toast-helpers';
	import { LEVEL_TIERS } from '$lib/helpers/xp-levels';
	import type { Dialect } from '$lib/types/index';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const challenge = data.challenge as {
		id: string;
		challenge_type: string;
		dialect: string;
		sentences: { arabic: string; english: string; transliteration: string }[] | null;
		completed: boolean;
		bonus_xp: number;
	};

	const sentences = challenge.sentences ?? [];
	const dialect = challenge.dialect as Dialect;

	let currentIndex = $state(0);
	let isCompleted = $state(challenge.completed);
	let isSubmitting = $state(false);
	let allSentencesDone = $state(challenge.completed || sentences.length === 0);

	function advanceSentence() {
		if (currentIndex < sentences.length - 1) {
			currentIndex++;
		} else {
			allSentencesDone = true;
		}
	}

	async function markComplete() {
		if (isCompleted || isSubmitting) return;
		isSubmitting = true;

		try {
			const res = await fetch(`/api/daily-challenge/${challenge.id}/complete`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			const result = await res.json();

			if (result.success) {
				isCompleted = true;
				userXp.set(result.newTotalXp);
				if (result.leveledUp) userLevel.set(result.newLevel);
				const title = LEVEL_TIERS.find((t) => t.level === result.newLevel)?.title;
				showXpToast(result.xpAwarded, result.leveledUp, result.newLevel, title);
			} else if (result.alreadyCompleted) {
				isCompleted = true;
			}
		} catch {
			// non-critical
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Daily Challenge</title>
</svelte:head>

<section class="px-4 mt-6 sm:px-8 max-w-3xl mx-auto pb-16">
	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-center gap-3 mb-2">
			<span class="text-2xl">⭐</span>
			<h1 class="text-2xl font-bold text-text-100">Daily Challenge</h1>
			<span class="ml-auto text-sm font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
				+{challenge.bonus_xp + 15} XP
			</span>
		</div>
		<p class="text-text-300 text-sm">
			Complete all 3 sentences to earn your bonus XP.
		</p>
	</div>

	{#if isCompleted}
		<!-- Completed state -->
		<div class="text-center py-12">
			<div class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-100 border border-green-300 text-green-800 font-semibold">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				Challenge Complete!
			</div>
		</div>
	{:else if allSentencesDone}
		<!-- All sentences done — show complete button -->
		<div class="text-center py-8">
			<p class="text-text-200 mb-6 text-lg">All sentences completed! Claim your bonus XP.</p>
			<button
				onclick={markComplete}
				disabled={isSubmitting}
				class="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
			>
				{isSubmitting ? 'Completing...' : 'Claim +10 Bonus XP'}
			</button>
		</div>
	{:else}
		<!-- Progress indicator -->
		<div class="flex items-center gap-2 mb-4">
			{#each sentences as _, i}
				<div class="h-2 flex-1 rounded-full transition-colors duration-300 {i < currentIndex ? 'bg-amber-400' : i === currentIndex ? 'bg-amber-500' : 'bg-tile-500'}"></div>
			{/each}
			<span class="text-xs text-text-300 shrink-0 ml-1">{currentIndex + 1} / {sentences.length}</span>
		</div>

		<!-- Current sentence -->
		{#key currentIndex}
			<SentenceBlock
				sentence={sentences[currentIndex]}
				resetSentences={advanceSentence}
				{dialect}
			/>
		{/key}
	{/if}
</section>
