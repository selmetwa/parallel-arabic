<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { enablePush, PUSH_PROMPT_SNOOZE_KEY, snoozePushPrompt } from '$lib/helpers/push-notifications';

	/** "Not now" is not "never": ask again after this long. */
	const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

	let visible = $state(false);

	onMount(() => {
		visible = Date.now() > Number(localStorage.getItem(PUSH_PROMPT_SNOOZE_KEY) ?? 0);
	});

	function notNow() {
		visible = false;
		snoozePushPrompt(SNOOZE_MS);
	}

	// iOS only shows its own dialog once, so whatever they answer there is final.
	async function turnOn() {
		visible = false;
		await enablePush();
	}
</script>

<!--
	Asked here first because the iOS dialog can only ever be shown once: this
	way "Not now" costs nothing, and the system dialog only appears for people
	who have already said yes.
-->
{#if visible}
	<div
		transition:fly={{ y: 80, duration: 250 }}
		class="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-tile-600 bg-tile-300 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl"
		role="region"
		aria-label="Turn on reminders"
	>
		<div class="mx-auto max-w-3xl">
			<p class="font-bold leading-tight text-text-300">Want a reminder to practise?</p>
			<p class="mt-1 text-sm text-text-200">
				We'll tell you before your streak ends and when words are ready to review. One a day at
				most.
			</p>
			<div class="mt-3 flex gap-2">
				<button
					type="button"
					onclick={turnOn}
					class="rounded-xl border-2 border-tile-600 bg-brand px-4 py-2 text-sm font-semibold text-white transition-all duration-150 active:scale-95"
				>
					Turn on reminders
				</button>
				<button
					type="button"
					onclick={notNow}
					class="rounded-xl border-2 border-tile-600 bg-tile-500 px-4 py-2 text-sm font-semibold text-text-300 transition-all duration-150 hover:bg-tile-600 active:scale-95"
				>
					Not now
				</button>
			</div>
		</div>
	</div>
{/if}
