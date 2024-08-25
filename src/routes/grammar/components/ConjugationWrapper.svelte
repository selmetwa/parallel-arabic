<script lang="ts">
	import Button from '$lib/components/Button.svelte';
  import WordBlock from './WordBlock.svelte';
  import Table from './Table.svelte';
	import SaveButton from '$lib/components/SaveButton.svelte';

	export let wordIndex;
  export let verbToConjugate;
  export let updateTensesViewed: () => void;
  import Menu from '$lib/components/Menu.svelte';

  $: conjugationIndex = 0;
	$: showHint = false;
	$: showTable = false;
  $: showAnswer = false;

  $: if (wordIndex) {
    conjugationIndex = 0;
  }

  async function next() {
    if (conjugationIndex === 31) {
      return;
    }

    updateTensesViewed();
    conjugationIndex = conjugationIndex + 1;
  }

  console.log({ verbToConjugate})
</script>

{#if showTable}
  <Table></Table>
{/if}
<header class="py-2">
	<div class="flex flex-row justify-between px-4 sm:px-16">
		<div class="w-fit">
			{#if conjugationIndex > 0}
				<Button onClick={() => (conjugationIndex -= 1)} className="w-fit" type="submit"
					>Previous Tense</Button
				>
			{/if}
		</div>
    {#if conjugationIndex < 31}
      <div class="w-fit">
        <Button onClick={next} className="w-fit" type="submit">Next Tense</Button>
      </div>
    {/if}
	</div>
</header>


<Menu>
    <button on:click={() => showHint = !showHint} class="block px-4 py-2 text-sm text-text-300 hover:bg-tile-400 w-full text-left">
      {showHint ? 'Hide' : 'Show'} Hint
    </button>
    <button on:click={() => showTable = !showTable} class="block px-4 py-2 text-sm text-text-300 hover:bg-tile-400 w-full text-left">
      {showTable ? 'Hide' : 'Show'} Conjugation Table
    </button>
    <button on:click={() => showAnswer = !showAnswer} class="block px-4 py-2 text-sm text-text-300 hover:bg-tile-400 w-full text-left">
      {showAnswer ? 'Hide' : 'Show'} Answer
    </button>
    <SaveButton
    objectToSave={{
      arabic: verbToConjugate.egyptianArabic,
      english: verbToConjugate.english,
      transliterated: verbToConjugate.egyptianArabicTransliteration
    }}
  ></SaveButton>
</Menu>
<WordBlock {conjugationIndex} {verbToConjugate} {showHint} {showAnswer}></WordBlock>

