<script lang="ts">
	import { letters } from '../../../constants/alphabet';
  import LetterBlock from './components/LetterBlock.svelte';
  import Button from '../../../components/Button.svelte';

  $: index = 0;
  const randomizedLetters = letters.sort(() => Math.random() - 0.5);

	$: letter = randomizedLetters[index];

  function handleNext() {
    index += 1;
  }

  function handlePrevious() {
    index -= 1;
  }
</script>


<section class="px-8 py-4">
  <header class="flex w-fit whitespace-nowrap items-center flex-row gap-2 py-8">
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
  <LetterBlock {letter} {handleNext} />
</section>