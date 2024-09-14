<script lang="ts">
	import { letters } from '$lib/constants/alphabet';
	import Button from '$lib/components/Button.svelte';
	import Draw from '../components/Draw.svelte';

	$: index = 0;
	const lettersCopy = [...letters];
	// const randomizedLetters = lettersCopy.sort(() => Math.random() - 0.5);

	$: letter = lettersCopy[index];

	function handleNext() {
		index += 1;
	}

	function handlePrevious() {
		index -= 1;
	}
</script>

<section class="px-4 pb-10 sm:px-16">
  <header class="flex w-fit flex-row items-center gap-2 whitespace-nowrap py-4 sm:py-8">
    {#if index > 0}
      <Button onClick={handlePrevious} type="button">Previous</Button>
    {/if}
    {#if index < lettersCopy.length - 1}
      <Button onClick={handleNext} type="button">Next</Button>
    {/if}
    <p class="text-text-200">
      {index + 1} / {lettersCopy.length}
    </p>
  </header>
	<Draw {letter} />
</section>
