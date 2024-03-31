<script lang="ts">
	import type { KeyWord } from '../types';

	export let word = '';
	export let keyWords: KeyWord[] = [];
	export let checkForKeyWord = (event: Event) => {};
	export let type = '';

	function removeArabicDiacritics(inputString: string) {
		const diacriticsPattern = /[\u060C\u064B-\u065F\u0670\u0640]/g;
		return inputString.replace(diacriticsPattern, '');
	}

	let isKeyWord = false;

	$: {
		const keyWord = keyWords.find(
			(keyWord) => {
        if (type === 'arabic') {
          return removeArabicDiacritics(keyWord.arabic.trim().replace(/,/g, '')) === removeArabicDiacritics(word.trim().replace(/,/g, ''))
        }
        if (type === 'english') {
          return keyWord.english.trim().toLowerCase().replace(/,/g, '') === word.trim().toLowerCase().replace(/,/g, '')
        }
        if (type === 'transliterated') {
          return keyWord.transliterated.trim().toLowerCase().replace(/,/g, '') === word.trim().toLowerCase().replace(/,/g, '')
        }
      }
		);

		if (keyWord !== undefined) {
			isKeyWord = true;
		} else {
			isKeyWord = false;
		}
	}

</script>

{#if type === 'arabic'}
	{#if isKeyWord}
		<button class="text-4xl underline text-text-300 bg-tile-400 px-1 rounded-sm hover:bg-tile-500 transitional-all duration-300" value={word} on:click={checkForKeyWord}>
			{word}
		</button>
	{:else}
		<button class="text-4xl text-text-300" value={word} on:click={checkForKeyWord}>
			{word}
		</button>
	{/if}
{:else if isKeyWord}
	<button class="text-4xl bg-tile-400 text-text-300 px-1 rounded-sm hover:bg-tile-500 transitional-all duration-300" value={word} on:click={checkForKeyWord}>
		{word}
	</button>
{:else}
	<span class="text-4xl text-text-300">
		{word}
	</span>
{/if}
