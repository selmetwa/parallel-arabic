<script lang="ts">
	import type { KeyWord } from '../types';
	import Word from './Word.svelte';
	export let keyWords: KeyWord[] = [];
	export let words: string[] = [];
	export let showBlock = true;
	export let type = '';
	export let setActiveWord = (obj: KeyWord) => {};

	function removeComma(inputString: string) {
		const commataPattern = /[\u060C]/g;
		return inputString.replace(commataPattern, '');
	}

  async function askChatGTP(word: string) {
    let question = '';
    if (type === 'arabic') {
      question = `What does ${word} mean in Egyptian Arabic?`;
    } else if (type === 'english') {
      question = `What is the word for ${word} in Egyptian Arabic?`;
    } else {
      question = `What does ${word} mean in Egyptian Arabic?`;
    }
  
    const res = await fetch('/api/open-ai', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				question: question
			})
		});

    const data = await res.json();

    return data;
  }

	async function assignActiveWord(event: Event) {
    setActiveWord({
		 	english: '',
		 	arabic: '',
		 	transliterated: '',
      description: '',
      isLoading: true,
      type: ''
		 });

		const word = (event.target as HTMLButtonElement).value.replace(/,/g, '');
    const cleanWord = removeComma(word);
    const res = await askChatGTP(cleanWord);
    const message = res.message.message.content;

		 setActiveWord({
		 	english: '',
		 	arabic: removeComma(word),
		 	transliterated: '',
      description: message,
      isLoading: false,
      type: type
		 });
	}
</script>

{#if showBlock}
	<div class="flex-1 bg-tile-300 px-4 py-10">
		{#if type === 'arabic'}
			<div class="flex flex-row flex-wrap gap-1" dir="rtl">
				{#each words.reverse() as word}
					<Word {word} {keyWords} {assignActiveWord} {type} />
				{/each}
			</div>
		{:else}
			<div class="flex flex-row flex-wrap gap-1">
				{#each words as word}
					<Word {word} {keyWords} {assignActiveWord} {type} />
				{/each}
			</div>
		{/if}
	</div>
{/if}
