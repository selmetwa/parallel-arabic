<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import ConjugationWrapper from '../components/ConjugationWrapper.svelte';
	import { PUBLIC_PRICE_ID } from '$env/static/public';
	import { goto } from '$app/navigation';
	import { updateUrl } from '$lib/helpers/update-url';

	let { data } = $props();

	let wordIndex = $state(
		(() => {
			if (typeof window !== 'undefined') {
				const params = new URLSearchParams(window.location.search);
				const urlIndex = parseInt(params.get('verb') ?? '0') || 0;
				// Ensure index is within bounds
				return Math.min(Math.max(urlIndex-1, 0), (data?.words?.length ?? 1) - 1);
			}
			return 0;
		})()
	);

	let verbToConjugate = $derived(data.words[wordIndex]);
	let tensesViewed = $state(data.tensesViewed || 0);

	async function updateTensesViewed() {
		await fetch('/api/increment_tenses_viewed', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({})
		})
			.then((res) => res.json())
			.then((json) => {
				tensesViewed = json.tensesViewed;
			});
	}

	function next() {
		wordIndex = wordIndex + 1;
		updateUrl('verb', (wordIndex+1).toString());
	}

	function previous() {
		wordIndex = wordIndex - 1;
		updateUrl('verb', (wordIndex+1).toString());
	}
</script>

{#if !data.session}
	<div class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
		<div class="border border-tile-600 bg-tile-300 py-4 px-3 text-center">
			<h1 class="text-2xl font-bold text-text-300">
				You must have an account to access this content.
			</h1>
			<div class="mx-auto mt-4 w-fit">
				<Button type="button" onClick={() => goto('/signup')}>Create Account</Button>
			</div>
		</div>
	</div>
{:else if !data.hasActiveSubscription && tensesViewed >= 31}
	<div class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
		<div class="border border-tile-600 bg-tile-300 py-4 px-3 text-center">
			<h1 class="text-2xl font-bold text-text-300">
				You have reached your limit of 30 Verb conjugations.
			</h1>
			<p class="mt-2 text-xl text-text-200">To continue practicing, please subscribe.</p>
			<form method="POST" action="/?/subscribe" class="mx-auto mt-4 w-fit">
				<input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
				<Button type="submit">Subscribe</Button>
			</form>
		</div>
	</div>
{:else}
	<header class="border-b border-tile-600 bg-tile-400 px-3 py-4 text-center sm:px-8">
		<div class="flex w-full items-center justify-between max-w-5xl mx-auto">
			<div class="w-max">
				{#if wordIndex > 0}
					<Button onClick={previous} className="w-fit" type="submit">Previous Word</Button>
				{/if}
			</div>
			<div>
				<h1 class="text-lg font-bold text-text-300">{wordIndex + 1} / {data.words.length} words</h1>
			</div>
			<div class="w-max">
				{#if wordIndex < data.words.length - 1}
					<Button onClick={next} className="w-fit" type="submit">Next Word</Button>
				{/if}
			</div>
		</div>
	</header>
	<div class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
		<ConjugationWrapper {wordIndex} {verbToConjugate} {updateTensesViewed}></ConjugationWrapper>
	</div>
{/if}
