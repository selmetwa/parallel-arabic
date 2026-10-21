<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { GOAL_KINDS, type DailyGoal } from '$lib/constants/daily-goal';

	interface Props {
		onDone: (goal: DailyGoal) => void;
		onSkip: () => void;
	}

	let { onDone, onSkip }: Props = $props();

	const PRESETS: { name: string; goal: DailyGoal }[] = [
		{ name: 'Light', goal: [{ kind: 'review', target: 10 }] },
		{
			name: 'Steady',
			goal: [
				{ kind: 'review', target: 10 },
				{ kind: 'game', target: 1 }
			]
		},
		{
			name: 'Serious',
			goal: [
				{ kind: 'review', target: 20 },
				{ kind: 'game', target: 1 },
				{ kind: 'lesson', target: 1 }
			]
		}
	];

	let saving = $state<string | null>(null);
	let error = $state('');

	async function pick(name: string, goal: DailyGoal) {
		if (saving) return;
		saving = name;
		error = '';
		try {
			const res = await fetch('/api/daily-goal', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ goal })
			});
			if (!res.ok) throw new Error('Failed to save goal');
			onDone(goal);
		} catch {
			error = "Couldn't save that. Try again, or skip for now.";
			saving = null;
		}
	}
</script>

<div class="mx-auto max-w-md" in:fly={{ y: 20, duration: 400, easing: cubicOut }}>
	<div class="mb-6 text-center">
		<p class="font-arabic mb-2 text-2xl font-bold text-text-300/80 sm:text-3xl" dir="rtl" lang="ar">كل يوم</p>
		<h2 class="mb-1.5 text-2xl font-bold tracking-tight text-text-300 sm:text-3xl">Set a daily goal</h2>
		<p class="text-sm text-text-200 sm:text-base">
			A little every day beats a lot once a week. You can change it any time.
		</p>
	</div>

	<div class="flex flex-col gap-3">
		{#each PRESETS as preset (preset.name)}
			<button
				type="button"
				onclick={() => pick(preset.name, preset.goal)}
				disabled={!!saving}
				class="rounded-2xl border-2 border-tile-500 bg-tile-300 p-4 text-left transition-colors hover:border-emerald-500 hover:bg-tile-400 disabled:cursor-not-allowed {saving ===
				preset.name
					? 'border-emerald-500'
					: ''} {saving && saving !== preset.name ? 'opacity-50' : ''}"
			>
				<span class="block font-semibold text-text-300">{preset.name}</span>
				<span class="mt-1 block text-sm text-text-200">
					{preset.goal.map((item) => GOAL_KINDS[item.kind].label(item.target)).join(' · ')}
				</span>
			</button>
		{/each}
	</div>

	{#if error}
		<p class="mt-3 text-center text-xs text-orange-500">{error}</p>
	{/if}

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
