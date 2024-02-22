<script lang="ts">
	import type { PageData } from './$types';
	import type { TextObj, KeyWord } from './types';
  import Header from './components/Header.svelte';
	import Block from './components/Block.svelte';
	import ActiveWordBlock from './components/ActiveWordBlock.svelte';

	export let data: PageData;
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
    console.log({ obj })
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
    <section class="mt-8 flex flex-col gap-1">
      <div class="flex flex-col sm:flex-row gap-1">
        <Block words={englishWords} showBlock={showEnglish} {keyWords} {setActiveWord} type='english' />
        <Block words={arabicWords} showBlock={showArabic} type='arabic' {setActiveWord} {keyWords} />
      </div>
      <div class="flex flex-col sm:flex-row gap-1">
        <ActiveWordBlock {activeWordObj} showBlock={showWordDetails} />
        <Block {keyWords} words={transliteratedWords} showBlock={showTransliterated} {setActiveWord} type='transliterated' />
      </div>
    </section>
</main>
