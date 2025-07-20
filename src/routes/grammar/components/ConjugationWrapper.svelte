<script lang="ts">
	import Button from '$lib/components/Button.svelte';
  import WordBlock from './WordBlock.svelte';
  import Table from './Table.svelte';
	import SaveButton from '$lib/components/SaveButton.svelte';
  import AudioButton from "$lib/components/AudioButton.svelte";
  import { updateUrl } from '$lib/helpers/update-url';

  interface Props {
    wordIndex: any;
    verbToConjugate: any;
    updateTensesViewed: () => void;
  }

  let { wordIndex, verbToConjugate, updateTensesViewed }: Props = $props();

  let conjugationIndex = $state(
		(() => {
			if (typeof window !== 'undefined') {
				const params = new URLSearchParams(window.location.search);
				const urlIndex = parseInt(params.get('tense') ?? '0') || 0;
				// Ensure index is within bounds
				return Math.min(Math.max(urlIndex-1, 0), (31) - 1);
			}
			return 0;
		})()
	);
  let previousWordIndex = $state(wordIndex);

	let showHint = $state(false);
	let showTable = $state(false);
  let showAnswer = $state(false);

  $effect(() => {
    if (wordIndex && wordIndex !== previousWordIndex) {
      previousWordIndex = wordIndex;
      conjugationIndex = 0;
      updateUrl('tense', (conjugationIndex+1).toString());
    }
  });

  async function next() {
    if (conjugationIndex === 31) {
      return;
    }

    updateTensesViewed();
    conjugationIndex = conjugationIndex + 1;
    updateUrl('tense', (conjugationIndex+1).toString());
  }

  async function previous() {
    if (conjugationIndex === 0) {
      return;
    }
    conjugationIndex = conjugationIndex - 1;
    updateUrl('tense', (conjugationIndex+1).toString());
  }
</script>

{#if showTable}
  <Table></Table>
{/if}

<header class="border-b border-tile-600 bg-tile-400 px-3 py-4 text-center mb-6">
	<div class="flex w-full items-center justify-between">
		<div class="w-max">
			{#if conjugationIndex > 0}
				<Button onClick={previous} className="w-fit" type="submit">Previous Tense</Button>
			{/if}
		</div>
		<div>
			<h2 class="text-lg font-bold text-text-300">{conjugationIndex + 1} / 32 tenses</h2>
		</div>
		<div class="w-max">
			{#if conjugationIndex < 31}
				<Button onClick={next} className="w-fit" type="submit">Next Tense</Button>
			{/if}
		</div>
	</div>
</header>

<div class="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
	<Button onClick={() => showHint = !showHint} type='button'>
		{showHint ? 'Hide' : 'Show'} Hint
	</Button>
	<Button onClick={() => showTable = !showTable} type='button'>
		{showTable ? 'Hide' : 'Show'} Table
	</Button>
	<Button onClick={() => showAnswer = !showAnswer} type='button'>
		{showAnswer ? 'Hide' : 'Show'} Answer
	</Button>
	<AudioButton text={verbToConjugate.egyptianArabic.trim().split(/[-–]/)[1].trim()}>
		Audio
	</AudioButton>
	<SaveButton
		objectToSave={{
			arabic: verbToConjugate.egyptianArabic,
			english: verbToConjugate.english,
			transliterated: verbToConjugate.egyptianArabicTransliteration
		}}
	></SaveButton>
</div>

<WordBlock {conjugationIndex} {verbToConjugate} {showHint} {showAnswer}></WordBlock>

