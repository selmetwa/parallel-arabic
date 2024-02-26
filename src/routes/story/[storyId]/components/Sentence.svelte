<script lang="ts">
	import Block from './Block.svelte';
	import ActiveWordBlock from './ActiveWordBlock.svelte';
	import { type TextObj, type KeyWord, Mode } from '../types';

	export let sentence: TextObj;
  export let mode: Mode;
	export let keyWords: KeyWord[] = [];

	let englishWords: string[] = [];
	let arabicWords: string[] = [];
	let transliteratedWords: string[] = [];

	let activeWordObj = {
		english: '',
		arabic: '',
		transliterated: ''
	};

	function setActiveWord(obj: KeyWord) {
		activeWordObj = obj;
	}

	$: {
		englishWords = sentence.english || [];
		arabicWords = sentence.arabic.reverse() || [];
		transliteratedWords = sentence.transliterated || [];
	}
</script>

<div class="flex flex-col divide-y divide-tile-600">
	<div class="flex flex-col sm:flex-row divide-x divide-tile-600">
		<Block 
      words={englishWords} 
      type="english" 
      {setActiveWord} showBlock={mode === Mode.BiText || mode === Mode.SentanceView}  
      {keyWords}
    />
		<Block words={arabicWords} type="arabic" {setActiveWord} {keyWords} />
	</div>
  {#if mode === Mode.SentanceView}
    <div class="flex flex-col sm:flex-row divide-x divide-tile-600">
      <ActiveWordBlock {activeWordObj} />
      <Block words={transliteratedWords} type="transliterated" {setActiveWord} {keyWords} />
    </div>
  {/if}
</div>
