<script lang="ts">
	import type { KeyWord } from '../types';

	export let keyWords: KeyWord[] = [];
	export let words: string[] = [];
	export let showBlock = true;
	export let isArabic = false;
	export let setActiveWord = (obj: KeyWord) => {};

  function removeArabicDiacritics(inputString: string) {
    const diacriticsPattern = /[\u060C\u064B-\u065F\u0670\u0640]/g;
    return inputString.replace(diacriticsPattern, '');
  }

  function removeComma(inputString: string) {
    const commataPattern = /[\u060C]/g;
    return inputString.replace(commataPattern, '');
  }

	function checkForKeyWord(event: Event) {
		const word = (event.target as HTMLButtonElement).value;
		const keyWord = keyWords.find((keyWord) => removeArabicDiacritics(keyWord.arabic.trim()) === removeArabicDiacritics(word.trim()));

		if (keyWord !== undefined) {
			return setActiveWord(keyWord);
		}

		setActiveWord({
			english: '',
			arabic: removeComma(word),
			transliterated: ''
		});
	}
</script>

{#if showBlock}
	<div class="border-2 border-blue-400 bg-blue-300 px-4 py-10">
		{#if isArabic}
			<div class="flex flex-row flex-wrap gap-1" dir="rtl">
				{#each words.reverse() as word}
					<button class="text-4xl" value={word} on:click={checkForKeyWord}>
						{word}
					</button>
				{/each}
			</div>
		{:else}
			<div class="flex flex-row flex-wrap gap-1">
				{#each words as word}
					<span class="text-4xl">
						{word}
					</span>
				{/each}
			</div>
		{/if}
	</div>
{/if}
