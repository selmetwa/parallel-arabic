<script lang="ts">
	import { letters } from '$lib/constants/alphabet';
	import LetterBlock from './../components/LetterBlock.svelte';
	import Button from '$lib/components/Button.svelte';
  import { updateUrl } from '$lib/helpers/update-url';

  let index = $state((() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlIndex = parseInt(params.get('letter') ?? '0') || 0;
      // Ensure index is within bounds
      return Math.min(Math.max(urlIndex-1, 0), (letters.length ?? 1) - 1);
    }
    return 0;
  })());
	
	const lettersCopy = [...letters];

	let letter = $derived(lettersCopy[index]);

	function handleNext() {
		index += 1;
    updateUrl('letter', (index+1).toString());
	}

	function handlePrevious() {
		index -= 1;
    updateUrl('letter', (index+1).toString());
	}
</script>

<section class="mt-8 px-4 sm:mt-2 lg:px-20">
	<div class="py-2">
		<header class="flex w-fit flex-row items-center gap-2 whitespace-nowrap py-8">
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
	</div>
	<LetterBlock {letter} />
</section>
