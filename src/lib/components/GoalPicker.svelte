<script lang="ts">
	import { untrack } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import {
		GOAL_KINDS,
		GOAL_KIND_ORDER,
		MAX_GOAL_ITEMS,
		type GoalItem,
		type GoalKind
	} from '$lib/constants/daily-goal';

	interface Props {
		/** The goal they have now, or [] when none is set. */
		initial: GoalItem[];
		onClose: () => void;
	}

	let { initial, onClose }: Props = $props();

	let saving = $state(false);
	let error = $state('');
	// A copy taken when the picker opens; edits stay local until saved.
	let draft = $state<GoalItem[]>(
		untrack(() => initial.map(({ kind, target }) => ({ kind, target })))
	);

	function picked(kind: GoalKind) {
		return draft.find((i) => i.kind === kind);
	}

	function toggle(kind: GoalKind) {
		if (picked(kind)) draft = draft.filter((i) => i.kind !== kind);
		else if (draft.length < MAX_GOAL_ITEMS)
			draft = [...draft, { kind, target: GOAL_KINDS[kind].amounts[0] }];
	}

	function setAmount(kind: GoalKind, target: number) {
		draft = draft.map((i) => (i.kind === kind ? { ...i, target } : i));
	}

	async function save(goal: GoalItem[] | null) {
		saving = true;
		error = '';
		try {
			const res = await fetch('/api/daily-goal', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ goal })
			});
			if (!res.ok) throw new Error();
			await invalidateAll();
			onClose();
		} catch {
			error = 'Could not save your goal. Try again.';
		} finally {
			saving = false;
		}
	}
</script>

<h2 class="goal-title">Your daily goal</h2>
<p class="goal-sub">
	Pick up to {MAX_GOAL_ITEMS}. They become today’s path. You can change them any time.
</p>

<ul class="options">
	{#each GOAL_KIND_ORDER as kind (kind)}
		{@const info = GOAL_KINDS[kind]}
		{@const item = picked(kind)}
		<li class="option" class:is-on={!!item}>
			<button
				type="button"
				class="option-toggle"
				aria-pressed={!!item}
				disabled={!item && draft.length >= MAX_GOAL_ITEMS}
				onclick={() => toggle(kind)}
			>
				<span class="box" aria-hidden="true">{item ? '✓' : ''}</span>
				{info.name}
			</button>
			{#if item && info.amounts.length > 1}
				<div class="amounts" role="group" aria-label="How many {info.unit}">
					{#each info.amounts as amount (amount)}
						<button
							type="button"
							class="amount"
							class:is-on={item.target === amount}
							aria-pressed={item.target === amount}
							onclick={() => setAmount(kind, amount)}>{amount}</button
						>
					{/each}
					<span class="unit">{info.unit}</span>
				</div>
			{/if}
		</li>
	{/each}
</ul>

{#if error}<p class="error" role="alert">{error}</p>{/if}

<div class="actions">
	<button
		type="button"
		class="cta"
		disabled={draft.length === 0 || saving}
		onclick={() => save(draft)}
	>
		{saving ? 'Saving…' : 'Save goal'}
	</button>
	<button type="button" class="link" onclick={onClose}>Cancel</button>
	{#if initial.length > 0}
		<button type="button" class="link remove" disabled={saving} onclick={() => save(null)}
			>Remove goal</button
		>
	{/if}
</div>

<style>
	.goal-title {
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text1);
	}

	.goal-sub {
		margin-top: 0.15rem;
		font-size: 0.88rem;
		color: var(--text2);
	}

	.box {
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		border-radius: 0.4rem;
		border: 2px solid var(--tile6);
		font-size: 0.75rem;
		font-weight: 700;
		color: #fff;
	}

	.is-on .box {
		border-color: #15803d;
		background: #22c55e;
	}

	.options {
		display: grid;
		gap: 0.45rem;
		margin-top: 0.9rem;
	}

	.option {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 0.8rem;
		border-radius: 0.9rem;
		border: 2px solid transparent;
		padding: 0.5rem 0.7rem;
		background: var(--tile2);
	}

	.option.is-on {
		border-color: #22c55e;
	}

	.option-toggle {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		font-weight: 600;
		color: var(--text1);
		cursor: pointer;
	}

	.option-toggle:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.amounts {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.amount {
		min-width: 2.4rem;
		min-height: 2.2rem;
		border-radius: 100px;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text2);
		cursor: pointer;
	}

	.amount.is-on {
		border-color: #22c55e;
		color: var(--text1);
		background: color-mix(in srgb, #22c55e 16%, var(--tile3));
	}

	.unit {
		font-size: 0.8rem;
		color: var(--text2);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.9rem;
		margin-top: 1rem;
	}

	.cta {
		border-radius: 100px;
		padding: 0.65rem 1.5rem;
		font-weight: 600;
		color: #fff;
		background: #22c55e;
		box-shadow: 0 4px 0 #15803d;
		cursor: pointer;
	}

	.cta:active:not(:disabled) {
		transform: translateY(4px);
		box-shadow: 0 0 0 #15803d;
	}

	.cta:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	.link {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text2);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.link:hover {
		color: var(--text1);
	}

	.remove {
		margin-left: auto;
	}

	.error {
		margin-top: 0.75rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #dc2626;
	}
</style>
