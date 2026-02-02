<script lang="ts">
	import { askChatGTP } from '../helpers/ask-chat-gpt';
	import cn from 'classnames';
	import Checkmark from '$lib/components/Checkmark.svelte';
	import Audio from '$lib/components/Audio.svelte';
	import AudioButton from '$lib/components/AudioButton.svelte';
	import { type Dialect } from '$lib/types/index';
	import { filterArabicCharacters, removeArabicComma } from '$lib/utils/arabic-normalization';
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
		innerClassname?: string;
		index: any;
		mode: any;
		isGenerated?: boolean;
		dialect: Dialect;
		intersecting?: boolean;
		size?: 'sm' | 'md' | 'lg';
	}

	let {
		sentence,
		setActiveWord,
		type = '',
		classname = '',
		innerClassname = '',
		index,
		mode,
		isGenerated,
		dialect,
		intersecting = true,
		size = 'lg'
	}: Props = $props();

	// Text size classes based on size prop
	const sizeClasses = {
		sm: {
			arabic: 'text-lg md:text-xl',
			other: 'text-base md:text-lg'
		},
		md: {
			arabic: 'text-xl md:text-2xl',
			other: 'text-lg md:text-xl'
		},
		lg: {
			arabic: 'text-3xl md:text-5xl',
			other: 'text-2xl md:text-4xl'
		}
	};

	let _sentence = $derived((sentence && type && (type in sentence)) ? sentence[type as keyof TWholeSentence] : { speaker: '', text: '' });
	let isLoading = $state(false);
	let error = $state('');
	let response = $state('');

	let isArabic = $derived(type === 'arabic');
	let textSizeClass = $derived(isArabic ? sizeClasses[size].arabic : sizeClasses[size].other);
	let words = $derived(_sentence?.text ? (isArabic ? _sentence.text.split(' ').reverse() : _sentence.text.split(' ')) : []);

	// Cache for storing word definitions
	let wordCache = new Map<string, string>();

	// Multi-word selection state
	let selectedWords = $state<string[]>([]);
	let isSelecting = $state(false);
	let selectionStartIndex = $state(-1);
	let selectionEndIndex = $state(-1);

	// Clear selection when component goes out of view
	$effect(() => {
		if (!intersecting) {
			clearSelection(); // Clear word selection when out of view
		}
	});

	// Clear selection when sentence changes
	$effect(() => {
		if (_sentence?.text) {
			clearSelection();
		}
	});


	// Multi-word selection functions
	function handleWordMouseDown(index: number, event: MouseEvent) {
		event.preventDefault();
		isSelecting = true;
		selectionStartIndex = index;
		selectionEndIndex = index;
		updateSelectedWords();
	}

	function handleWordMouseEnter(index: number) {
		if (isSelecting) {
			selectionEndIndex = index;
			updateSelectedWords();
		}
	}

	function handleWordMouseUp() {
		isSelecting = false;
	}

	function updateSelectedWords() {
		if (selectionStartIndex === -1 || selectionEndIndex === -1) return;
		
		const start = Math.min(selectionStartIndex, selectionEndIndex);
		const end = Math.max(selectionStartIndex, selectionEndIndex);
		
		// Get the original words array (not reversed)
		const originalWords = _sentence?.text ? _sentence.text.split(' ') : [];
		selectedWords = originalWords.slice(start, end + 1);
	}

	function clearSelection(event?: Event) {
		// Prevent the click from bubbling up to parent elements (e.g., video timeline)
		event?.stopPropagation();
		
		selectedWords = [];
		selectionStartIndex = -1;
		selectionEndIndex = -1;
	}

	function isWordSelected(index: number): boolean {
		const start = Math.min(selectionStartIndex, selectionEndIndex);
		const end = Math.max(selectionStartIndex, selectionEndIndex);
		return selectedWords.length > 0 && index >= start && index <= end;
	}


	// Function to map English words to corresponding Arabic words
	function mapEnglishToArabic(englishWords: string[]): string {
		const allEnglishWords = sentence.english.text.split(' ');
		const allArabicWords = sentence.arabic.text.split(' ');
		
		// Find the indices of the selected English words
		const selectedIndices: number[] = [];
		
		for (const englishWord of englishWords) {
			const index = allEnglishWords.findIndex((word, i) => 
				word.toLowerCase() === englishWord.toLowerCase() && !selectedIndices.includes(i)
			);
			if (index !== -1) {
				selectedIndices.push(index);
			}
		}
		
		// Extract corresponding Arabic words
		const correspondingArabicWords = selectedIndices
			.sort((a, b) => a - b) // Maintain order
			.map(index => allArabicWords[index])
			.filter(word => word); // Remove undefined/empty words
		
		if (correspondingArabicWords.length > 0) {
			const arabicText = correspondingArabicWords.join(' ');
			return filterArabicCharacters(arabicText);
		}
		
		// Fallback: filter the entire Arabic sentence
		return filterArabicCharacters(sentence.arabic.text);
	}

	async function assignActiveWord(event: Event) {
		// Prevent the click from bubbling up to parent elements (e.g., video timeline)
		event.stopPropagation();
		
		const word = (event.target as HTMLButtonElement).value.replace(/,/g, '');
		const cleanWord = removeArabicComma(word);
		const cacheKey = `${cleanWord}-${type}-${dialect}`;

		// Check if we have a cached definition
		const cachedDefinition = wordCache.get(cacheKey);

		if (cachedDefinition) {
			// Use cached data for instant display
			setActiveWord({
				english: type === 'english' ? removeArabicComma(word) : '',
				arabic: type === 'arabic' ? removeArabicComma(word) : '',
				transliterated: type === 'transliteration' ? removeArabicComma(word) : '',
				description: cachedDefinition,
				isLoading: false,
				type: type
			});
		} else {
			// Fallback to the original behavior
			setActiveWord({
				english: '',
				arabic: '',
				transliterated: '',
				description: '',
				isLoading: true,
				type: ''
			});

			const res = await askChatGTP(cleanWord, type, {
				arabic: sentence.arabic.text,
				english: sentence.english.text,
				transliteration: sentence.transliteration.text
			}, dialect);
			const message = res.message.message.content;

			// Cache the result for future use
			wordCache.set(cacheKey, message);

			setActiveWord({
				english: removeArabicComma(word),
				arabic: removeArabicComma(word),
				transliterated: removeArabicComma(word),
				description: message,
				isLoading: false,
				type: type
			});
		}
	}

	// Function to define multiple selected words
	async function defineSelectedWords(event?: Event) {
		// Prevent the click from bubbling up to parent elements (e.g., video timeline)
		event?.stopPropagation();
		
		if (selectedWords.length === 0) return;

		const wordsArray = selectedWords;
		const targetWord = wordsArray.join(' ');
		
		// Map English words to Arabic equivalent and filter for Arabic characters only
		const targetArabicWord = type === 'english' ? mapEnglishToArabic(wordsArray) : wordsArray.join(' ');
		
		setActiveWord({
			english: '',
			arabic: '',
			transliterated: '',
			description: '',
			isLoading: true,
			type: ''
		});

		const res = await askChatGTP(targetWord, type, {
			arabic: sentence.arabic.text,
			english: sentence.english.text,
			transliteration: sentence.transliteration.text
		}, dialect);
		
		const message = res.message.message.content;

		setActiveWord({
			english: targetWord,
			arabic: targetArabicWord,
			transliterated:targetWord,
			description: message,
			isLoading: false,
			type: type
		});

		// Clear selection after defining
		clearSelection();
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
	class={cn('relative bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg', classname)}
>
	<!-- Header with speaker, audio, and save button -->
	<div class="flex items-start justify-between mb-4">
		<div class="flex-1">
			{#if _sentence.speaker}
				<p class="text-lg font-semibold text-text-300 mb-2">{_sentence.speaker}</p>
			{/if}
		</div>
		
		<div class="flex items-center gap-3">
			{#if type === 'arabic' && mode !== 'SentanceView'}
				{#if _sentence && 'audio' in _sentence && _sentence.audio}
					<Audio src={_sentence.audio}></Audio>
				{:else}
					<AudioButton text={_sentence.text} dialect={dialect}>Play Audio</AudioButton>
				{/if}
			{/if}
			
			{#if type === 'arabic'}
				<button
					type="button"
					class="px-4 py-2 text-sm font-semibold bg-tile-600 border-2 border-tile-600 text-text-300 hover:bg-tile-700 transition-colors duration-300 shadow-md rounded"
					onclick={saveWord}
					disabled={isLoading}
				>
					{#if isLoading}
						<span class="flex flex-row items-center gap-2">
							<div role="status">
								<svg
									aria-hidden="true"
									class="h-4 w-4 animate-spin fill-tile-300 text-text-200"
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
							Saving...
						</span>
					{:else if response && !error}
						<span class="flex flex-row items-center gap-2">
							<Checkmark></Checkmark>
							{response}
						</span>
					{:else}
						Save Sentence
					{/if}
				</button>
				{#if error}
					<p class="text-sm text-red-400">{error}</p>
				{/if}
			{/if}
		</div>
	</div>
	
	<!-- Selection controls -->
	{#if selectedWords.length > 0}
		<div class="mb-4 flex gap-2 justify-center flex-wrap">
			<button
				onclick={defineSelectedWords}
				class="px-4 py-2 text-sm font-semibold bg-tile-600 border-2 border-tile-600 text-text-300 hover:bg-tile-700 transition-colors duration-300 shadow-md rounded"
			>
				Define "{selectedWords.join(' ')}"
			</button>
			<button
				onclick={clearSelection}
				class="px-4 py-2 text-sm font-semibold bg-tile-400 border-2 border-tile-600 text-text-300 hover:bg-tile-500 hover:border-tile-500 transition-colors duration-300 rounded"
			>
				Clear Selection
			</button>
		</div>
	{/if}
	
	<!-- Words container -->
	<div 
		class={cn("flex flex-wrap gap-2 text-text-300 select-none", innerClassname)}
		onmouseup={handleWordMouseUp}
		role="application"
		aria-label="Word selection area for definitions"
	>
		{#if isArabic}
			{#each words.reverse() as word, index}
				<button
					class={cn("transition-all rounded-lg px-3 py-2 duration-300 cursor-pointer", textSizeClass, {
						"bg-blue-200 border-2 border-blue-400 shadow-md": isWordSelected(index),
						"border-2 border-transparent hover:bg-tile-500 hover:border-tile-600 hover:shadow-md": !isWordSelected(index)
					})}
					value={word}
					onclick={assignActiveWord}
					onmousedown={(e) => handleWordMouseDown(index, e)}
					onmouseenter={() => handleWordMouseEnter(index)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							assignActiveWord(e);
						}
					}}
					tabindex="0"
					aria-label={`Get definition for: ${word}`}
				>
					{word}
				</button>
			{/each}
		{:else}
			{#each words as word, index}
				<button
					class={cn("transition-all rounded-lg px-3 py-2 duration-300 cursor-pointer", textSizeClass, {
						"bg-blue-200 border-2 border-blue-400 shadow-md": isWordSelected(index),
						"border-2 border-transparent hover:bg-tile-500 hover:border-tile-600 hover:shadow-md": !isWordSelected(index)
					})}
					value={word}
					onclick={assignActiveWord}
					onmousedown={(e) => handleWordMouseDown(index, e)}
					onmouseenter={() => handleWordMouseEnter(index)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							assignActiveWord(e);
						}
					}}
					tabindex="0"
					aria-label={`Get definition for: ${word}`}
				>
					{word}
				</button>
			{/each}
		{/if}
	</div>
</div>
