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
	<section class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
		<div class="text-left mb-6">
			<h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-1 tracking-tight">Practice Egyptian Arabic Grammar</h1>
			<p class="text-text-200 text-lg sm:text-xl leading-snug">
				Master Egyptian Arabic grammar through interactive exercises and practice sessions.
			</p>
		</div>
		
		<ul class="grid grid-cols-1 md:grid-cols-2 gap-2 auto-rows-fr">
			<li class="flex">
				<a href="grammar/verb-conjugation" class="flex w-full">
					<article class="group w-full px-3 py-4 flex flex-col justify-between border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
						<div class="flex flex-col gap-1">
							<h2 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Verb Conjugations Practice</h2>
						</div>
						<div class="flex flex-col gap-0 mt-1">
							<p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">Interactive verb conjugation exercises</p>
							<p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">Practice all tenses and forms</p>
						</div>
					</article>
				</a>
			</li>
			<li class="flex">
				<a href="grammar/verb-conjugation-flashcards" class="flex w-full">
					<article class="group w-full px-3 py-4 flex flex-col justify-between border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
						<div class="flex flex-col gap-1">
							<h2 class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">Verb Conjugation Flashcards</h2>
						</div>
						<div class="flex flex-col gap-0 mt-1">
							<p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">Flashcard-style verb practice</p>
							<p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">Quick review and memorization</p>
						</div>
					</article>
				</a>
			</li>
		</ul>
	</section>
{/if}
