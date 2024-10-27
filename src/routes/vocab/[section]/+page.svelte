<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import WordBlock from './components/WordBlock.svelte';
	import type { wordObjectGroup } from '$lib/types';
	import { sections } from '$lib/constants/sections';
	import { PUBLIC_PRICE_ID } from '$env/static/public';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();

	let index = $state(0);
	// let wordObj = $derived({} as wordObjectGroup);
	// let word = $state(data.words.slice(1)[0]);
  let word = $derived(data.words.slice(1)[index]);
	let shuffledWords = $state(shuffleArray(
		data.words.slice(1).filter((w: any) => word.english !== w.english)
	));
	// let shuffledAnswers = $state(shuffleArray([word, shuffledWords[0], shuffledWords[1], shuffledWords[2]]));

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

  let wordObj = $derived.by(() => {
    if (data.words.length > index) {
			const _shuffledWords = shuffleArray(data.words.slice(1));
			const _shuffledAnswers = shuffleArray([word, _shuffledWords[0], _shuffledWords[1], _shuffledWords[2]]);

      return {
        answer: word,
        first: _shuffledAnswers[0],
        second: _shuffledAnswers[1],
        third: _shuffledAnswers[2],
        fourth: _shuffledAnswers[3]
      };
    }
  })

	const isPaywalled = sections && sections?.find((section) => section.path === data.section).isPaywalled;
</script>

{#if isPaywalled && !data.isSubscribed}
	<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-4 text-center sm:mx-36">
		<h1 class="text-2xl font-bold text-text-300">You are not subscribed.</h1>
		<p class="mt-2 text-xl text-text-200">To continue practicing, please subscribe.</p>
		<form method="POST" action="/?/subscribe" class="mx-auto mt-4 w-fit">
			<input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
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
