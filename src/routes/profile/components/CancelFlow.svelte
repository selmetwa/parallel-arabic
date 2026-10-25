<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import Button from '$lib/components/Button.svelte';
	import { trackEvent } from '$lib/analytics';
	import {
		CANCEL_REASONS,
		DETAIL_MAX,
		PAUSE_MONTHS,
		canPause,
		pauseResumesAt,
		type CancelReason,
		type PauseMonths
	} from '$lib/subscription/cancel-flow';

	interface Props {
		details: {
			status: string | null;
			interval?: string | null;
			cancelAtPeriodEnd: boolean;
			currentPeriodEnd: number | null;
			pausedUntil?: number | null;
			paidThrough?: number | null;
		};
		savedWords: number;
		streak: number;
		formatDate: (timestamp: number | null) => string;
		/** Called after a cancel or pause goes through, with the message to show. */
		onDone: (message: string) => void;
		onClose: () => void;
	}

	let { details, savedWords, streak, formatDate, onDone, onClose }: Props = $props();

	type Step = 'reason' | 'offer' | 'confirm';
	let step = $state<Step>('reason');
	let reason = $state<CancelReason | null>(null);
	let detail = $state('');
	let months = $state<PauseMonths>(1);
	let busy = $state(false);
	let error = $state<string | null>(null);

	const isTrialing = $derived(details.status === 'trialing');
	const pausable = $derived(canPause(details));
	const now = Math.floor(Date.now() / 1000);
	// When Premium stops if they go ahead: the paid period, or now for a pause that's run out.
	const accessEnd = $derived(
		details.pausedUntil ? details.paidThrough ?? null : details.currentPeriodEnd
	);
	const endsNow = $derived(!!details.pausedUntil && (!accessEnd || accessEnd <= now));
	const resumesAt = $derived(
		details.currentPeriodEnd ? pauseResumesAt(details.currentPeriodEnd, months) : null
	);

	const progress = $derived.by(() => {
		const parts = [];
		if (savedWords > 0) parts.push(`saved ${savedWords.toLocaleString('en-US')} words`);
		if (streak > 1) parts.push(`kept a ${streak}-day streak`);
		return parts.length ? `You've ${parts.join(' and ')}.` : '';
	});

	onMount(() => trackEvent('cancel_flow_opened', { status: details.status }));

	function chooseReason() {
		if (!reason) return;
		trackEvent('cancel_reason_chosen', { reason: reason.id });
		step = reason.pause && pausable ? 'offer' : 'confirm';
	}

	function keep() {
		trackEvent('cancel_kept', { reason: reason?.id ?? null, step });
		onClose();
	}

	async function post(url: string, body: object) {
		busy = true;
		error = null;
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
			return false;
		} finally {
			busy = false;
		}
	}

	async function pause() {
		if (!(await post('/api/subscription/pause', { months }))) return;
		trackEvent('cancel_paused', { reason: reason?.id ?? null, months });
		onDone(
			`Paused. You keep Premium until ${formatDate(details.currentPeriodEnd)}, and billing restarts ${formatDate(resumesAt)}.`
		);
	}

	async function cancel() {
		if (!(await post('/api/cancel-subscription', { reason: reason?.id, detail }))) return;
		trackEvent('cancel_completed', { reason: reason?.id ?? null, from: step });
		onDone(
			endsNow
				? 'Your subscription has been cancelled.'
				: `Your subscription has been cancelled. You keep Premium until ${formatDate(accessEnd)}.`
		);
	}
</script>

<div class="mt-4 rounded-xl border-2 border-tile-600 bg-tile-300 p-4 space-y-4" transition:slide={{ duration: 150 }}>
	{#if step === 'reason'}
		<fieldset class="space-y-2">
			<legend class="mb-2 text-sm font-semibold text-text-300">Before you go, what's the main reason?</legend>
			{#each CANCEL_REASONS as option (option.id)}
				<label
					class="flex cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2 text-sm text-text-300 transition-colors {reason?.id ===
					option.id
						? 'border-brand bg-tile-400'
						: 'border-tile-500 hover:border-tile-600'}"
				>
					<input type="radio" name="cancel-reason" value={option.id} onchange={() => (reason = option)} />
					{option.label}
				</label>
			{/each}
		</fieldset>

		{#if reason?.askDetail}
			<label class="block text-sm text-text-200">
				{reason.askDetail} <span class="text-text-200/70">(optional)</span>
				<textarea
					bind:value={detail}
					maxlength={DETAIL_MAX}
					rows="2"
					class="mt-1 w-full rounded-lg border-2 border-tile-600 bg-tile-200 px-3 py-2 text-text-300"
				></textarea>
			</label>
		{/if}

		<div class="flex gap-2">
			<Button type="button" variant="danger" onClick={chooseReason} disabled={!reason} className="flex-1 text-sm">
				Continue
			</Button>
			<Button type="button" variant="secondary" onClick={keep} className="flex-1 text-sm">
				Keep my subscription
			</Button>
		</div>
	{:else if step === 'offer'}
		<div class="space-y-1">
			<p class="font-semibold text-text-300">Pause instead of cancelling?</p>
			{#if reason?.pitch}<p class="text-sm text-text-200">{reason.pitch}</p>{/if}
		</div>

		<div class="flex flex-wrap gap-2" role="group" aria-label="How long to pause">
			{#each PAUSE_MONTHS as option (option)}
				<button
					type="button"
					aria-pressed={months === option}
					onclick={() => (months = option)}
					class="rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors {months === option
						? 'border-brand bg-tile-400 text-text-300'
						: 'border-tile-500 text-text-200 hover:border-tile-600'}"
				>
					{option} {option === 1 ? 'month' : 'months'}
				</button>
			{/each}
		</div>

		<p class="text-sm text-text-200">
			You keep Premium until {formatDate(details.currentPeriodEnd)}. No charges after that until
			{formatDate(resumesAt)}, and you can resume any time from this page.
		</p>
		{#if progress}<p class="text-sm text-text-200">{progress} It's all kept while you're paused.</p>{/if}

		<div class="flex flex-col gap-2 sm:flex-row">
			<Button type="button" onClick={pause} disabled={busy} className="flex-1 text-sm">
				{busy ? 'Pausing…' : `Pause for ${months} ${months === 1 ? 'month' : 'months'}`}
			</Button>
			<Button type="button" variant="danger" onClick={cancel} disabled={busy} className="flex-1 text-sm">
				Cancel anyway
			</Button>
		</div>
		<button type="button" onclick={keep} class="text-sm font-medium text-text-200 underline">
			Keep my subscription as it is
		</button>
	{:else}
		<div class="space-y-1">
			<p class="font-semibold text-text-300">Cancel your subscription?</p>
			<p class="text-sm text-text-200">
				{#if endsNow}
					Premium ends now.
				{:else if isTrialing}
					You won't be charged. Premium ends {formatDate(accessEnd)}.
				{:else}
					You keep Premium until {formatDate(accessEnd)}, then it stops.
				{/if}
				{#if progress}{progress} Your words stay saved, but Premium features stop.{/if}
			</p>
		</div>

		<div class="flex gap-2">
			<Button type="button" variant="danger" onClick={cancel} disabled={busy} className="flex-1 text-sm">
				{busy ? 'Cancelling…' : 'Yes, cancel'}
			</Button>
			<Button type="button" variant="secondary" onClick={keep} disabled={busy} className="flex-1 text-sm">
				Keep my subscription
			</Button>
		</div>
	{/if}

	{#if error}
		<p class="text-sm font-semibold text-red-600">{error}</p>
	{/if}
</div>
