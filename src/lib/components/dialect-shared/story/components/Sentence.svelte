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
		index: any;
		mode: any;
		isGenerated?: boolean;
		dialect: Dialect;
		intersecting?: boolean;
	}

	let {
		sentence,
		setActiveWord,
		type = '',
		classname = '',
		index,
		mode,
		isGenerated,
		dialect,
		intersecting = true
	}: Props = $props();

	let _sentence = $derived((sentence && type && (type in sentence)) ? sentence[type as keyof TWholeSentence] : { speaker: '', text: '' });
	let isLoading = $state(false);
	let error = $state('');
	let response = $state('');

	let isArabic = $derived(type === 'arabic');
	let words = $derived(_sentence?.text ? (isArabic ? _sentence.text.split(' ').reverse() : _sentence.text.split(' ')) : []);

	// Cache for storing word definitions
	let wordCache = new Map<string, string>();
	let hoverTimeouts = new Map<string, NodeJS.Timeout>();

	// Multi-word selection state
	let selectedWords = $state<string[]>([]);
	let isSelecting = $state(false);
	let selectionStartIndex = $state(-1);
	let selectionEndIndex = $state(-1);

	// Clear all hover timeouts when component goes out of view
	function clearAllHoverTimeouts() {
		hoverTimeouts.forEach((timeout) => {
			clearTimeout(timeout);
		});
		hoverTimeouts.clear();
	}

	// Clear timeouts when component goes out of view
	$effect(() => {
		if (!intersecting) {
			clearAllHoverTimeouts();
			clearSelection(); // Also clear word selection when out of view
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

	function clearSelection() {
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

	// Pre-fetch word definition on hover with debouncing
	async function handleWordHover(event: Event) {
		// Only pre-fetch if component is in view
		if (!intersecting) return;
		
		const word = (event.target as HTMLButtonElement).value.replace(/,/g, '');
		const cleanWord = removeArabicComma(word);
		const cacheKey = `${cleanWord}-${type}-${dialect}`;

		// Clear existing timeout for this word
		if (hoverTimeouts.has(cacheKey)) {
			clearTimeout(hoverTimeouts.get(cacheKey));
		}

		// Skip if already cached
		if (wordCache.has(cacheKey)) {
			return;
		}

		// Set a timeout to avoid making requests on quick mouse movements
		const timeout = setTimeout(async () => {
			try {
				const res = await askChatGTP(cleanWord, type, {
					arabic: sentence.arabic.text,
					english: sentence.english.text,
					transliteration: sentence.transliteration.text
				}, dialect);
				
				// Cache the result
				if (res.message?.message?.content) {
					wordCache.set(cacheKey, res.message.message.content);
				}
			} catch (error) {
				console.error('Error pre-fetching word definition:', error);
			}
			hoverTimeouts.delete(cacheKey);
		}, 300); // 300ms debounce delay

		hoverTimeouts.set(cacheKey, timeout);
	}

	// Clear timeout when mouse leaves
	function handleWordLeave(event: Event) {
		const word = (event.target as HTMLButtonElement).value.replace(/,/g, '');
		const cleanWord = removeArabicComma(word);
		const cacheKey = `${cleanWord}-${type}-${dialect}`;

		if (hoverTimeouts.has(cacheKey)) {
			clearTimeout(hoverTimeouts.get(cacheKey));
			hoverTimeouts.delete(cacheKey);
		}
	}

	async function assignActiveWord(event: Event) {
		const word = (event.target as HTMLButtonElement).value.replace(/,/g, '');
		const cleanWord = removeArabicComma(word);
		const cacheKey = `${cleanWord}-${type}-${dialect}`;

		// Check if we have a cached definition
		const cachedDefinition = wordCache.get(cacheKey);

		if (cachedDefinition) {
			// Use cached data for instant display
			setActiveWord({
				english: '',
				arabic: removeArabicComma(word),
				transliterated: '',
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
				english: '',
				arabic: removeArabicComma(word),
				transliterated: '',
				description: message,
				isLoading: false,
				type: type
			});
		}
	}

	// Function to define multiple selected words
	async function defineSelectedWords() {
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
			english: type === 'english' ? targetWord : '',
			arabic: type === 'arabic' ? targetArabicWord : targetArabicWord,
			transliterated: '',
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
				<AudioButton text={_sentence.text} dialect={dialect}>Play Audio</AudioButton>
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
	
	<!-- Selection controls -->
	{#if selectedWords.length > 0}
		<div class="mb-3 flex gap-2 justify-center">
			<button
				onclick={defineSelectedWords}
				class="px-3 py-1 bg-tile-400 text-text-300 rounded border border-tile-600 hover:bg-tile-500 hover:border-tile-500 transition-colors text-sm"
			>
				Define "{selectedWords.join(' ')}"
			</button>
			<button
				onclick={clearSelection}
				class="px-3 py-1 bg-tile-400 text-text-300 rounded border border-tile-600 hover:bg-tile-500 hover:border-tile-500 transition-colors text-sm"
			>
				Clear Selection
			</button>
		</div>
	{/if}
	
	<div 
		class="mt-1 flex flex-wrap gap-1 text-text-300 select-none"
		onmouseup={handleWordMouseUp}
		role="application"
		aria-label="Word selection area for definitions"
	>
		{#if isArabic}
			{#each words.reverse() as word, index}
				<button
					class={cn("transitional-all rounded-sm p-1 text-5xl duration-300 cursor-pointer border-2", {
						"bg-blue-200 border-blue-400": isWordSelected(index),
						"hover:bg-tile-500 border-transparent hover:border-tile-600": !isWordSelected(index)
					})}
					value={word}
					onclick={assignActiveWord}
					onmouseover={handleWordHover}
					onmouseleave={handleWordLeave}
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
					class={cn("transitional-all rounded-sm p-1 text-4xl duration-300 cursor-pointer border-2", {
						"bg-blue-200 border-blue-400": isWordSelected(index),
						"hover:bg-tile-500 border-transparent hover:border-tile-600": !isWordSelected(index)
					})}
					value={word}
					onclick={assignActiveWord}
					onmouseover={handleWordHover}
					onmouseleave={handleWordLeave}
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
