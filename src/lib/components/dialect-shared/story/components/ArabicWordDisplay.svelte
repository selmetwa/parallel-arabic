<script lang="ts">
	import cn from 'classnames';
	import { askChatGTP } from '../helpers/ask-chat-gpt';
	import { type Dialect } from '$lib/types/index';

	type TWordAlignment = {
		arabic: string;
		english: string;
		transliteration: string;
	};

	type TSentence = {
		arabic: { text: string; speaker?: string };
		arabicTashkeel?: { text: string };
		english: { text: string };
		transliteration: { text: string };
		wordAlignments?: TWordAlignment[];
	};

	interface Props {
		sentence: TSentence;
		setActiveWord: (word: any) => void;
		dialect: Dialect;
		showEnglish?: boolean;
		showTransliteration?: boolean;
		showTashkeel?: boolean;
	}

	let { sentence, setActiveWord, dialect, showEnglish = true, showTransliteration = true, showTashkeel = false }: Props =
		$props();

	// Word cache for instant re-display on repeated clicks
	let wordCache = new Map<string, string>();

	// Drag-and-select state
	let selectedIndices = $state<number[]>([]);
	let isSelecting = $state(false);
	let selectionStartIndex = $state(-1);
	let selectionEndIndex = $state(-1);

	// Derived arabic words for fallback mode
	let arabicWords = $derived(sentence.arabic?.text?.split(' ') || []);

	// Tashkeel words split from the full tashkeel sentence
	let tashkeelWords = $derived(sentence.arabicTashkeel?.text?.split(' ') || []);

	// Words used for selection (arabic tokens from whichever mode is active)
	let wordList = $derived(
		sentence.wordAlignments?.length
			? sentence.wordAlignments.map((w) => w.arabic)
			: arabicWords
	);

	let selectedArabicPhrase = $derived(
		selectedIndices.length > 0 ? selectedIndices.map((i) => wordList[i]).join(' ') : ''
	);

	function handleWordMouseDown(index: number, event: MouseEvent) {
		event.preventDefault();
		isSelecting = true;
		selectionStartIndex = index;
		selectionEndIndex = index;
		updateSelection();
	}

	function handleWordMouseEnter(index: number) {
		if (isSelecting) {
			selectionEndIndex = index;
			updateSelection();
		}
	}

	function handleWordMouseUp() {
		isSelecting = false;
	}

	function updateSelection() {
		if (selectionStartIndex === -1 || selectionEndIndex === -1) return;
		const start = Math.min(selectionStartIndex, selectionEndIndex);
		const end = Math.max(selectionStartIndex, selectionEndIndex);
		selectedIndices = Array.from({ length: end - start + 1 }, (_, i) => start + i);
	}

	function clearSelection() {
		selectedIndices = [];
		selectionStartIndex = -1;
		selectionEndIndex = -1;
	}

	function isWordSelected(index: number): boolean {
		return selectedIndices.includes(index);
	}

	async function fetchDefinition(arabicWord: string, wordAlign?: TWordAlignment) {
		const cacheKey = `${arabicWord}-arabic-${dialect}`;
		const cached = wordCache.get(cacheKey);

		if (cached) {
			setActiveWord({
				english: wordAlign?.english || '',
				arabic: arabicWord,
				transliterated: wordAlign?.transliteration || '',
				description: cached,
				isLoading: false,
				type: 'arabic'
			});
			return;
		}

		setActiveWord({
			english: '',
			arabic: '',
			transliterated: '',
			description: '',
			isLoading: true,
			type: ''
		});

		try {
			const res = await askChatGTP(
				arabicWord,
				'arabic',
				{
					arabic: sentence.arabic.text,
					english: sentence.english.text,
					transliteration: sentence.transliteration.text
				},
				dialect
			);
			const message = res.message.message.content;
			wordCache.set(cacheKey, message);
			setActiveWord({
				english: wordAlign?.english || '',
				arabic: arabicWord,
				transliterated: wordAlign?.transliteration || '',
				description: message,
				isLoading: false,
				type: 'arabic'
			});
		} catch (err) {
			console.error('Error fetching definition:', err);
			setActiveWord({
				english: wordAlign?.english || '',
				arabic: arabicWord,
				transliterated: wordAlign?.transliteration || '',
				description: '',
				isLoading: false,
				type: 'arabic'
			});
		}
	}

	async function defineSelectedWords() {
		if (!selectedArabicPhrase) return;

		const phrase = selectedArabicPhrase;
		setActiveWord({
			english: '',
			arabic: '',
			transliterated: '',
			description: '',
			isLoading: true,
			type: ''
		});

		try {
			const res = await askChatGTP(
				phrase,
				'arabic',
				{
					arabic: sentence.arabic.text,
					english: sentence.english.text,
					transliteration: sentence.transliteration.text
				},
				dialect
			);
			const message = res.message.message.content;
			setActiveWord({
				english: '',
				arabic: phrase,
				transliterated: '',
				description: message,
				isLoading: false,
				type: 'arabic'
			});
		} catch (err) {
			console.error('Error fetching definition:', err);
			setActiveWord({
				english: '',
				arabic: phrase,
				transliterated: '',
				description: '',
				isLoading: false,
				type: 'arabic'
			});
		}

		clearSelection();
	}
</script>

<!-- Selection action bar -->
{#if selectedIndices.length > 0}
	<div class="mb-3 flex flex-wrap gap-2 justify-center">
		<button
			onclick={defineSelectedWords}
			class="px-4 py-2 text-sm font-semibold bg-tile-600 border-2 border-tile-600 text-text-300 hover:bg-tile-700 transition-colors duration-300 shadow-md rounded"
		>
			Define "{selectedArabicPhrase}"
		</button>
		<button
			onclick={clearSelection}
			class="px-4 py-2 text-sm font-semibold bg-tile-400 border-2 border-tile-600 text-text-300 hover:bg-tile-500 hover:border-tile-500 transition-colors duration-300 rounded"
		>
			Clear Selection
		</button>
	</div>
{/if}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex flex-wrap gap-3 sm:gap-4 justify-center select-none"
	dir="rtl"
	onmouseup={handleWordMouseUp}
>
	{#if sentence.wordAlignments?.length}
		<!-- Word-aligned display -->
		{#each sentence.wordAlignments as wordAlign, wordIndex}
			{@const displayArabic = showTashkeel && tashkeelWords[wordIndex] ? tashkeelWords[wordIndex] : wordAlign.arabic}
			<button
				class={cn(
					'flex flex-col items-center px-2 py-2 sm:px-3 sm:py-3 rounded-lg transition-all duration-200 cursor-pointer group border-2',
					isWordSelected(wordIndex)
						? 'bg-blue-200 border-blue-400 shadow-md'
						: 'border-transparent hover:bg-tile-500 hover:shadow-md hover:border-tile-600'
				)}
				onclick={() => fetchDefinition(wordAlign.arabic.replace(/[،,]/g, ''), wordAlign)}
				onmousedown={(e) => handleWordMouseDown(wordIndex, e)}
				onmouseenter={() => handleWordMouseEnter(wordIndex)}
			>
				{#if showTransliteration}
					<span
						class="text-xs sm:text-sm text-text-200 italic mb-0.5 opacity-75 group-hover:opacity-100 transition-opacity"
					>
						{wordAlign.transliteration}
					</span>
				{/if}
				{#if showEnglish}
					<span
						class="text-xs sm:text-sm text-text-200 mb-1 opacity-90 group-hover:opacity-100 transition-opacity"
					>
						{wordAlign.english}
					</span>
				{/if}
				<span class="text-xl sm:text-2xl md:text-3xl font-semibold text-text-300">
					{displayArabic}
				</span>
			</button>
		{/each}
	{:else}
		<!-- Fallback: plain Arabic word tokens -->
		{#each (showTashkeel && tashkeelWords.length ? tashkeelWords : arabicWords) as arabicWord, wordIndex}
			<button
				class={cn(
					'px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 cursor-pointer border-2 text-xl sm:text-2xl md:text-3xl font-semibold text-text-300',
					isWordSelected(wordIndex)
						? 'bg-blue-200 border-blue-400 shadow-md'
						: 'border-transparent hover:bg-tile-500 hover:shadow-md hover:border-tile-600'
				)}
				onclick={() => fetchDefinition((arabicWords[wordIndex] || arabicWord).replace(/[،,]/g, ''))}
				onmousedown={(e) => handleWordMouseDown(wordIndex, e)}
				onmouseenter={() => handleWordMouseEnter(wordIndex)}
			>
				{arabicWord}
			</button>
		{/each}
	{/if}
</div>
