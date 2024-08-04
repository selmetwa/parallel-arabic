<script lang="ts">
	import { letters } from '$lib/constants/alphabet';
	import LetterBlock from './../components/LetterBlock.svelte';
	import Button from '$lib/components/Button.svelte';

	$: index = 0;
  const lettersCopy = [...letters];
	const randomizedLetters = lettersCopy.sort(() => Math.random() - 0.5);

	$: letter = randomizedLetters[index];

	function handleNext() {
		index += 1;
	}

	function handlePrevious() {
		index -= 1;
	}
</script>

<section class="px-2 sm:px-8 py-2">
	<header class="flex w-fit flex-row items-center gap-2 whitespace-nowrap py-8">
		{#if index > 0}
			<Button onClick={handlePrevious} type="button">Previous</Button>
		{/if}
		{#if index < randomizedLetters.length - 1}
			<Button onClick={handleNext} type="button">Next</Button>
		{/if}
		<p class="text-text-200">
			{index + 1} / {randomizedLetters.length}
		</p>
	</header>
</section>

<section class="px-2 sm:px-8">
  <LetterBlock {letter} {handleNext} />
</section>
