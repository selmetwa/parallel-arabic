<script lang="ts">
	import { userXp, userLevel } from '$lib/store/xp-store';
	import { getProgressToNextLevel, LEVEL_TIERS } from '$lib/helpers/xp-levels';
	import { browser } from '$app/environment';

	interface Props {
		loggedIn: boolean;
		initialXp?: number;
		initialLevel?: number;
	}

	let { loggedIn, initialXp = 0, initialLevel = 1 }: Props = $props();

	// Use the higher of store value (earned mid-session) vs server value (loaded on navigation)
	// This ensures correct value on SSR/first render without waiting for $effect
	let displayXp = $derived($userXp > 0 ? $userXp : initialXp);
	let displayLevel = $derived($userXp > 0 ? $userLevel : initialLevel);
	let displayProgress = $derived(getProgressToNextLevel(displayXp));
	let displayTitle = $derived(LEVEL_TIERS.find((t) => t.level === displayLevel)?.title ?? 'Tourist');

	const STORAGE_KEY = 'xp_tooltip_dismissed';

	let dismissed = $state(browser ? localStorage.getItem(STORAGE_KEY) === 'true' : false);
	let tooltipOpen = $state(!dismissed);

	function toggleTooltip() {
		if (dismissed) return;
		tooltipOpen = !tooltipOpen;
	}

	function closeTooltip() {
		tooltipOpen = false;
	}

	function dismissForever() {
		if (browser) localStorage.setItem(STORAGE_KEY, 'true');
		dismissed = true;
		tooltipOpen = false;
	}

	const xpSources = [
		{ label: 'Sentence correct', xp: '+5 XP' },
		{ label: 'Game correct answer', xp: '+1 XP' },
		{ label: 'Review correct answer', xp: '+1 XP' },
		{ label: 'Story complete', xp: '+15 XP' },
		{ label: 'Lesson complete', xp: '+25 XP' },
		{ label: 'Finish review session', xp: '+10 XP' }
	];
</script>

{#if loggedIn}
	<div
		class="relative w-full lg:fixed lg:left-0 lg:right-0 lg:top-0 z-[60] flex h-8 items-center gap-3 border-b border-tile-600 bg-tile-300 px-4"
	>
		<!-- Level indicator — clickable to show XP tooltip -->
		<button
			type="button"
			onclick={toggleTooltip}
			class="shrink-0 text-xs font-semibold text-text-300 {!dismissed ? 'cursor-pointer underline decoration-dotted underline-offset-2 hover:text-text-200' : 'cursor-default'}"
			aria-label="How to earn XP"
		>
			Lv.{displayLevel} {displayTitle}
		</button>

		<div class="relative h-2.5 flex-1 overflow-hidden rounded-full bg-tile-500">
			<div
				class="h-full rounded-full bg-gradient-to-r from-[hsl(var(--hue,200),70%,45%)] to-[hsl(var(--hue,200),80%,60%)] transition-all duration-700"
				style="width: {displayProgress.percent}%"
			></div>
		</div>

		<span class="shrink-0 text-xs text-text-200">
			{#if displayProgress.nextLevel === null}
				Max Level
			{:else}
				{displayProgress.current}/{displayProgress.required} XP
			{/if}
		</span>
	</div>

	<!-- XP tooltip -->
	{#if tooltipOpen}
		<!-- Backdrop -->
		<button
			type="button"
			class="fixed inset-0 z-[59]"
			onclick={closeTooltip}
			aria-label="Close tooltip"
		></button>

		<div
			class="fixed left-4 top-9 z-[61] w-64 rounded-lg border border-tile-600 bg-tile-300 p-3 shadow-xl"
		>
			<div class="mb-2 flex items-center justify-between">
				<span class="text-xs font-semibold text-text-300">How to earn XP</span>
				<button
					type="button"
					onclick={closeTooltip}
					class="text-text-100 hover:text-text-300"
					aria-label="Close"
				>
					<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<ul class="space-y-1">
				{#each xpSources as source}
					<li class="flex items-center justify-between text-xs">
						<span class="text-text-200">{source.label}</span>
						<span class="font-semibold text-text-300">{source.xp}</span>
					</li>
				{/each}
			</ul>

			<div class="mt-3 border-t border-tile-600 pt-2">
				<button
					type="button"
					onclick={dismissForever}
					class="text-xs text-text-100 hover:text-text-200 hover:underline"
				>
					Don't show again
				</button>
			</div>
		</div>
	{/if}
{/if}
