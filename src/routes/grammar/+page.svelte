<script>
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	let { data } = $props();
</script>

{#if !data.session}
	<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-4 text-center sm:mx-36">
		<h1 class="text-2xl font-bold text-text-300">
			You must have an account to access this content.
		</h1>
		<div class="mx-auto mt-4 w-fit">
			<Button type="button" onClick={() => goto('/signup')}>Create Account</Button>
		</div>
	</div>
{:else}
	<section class="mt-8 px-4 sm:mt-12 sm:px-16">
		<h1 class="text-4xl font-bold text-text-300">Practice Egyptian Arabic Grammar</h1>
		<div class="mt-4 flex flex-col gap-4 sm:flex-row">
			<a
				href="grammar/verb-conjugation"
				class="transitional-all flex flex-1 cursor-pointer flex-col gap-2 border-2 border-tile-600 bg-tile-400 px-4 py-8 text-center font-semibold duration-300 hover:bg-tile-500"
			>
				<h2 class="text-3xl text-text-300">Verb Conjugations Practice</h2>
				<p class="text-lg text-text-200">Practice conjugating verbs</p>
			</a>
		</div>
    <div class="mt-4 flex flex-col gap-4 sm:flex-row">
			<a
				href="grammar/verb-conjugation-flashcards"
				class="transitional-all flex flex-1 cursor-pointer flex-col gap-2 border-2 border-tile-600 bg-tile-400 px-4 py-8 text-center font-semibold duration-300 hover:bg-tile-500"
			>
				<h2 class="text-3xl text-text-300">Verb Conjugation Flashcards</h2>
			</a>
		</div>
	</section>
{/if}
