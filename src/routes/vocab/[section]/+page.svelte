<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import WordBlock from './components/WordBlock.svelte';
	import type { wordObjectGroup } from '$lib/types';
	import { sections } from '$lib/constants/sections';
	import { PUBLIC_TEST_PRICE_ID } from '$env/static/public';

	export let data: any;

	let index = 0;

	function next() {
		if (index === data.words.length - 1) {
			return;
		}
		index = index + 1;
	}

	function previous() {
		if (index === 0) {
			return;
		}
		index = index - 1;
	}

	function shuffleArray(array: any) {
		const _arr = [...array];
		for (let i = _arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[_arr[i], _arr[j]] = [_arr[j], _arr[i]];
		}
		return _arr;
	}

	$: wordObj = {} as wordObjectGroup;
	let word = data.words.slice(1)[0];
	let shuffledWords = shuffleArray(
		data.words.slice(1).filter((w: any) => word.english !== w.english)
	);
	let shuffledAnswers = shuffleArray([word, shuffledWords[0], shuffledWords[1], shuffledWords[2]]);
	$: {
		if (data.words.length > index) {
			word = data.words.slice(1)[index];
			shuffledWords = shuffleArray(data.words.slice(1));
			shuffledAnswers = shuffleArray([word, shuffledWords[0], shuffledWords[1], shuffledWords[2]]);

			if (shuffledAnswers) {
				wordObj.answer = word;
				wordObj.first = shuffledAnswers[0];
				wordObj.second = shuffledAnswers[1];
				wordObj.third = shuffledAnswers[2];
				wordObj.fourth = shuffledAnswers[3];
			}
		}
	}

  const a = sections && sections?.find((section) => section.path === data.section)
	const isPaywalled = sections && sections?.find((section) => section.path === data.section).isPaywalled;
</script>

{#if isPaywalled && !data.isSubscribed}
	<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-4 text-center sm:mx-36">
		<h1 class="text-2xl font-bold text-text-300">You are not subscribed.</h1>
		<p class="mt-2 text-xl text-text-200">To continue practicing, please subscribe.</p>
		<form method="POST" action="/?/subscribe" class="mx-auto mt-4 w-fit">
			<!-- Modify this value using your own Stripe price_id -->
			<input type="hidden" name="price_id" value={PUBLIC_TEST_PRICE_ID} />

			<Button type="submit">Subscribe</Button>
		</form>
	</div>
{:else}
	<header class="m-auto border-b border-tile-600 bg-tile-400 px-4 py-8 text-center sm:px-16">
		<div class="flex w-full justify-between">
			<div class="w-max">
				{#if index > 0}
					<Button onClick={previous} type="button">Previous</Button>
				{/if}
			</div>
			<div>
				<h1 class="text-lg font-bold text-text-300">{index + 1} / {data.words.length}</h1>
			</div>
			<div class="w-max">
				{#if index < data.words.length - 1}
					<Button onClick={next} type="button">Next</Button>
				{/if}
			</div>
		</div>
	</header>

	<section class="mt-4 px-4 sm:px-16">
		<WordBlock {wordObj} {next} />
	</section>
{/if}
