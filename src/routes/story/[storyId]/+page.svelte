<script lang="ts">
	import type { PageData } from './$types';
	import type { TextObj, KeyWord } from './types';
  import Header from './components/Header.svelte';
	import Block from './components/Block.svelte';
	import ActiveWordBlock from './components/ActiveWordBlock.svelte';

	export let data: PageData;
	console.log({ data });
	const sentencesLength = data.formattedStory?.text.length || 0;
	const keyWords = data.formattedStory?.keyWords || [];

	let sentence = 0;
	let englishWords: string[] = [];
	let arabicWords: string[] = [];
	let transliteratedWords: string[] = [];
	let showEnglish = true;
	let showArabic = true;
	let showTransliterated = true;
	let showWordDetails = true;

	let activeWordObj = {
    english: '',
    arabic: '',
    transliterated: '',
  };

	$: {
		const sentenceData: TextObj = data.formattedStory?.text[sentence];
		englishWords = sentenceData?.english || [];
		arabicWords = sentenceData?.arabic.reverse() || [];
		transliteratedWords = sentenceData?.transliterated || [];
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

	function setActiveWord(obj: KeyWord) {
		activeWordObj = obj;
	}

  function updateBlocksToShow(event: Event) {
    const value = (event.target as HTMLInputElement).value;
  
    switch (value) {
      case 'english':
        showEnglish = !showEnglish;
        break;
      case 'arabic':
        showArabic = !showArabic;
        break;
      case 'transliterated':
        showTransliterated = !showTransliterated;
        break;
      case 'word-details':
        showWordDetails = !showWordDetails;
        break;
      default:
        break;
  }
  }
</script>

<main class="h-full p-3">
	<Header 
    key={data.story[0].key} 
    {previousSentence} 
    {nextSentence} 
    {sentence} 
    {showArabic}
    {showEnglish}
    {showTransliterated}
    {showWordDetails}
    {updateBlocksToShow}
  />
	<div class="mt-8 grid h-auto grid-cols-1 gap-1 sm:grid-cols-2">
		<Block words={englishWords} showBlock={showEnglish} {keyWords} />
		<Block words={arabicWords} showBlock={showArabic} isArabic={true} {setActiveWord} {keyWords} />
		<ActiveWordBlock {activeWordObj} showBlock={showWordDetails} />
		<Block {keyWords} words={transliteratedWords} showBlock={showTransliterated} />
	</div>
</main>
