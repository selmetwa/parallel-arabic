<script lang="ts">
	import Sentence from './components/Sentence.svelte';
	import type { PageData } from './$types';
	import { Mode } from './types';
	import Header from './components/Header.svelte';
  import Drawer from '../../../components/Drawer.svelte';
	export let data: PageData;
	const sentences = data.formattedStory?.text || [];
	const sentencesLength = sentences.length || 0;
	let sentence = 0;

	let showEnglish = true;
	let showArabic = true;
	let showTransliterated = true;
	let showWordDetails = true;

  let mode = Mode.SingleText

  let isOpen = true;

  function updateMode(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    switch (value) {
      case 'single-text':
        mode = Mode.SingleText;
        break;
      case 'bi-text':
        mode = Mode.BiText;
        break;
      case 'sentence-view':
        mode = Mode.SentanceView;
        break;
      default:
        break;
    }
  }

  function handleOpenDrawer() {
    isOpen = true;
  }

  function handleCloseDrawer() {
    isOpen = false;
  }

	function nextSentence() {
		if (sentence === sentencesLength - 1) {
			sentence = 0;
			return;
		}
		sentence++;
	}

	function previousSentence() {
		if (sentence === 0) {
			sentence = sentencesLength - 1;
			return;
		}
		sentence--;
	}

	// function updateBlocksToShow(event: Event) {
	// 	const value = (event.target as HTMLInputElement).value;

	// 	switch (value) {
	// 		case 'english':
	// 			showEnglish = !showEnglish;
	// 			break;
	// 		case 'arabic':
	// 			showArabic = !showArabic;
	// 			break;
	// 		case 'transliterated':
	// 			showTransliterated = !showTransliterated;
	// 			break;
	// 		case 'word-details':
	// 			showWordDetails = !showWordDetails;
	// 			break;
	// 		default:
	// 			break;
	// 	}
	// }

  const modeOptions = [
    { value: 'single-text', text: 'Single Text'},
    { value: 'bi-text', text: 'Bi Text'},
    { value: 'sentence-view', text: 'Sentence View' },
  ];
</script>

<main class="h-full p-3">
  <fieldset>
    <legend>Select Mode</legend>
    <ul class="flex flex-col gap-2">
      {#each modeOptions as option}
        <li>
          <label
            for={option.value}
            class="flex gap-4 flex-row items-center border border-raison w-full p-2 text-base sm:cursor-pointer"
          >
            <input
              type="radio"
              name="mode"
              id={option.value}
              value={option.value}
              on:change={updateMode}
            />
            <span class="overflow-hidden text-ellipsis text-base font-normal whitespace-nowrap select-none">{option.text}</span>
          </label>
        </li>
      {/each}
    </ul>
  </fieldset>
  <button on:click={handleOpenDrawer}>open</button>

	<section class="mt-8 flex flex-col divide-y divide-raison">
		{#each sentences as sentence}
			<Sentence {sentence} {mode} />
		{/each}
	</section>
</main>



















	<!-- <Header
		key={data.story[0].key}
    {handleOpenDrawer}
		{previousSentence}
		{nextSentence}
		{sentence}
		{showArabic}
		{showEnglish}
		{showTransliterated}
		{showWordDetails}
		{updateBlocksToShow}
	/> -->