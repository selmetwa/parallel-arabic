<script lang="ts">
	import { askChatGTP } from '../helpers/ask-chat-gpt';
  import cn from 'classnames';

	type TSentence = {
		speaker: string;
		text: string;
	};

	export let sentence: TSentence;
	export let setActiveWord: (word: any) => void;
	export let type = '';
  export let classname = '';

	$: isArabic = type === 'arabic';
	$: words = isArabic ? sentence.text.split(' ').reverse() : sentence.text.split(' ');

	function removeComma(inputString: string) {
		const commataPattern = /[\u060C]/g;
		return inputString.replace(commataPattern, '');
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
		const res = await askChatGTP(cleanWord, type);
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

<div 
dir={isArabic ? 'rtl' : 'ltr'} 
class={cn(
  "border-b border-tile-600 px-5 py-10 flex flex-col justify-center",
  classname
  )}
>
	<p class="text-lg font-semibold text-text-200">{sentence.speaker}</p>
	<div class="mt-1 flex flex-wrap gap-1 text-text-300">
		{#if isArabic}
			{#each words.reverse() as word}
				<button
					class="transitional-all p-1 rounded-sm text-5xl duration-300 hover:bg-tile-500"
					value={word}
					on:click={assignActiveWord}
				>
					{word}
				</button>
			{/each}
		{:else}
			{#each words as word}
				<button
					class="transitional-all p-1 rounded-sm text-4xl duration-300 hover:bg-tile-500"
					value={word}
					on:click={assignActiveWord}
				>
					{word}
				</button>
			{/each}
		{/if}
	</div>
</div>
