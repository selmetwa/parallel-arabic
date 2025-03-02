<script lang="ts">
	import Button from '$lib/components/Button.svelte';
  import WordBlock from './WordBlock.svelte';
  import Table from './Table.svelte';
	import SaveButton from '$lib/components/SaveButton.svelte';
  import AudioButton from "$lib/components/AudioButton.svelte";

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

<menu class="flex flex-col sm:flex-row gap-2 my-6">
  <Button onClick={() => showHint = !showHint}  type='button'>
    {showHint ? 'Hide' : 'Show'} Hint
  </Button>
  <Button onClick={() => showTable = !showTable} type='button'>
    {showTable ? 'Hide' : 'Show'} Conjugation Table
  </Button>
  <Button onClick={() => showAnswer = !showAnswer} type='button'>
    {showAnswer ? 'Hide' : 'Show'} Answer
  </Button>
  <AudioButton text={verbToConjugate.egyptianArabic.trim().split(/[-–]/)[1].trim()}>
    Listen to Pronunciation
  </AudioButton>
  <SaveButton
    objectToSave={{
      arabic: verbToConjugate.egyptianArabic,
      english: verbToConjugate.english,
      transliterated: verbToConjugate.egyptianArabicTransliteration
    }}
    ></SaveButton>
</menu>

<WordBlock {conjugationIndex} {verbToConjugate} {showHint} {showAnswer}></WordBlock>

