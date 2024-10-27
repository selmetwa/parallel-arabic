<script lang="ts">
	import { run } from 'svelte/legacy';

	import Block from './Block.svelte';
	import ActiveWordBlock from './ActiveWordBlock.svelte';
	import { type TextObj, type KeyWord, Mode } from '../types';


	interface Props {
		sentence: TextObj;
		mode: Mode;
		keyWords?: KeyWord[];
		activeWordObj?: any;
		setActiveWord?: any;
	}

	let {
		sentence,
		mode,
		keyWords = [],
		activeWordObj = {
		english: '',
		arabic: '',
		transliterated: '',
    description: '',
    isLoading: false,
    type: ''
	},
		setActiveWord = (word: KeyWord) => {}
	}: Props = $props();

	let englishWords: string[] = $state([]);
	let arabicWords: string[] = $state([]);
	let transliteratedWords: string[] = $state([]);

	run(() => {
		englishWords = sentence.english || [];
		arabicWords = sentence.arabic.reverse() || [];
		transliteratedWords = sentence.transliterated || [];
	});
</script>

<div class="flex flex-col divide-y divide-tile-600">
	<div class="flex flex-col-reverse divide-x divide-tile-600 sm:flex-row">
		<Block
			words={englishWords}
			type="english"
			{setActiveWord}
			showBlock={mode === Mode.BiText || mode === Mode.SentanceView}
			{keyWords}
		/>
		<Block 
      words={arabicWords} 
      type="arabic" 
      {setActiveWord} 
      {keyWords} 
    />
	</div>
	{#if mode === Mode.SentanceView}
		<div class="flex flex-col-reverse divide-x divide-tile-600 sm:flex-row">
			<ActiveWordBlock {activeWordObj} />
			<Block
				words={transliteratedWords}
				type="transliterated"
				{setActiveWord}
				{keyWords}
			/>
		</div>
	{/if}
</div>
