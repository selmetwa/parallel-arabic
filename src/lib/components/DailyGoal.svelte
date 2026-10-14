<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import {
		GOAL_KINDS,
		GOAL_KIND_ORDER,
		MAX_GOAL_ITEMS,
		type GoalItem,
		type GoalKind,
		type GoalProgressItem
	} from '$lib/constants/daily-goal';

	interface Props {
		/** Today's progress, or null when no goal is set. */
		progress: { items: GoalProgressItem[]; completed: number; allDone: boolean } | null;
	}

	let { progress }: Props = $props();

	let editing = $state(false);
	let saving = $state(false);
	let error = $state('');
	let draft = $state<GoalItem[]>([]);

	const RADIUS = 26;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

	const fraction = $derived.by(() => {
		if (!progress || progress.items.length === 0) return 0;
		const parts = progress.items.map((i) => i.done / i.target);
		return parts.reduce((a, b) => a + b, 0) / parts.length;
	});

	function startEditing() {
		draft = progress ? progress.items.map(({ kind, target }) => ({ kind, target })) : [];
		error = '';
		editing = true;
	}

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
			editing = false;
		} catch {
			error = 'Could not save your goal. Try again.';
		} finally {
			saving = false;
		}
	}
</script>

<div class="goal" class:is-done={progress?.allDone && !editing}>
	{#if editing}
		<h2 class="goal-title">Your daily goal</h2>
		<p class="goal-sub">Pick up to {MAX_GOAL_ITEMS}. You can change them any time.</p>

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
			<button type="button" class="link" onclick={() => (editing = false)}>Cancel</button>
			{#if progress}
				<button type="button" class="link remove" disabled={saving} onclick={() => save(null)}
					>Remove goal</button
				>
			{/if}
		</div>
	{:else if progress}
		<div class="head">
			<svg class="ring" viewBox="0 0 64 64" aria-hidden="true">
				<circle cx="32" cy="32" r={RADIUS} class="ring-track" />
				<circle
					cx="32"
					cy="32"
					r={RADIUS}
					class="ring-fill"
					stroke-dasharray={CIRCUMFERENCE}
					stroke-dashoffset={CIRCUMFERENCE * (1 - fraction)}
				/>
				<text x="32" y="37" text-anchor="middle" class="ring-text"
					>{progress.completed}/{progress.items.length}</text
				>
			</svg>
			<div class="min-w-0">
				<h2 class="goal-title">{progress.allDone ? 'Done for today' : 'Today’s goal'}</h2>
				<p class="goal-sub">
					{progress.allDone
						? 'You did everything you set out to. See you tomorrow.'
						: `${progress.completed} of ${progress.items.length} done`}
				</p>
			</div>
			<button type="button" class="link edit" onclick={startEditing}>Edit</button>
		</div>

		<ul class="items">
			{#each progress.items as item (item.kind)}
				<li>
					<a href={resolve(item.href as Pathname)} class="item" class:is-complete={item.complete}>
						<span class="dot" aria-hidden="true">{item.complete ? '✓' : ''}</span>
						<span class="item-label">{item.label}</span>
						{#if item.target > 1}
							<span class="count">{item.done}/{item.target}</span>
						{/if}
						{#if item.complete}<span class="sr-only">(done)</span>{/if}
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<h2 class="goal-title">Set a daily goal</h2>
		<p class="goal-sub">
			Pick up to three things to do each day: a game, a chat with your tutor, a few sentences out
			loud. We’ll track them here and remind you in the evening.
		</p>
		<div class="actions">
			<button type="button" class="cta" onclick={startEditing}>Choose my goal</button>
		</div>
	{/if}
</div>

<style>
	.goal {
		border-radius: 1.25rem;
		border: 2px solid var(--tile5);
		background: var(--tile3);
		padding: 1rem 1.1rem 1.1rem;
	}

	.goal.is-done {
		border-color: #22c55e;
	}

	.head {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		margin-bottom: 0.85rem;
	}

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

	.ring {
		width: 3.6rem;
		height: 3.6rem;
		flex-shrink: 0;
	}

	.ring-track,
	.ring-fill {
		fill: none;
		stroke-width: 6;
	}

	.ring-track {
		stroke: var(--tile5);
	}

	.ring-fill {
		stroke: #22c55e;
		stroke-linecap: round;
		transform: rotate(-90deg);
		transform-origin: 50% 50%;
		transition: stroke-dashoffset 0.6s ease;
	}

	.ring-text {
		font-size: 14px;
		font-weight: 700;
		fill: var(--text1);
	}

	.edit {
		margin-left: auto;
	}

	.items {
		display: grid;
		gap: 0.45rem;
	}

	.item {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		border-radius: 0.9rem;
		padding: 0.55rem 0.7rem;
		background: var(--tile2);
		font-weight: 600;
		color: var(--text1);
		text-decoration: none;
		transition: background 0.18s ease;
	}

	.item:hover {
		background: var(--tile4);
	}

	.item.is-complete .item-label {
		color: var(--text2);
		text-decoration: line-through;
	}

	.dot,
	.box {
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		border-radius: 50%;
		border: 2px solid var(--tile6);
		font-size: 0.75rem;
		font-weight: 700;
		color: #fff;
	}

	.is-complete .dot,
	.is-on .box {
		border-color: #15803d;
		background: #22c55e;
	}

	.box {
		border-radius: 0.4rem;
	}

	.item-label {
		min-width: 0;
		flex: 1;
	}

	.count {
		font-size: 0.82rem;
		font-variant-numeric: tabular-nums;
		color: var(--text2);
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

	@media (prefers-reduced-motion: reduce) {
		.ring-fill {
			transition: none;
		}
	}
</style>
