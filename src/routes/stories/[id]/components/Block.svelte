<script lang="ts">
	import type { KeyWord } from '../types';
	import Word from './Word.svelte';
	export let keyWords: KeyWord[] = [];
	export let words: string[] = [];
	export let showBlock = true;
	export let type = '';
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
		const word = (event.target as HTMLButtonElement).value.replace(/,/g, '');
		const keyWord = keyWords.find((keyWord) => {
			if (type === 'arabic') {
				return (
					removeArabicDiacritics(keyWord.arabic.trim()) === removeArabicDiacritics(word.trim())
				);
			}
			if (type === 'english') {
				return keyWord.english.trim().toLowerCase() === word.trim().toLowerCase();
			}
			if (type === 'transliterated') {
				return keyWord.transliterated.trim().toLowerCase() === word.trim().toLowerCase();
			}
		});

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
	<div class="flex-1 bg-tile-300 px-4 py-10">
		{#if type === 'arabic'}
			<div class="flex flex-row flex-wrap gap-1" dir="rtl">
				{#each words.reverse() as word}
					<Word {word} {keyWords} {checkForKeyWord} {type} />
				{/each}
			</div>
		{:else}
			<div class="flex flex-row flex-wrap gap-1">
				{#each words as word}
					<Word {word} {keyWords} {checkForKeyWord} {type} />
				{/each}
			</div>
		{/if}
	</div>
{/if}
