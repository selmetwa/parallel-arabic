<script lang="ts">
  import { run } from 'svelte/legacy';

	import Button from '$lib/components/Button.svelte';
  import WordBlock from './WordBlock.svelte';
  import Table from './Table.svelte';
	import SaveButton from '$lib/components/SaveButton.svelte';
  import Menu from '$lib/components/Menu.svelte';
  import { speakArabic } from '$lib/helpers/speak-arabic';

  interface Props {
    wordIndex: any;
    verbToConjugate: any;
    updateTensesViewed: () => void;
  }

  let { wordIndex, verbToConjugate, updateTensesViewed }: Props = $props();

  let conjugationIndex = $state(0);
	let showHint = $state(false);
	let showTable = $state(false);
  let showAnswer = $state(false);
  

  $effect(() => {
    if (wordIndex) {
      conjugationIndex = 0;
    }
  });

  async function next() {
    if (conjugationIndex === 31) {
      return;
    }

    updateTensesViewed();
    conjugationIndex = conjugationIndex + 1;
  }
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
    <button onclick={() => showHint = !showHint} class="block px-4 py-2 text-sm text-text-300 hover:bg-tile-400 w-full text-left">
      {showHint ? 'Hide' : 'Show'} Hint
    </button>
    <button onclick={() => showTable = !showTable} class="block px-4 py-2 text-sm text-text-300 hover:bg-tile-400 w-full text-left">
      {showTable ? 'Hide' : 'Show'} Conjugation Table
    </button>
    <button onclick={() => showAnswer = !showAnswer} class="block px-4 py-2 text-sm text-text-300 hover:bg-tile-400 w-full text-left">
      {showAnswer ? 'Hide' : 'Show'} Answer
    </button>
    <button onclick={() => speakArabic(verbToConjugate.egyptianArabic.trim().split(/[-–]/)[0].trim())} class="block px-4 py-2 text-sm text-text-300 hover:bg-tile-400 w-full text-left">
      Listen to Pronunciation
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

