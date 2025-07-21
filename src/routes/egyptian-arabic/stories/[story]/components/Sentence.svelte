<script lang="ts">
	import { askChatGTP } from '../helpers/ask-chat-gpt';
	import cn from 'classnames';
	import Checkmark from '$lib/components/Checkmark.svelte';
	import Audio from '$lib/components/Audio.svelte';
	import AudioButton from '$lib/components/AudioButton.svelte';

	type TWholeSentence = {
		arabic: TSentence;
		english: TSentence;
		transliteration: TSentence;
	};

	type TSentence = {
		speaker?: string;
		text: string;
		audio?: string;
	};

	interface Props {
		sentence: TWholeSentence;
		setActiveWord: (word: any) => void;
		type?: string;
		classname?: string;
		index: any;
		mode: any;
		isGenerated?: boolean;
	}

	let {
		sentence,
		setActiveWord,
		type = '',
		classname = '',
		index,
		mode,
		isGenerated
	}: Props = $props();

	let _sentence = $derived((sentence && type && (type in sentence)) ? sentence[type as keyof TWholeSentence] : { speaker: '', text: '' });
	let isLoading = $state(false);
	let error = $state('');
	let response = $state('');

	let isArabic = $derived(type === 'arabic');
	let words = $derived(_sentence?.text ? (isArabic ? _sentence.text.split(' ').reverse() : _sentence.text.split(' ')) : []);

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
		const res = await askChatGTP(cleanWord, type, {
			arabic: sentence.arabic.text,
			english: sentence.english.text,
			transliteration: sentence.transliteration.text
		});
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

	async function saveWord() {
		isLoading = true;

		const res = await fetch('/api/save-word', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				activeWordObj: {
					english: sentence.english.text,
					arabic: sentence.arabic.text,
					transliterated: sentence.transliteration.text
				}
			})
		});

		isLoading = false;
		const data = await res.json();

		if (
			[
				'You have already saved this',
				'You must have an account do that',
				'Something went wrong'
			].includes(data.message)
		) {
			error = data.message;
			response = '';
		} else {
			error = '';
			response = data.message;
		}

		setTimeout(() => {
			error = '';
			response = '';
		}, 3000);
	}
</script>

<div
	dir={isArabic ? 'rtl' : 'ltr'}
	class={cn('relative flex flex-col justify-center border-b border-tile-600 px-5 py-10', classname)}
>
	{#if type === 'arabic' && mode !== 'SentanceView'}
		{#if _sentence && 'audio' in _sentence && _sentence.audio}
			<div class="absolute right-0 top-0 w-1/4">
				<Audio src={_sentence.audio}></Audio>
			</div>
		{/if}
		{#if !(_sentence && 'audio' in _sentence && _sentence.audio)}
			<div class="absolute bottom-0 left-0 w-fit">
				<AudioButton text={_sentence.text}>Play Audio</AudioButton>
			</div>
		{/if}
	{/if}
	{#if type === 'arabic'}
		<button
			type="button"
			class="absolute left-2 top-2 text-[14px] text-text-200 underline"
			onclick={saveWord}
		>
			{#if isLoading}
				<span class="flex flex-row items-center gap-2 text-center">
					<div role="status">
						<svg
							aria-hidden="true"
							class="h-[24px] w-[24px] animate-spin fill-tile-300 text-text-200 dark:text-text-200"
							viewBox="0 0 100 101"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
								fill="currentColor"
							/>
							<path
								d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
								fill="currentFill"
							/>
						</svg>
						<span class="sr-only">Loading...</span>
					</div>
					Saving
				</span>
			{:else if response && !error}
				<span class="flex flex-row items-center gap-2 text-center">
					<Checkmark></Checkmark>
					{response}
				</span>
			{:else}
				Save Sentence
			{/if}
		</button>
		{#if error}
			<p class="absolute left-2 top-8 text-text-300">{error}</p>
		{/if}
	{/if}
	<p class="text-lg font-semibold text-text-200">{_sentence.speaker}</p>
	<div class="mt-1 flex flex-wrap gap-1 text-text-300">
		{#if isArabic}
			{#each words.reverse() as word}
				<button
					class="transitional-all rounded-sm p-1 text-5xl duration-300 hover:bg-tile-500"
					value={word}
					onclick={assignActiveWord}
				>
					{word}
				</button>
			{/each}
		{:else}
			{#each words as word}
				<button
					class="transitional-all rounded-sm p-1 text-4xl duration-300 hover:bg-tile-500"
					value={word}
					onclick={assignActiveWord}
				>
					{word}
				</button>
			{/each}
		{/if}
	</div>
</div>
