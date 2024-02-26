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
          return removeArabicDiacritics(keyWord.arabic.trim()) === removeArabicDiacritics(word.trim())
        }
        if (type === 'english') {
          return keyWord.english.trim().toLowerCase() === word.trim().toLowerCase()
        }
        if (type === 'transliterated') {
          return keyWord.transliterated.trim().toLowerCase() === word.trim().toLowerCase()
        }
      }
		);

    console.log({keyWord, keyWords, word, type})
		if (keyWord !== undefined) {
			isKeyWord = true;
		} else {
			isKeyWord = false;
		}
	}

</script>

{#if type === 'arabic'}
	{#if isKeyWord}
		<button class="text-4xl underline decoration-tile-600 text-text-300" value={word} on:click={checkForKeyWord}>
			{word}
		</button>
	{:else}
		<button class="text-4xl text-text-300" value={word} on:click={checkForKeyWord}>
			{word}
		</button>
	{/if}
{:else if isKeyWord}
	<button class="text-4xl underline decoration-tile-600 text-text-300" value={word} on:click={checkForKeyWord}>
		{word}
	</button>
{:else}
	<span class="text-4xl text-text-300">
		{word}
	</span>
{/if}
