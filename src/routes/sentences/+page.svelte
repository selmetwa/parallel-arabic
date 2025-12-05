<script lang="ts">
	import SentenceBlock from '$lib/components/dialect-shared/sentences/SentenceBlock.svelte';
	import Button from '$lib/components/Button.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
	import SentenceQuiz from '$lib/components/dialect-shared/sentences/SentenceQuiz.svelte';
	import { currentDialect } from '$lib/store/store';
	import { PUBLIC_PRICE_ID } from '$env/static/public';
	import { goto } from '$app/navigation';
	import { updateUrl } from '$lib/helpers/update-url';
	import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
	import { type sentenceObjectItem, type Dialect } from '$lib/types/index';
	import { onMount } from 'svelte';
	import { showSentenceGenerationToast, showSentenceSuccessToast, showSentenceErrorToast } from '$lib/helpers/toast-helpers';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import { getDefaultDialect } from '$lib/helpers/get-default-dialect';
	import { fetchUserReviewWords } from '$lib/helpers/fetch-review-words';

	let { data } = $props();

	let isLoading = $state(false);
	let isError = $state(false);
	let errorMessage = $state('');

	onMount(() => {
		currentDialect.set('');
	});

	let index = $state((() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			const urlIndex = parseInt(params.get('sentence') ?? '0') || 0;
			return urlIndex ? urlIndex - 1 : 0;
		}
		return 0;
	})());

	// Function to filter out incomplete sentences
	function filterValidSentences(sentences: any[]): sentenceObjectItem[] {
		return sentences.filter(sentence => 
			sentence && 
			typeof sentence.arabic === 'string' && 
			typeof sentence.english === 'string' && 
			typeof sentence.transliteration === 'string' &&
			sentence.arabic.trim() !== '' &&
			sentence.english.trim() !== '' &&
			sentence.transliteration.trim() !== ''
		);
	}

	let selectedDialect = $state(getDefaultDialect(data.user));
	let sentences = $state((() => {
		if (typeof window !== 'undefined') {
			const savedSentences = localStorage.getItem(`sentences_${selectedDialect}`);
			if (savedSentences) {
				try {
					const parsed = JSON.parse(savedSentences);
					return filterValidSentences(parsed);
				} catch (error) {
					console.error('Error parsing saved sentences from localStorage:', error);
					// Clear corrupted data
					localStorage.removeItem(`sentences_${selectedDialect}`);
				}
			}
		}
		return [];
	})());

	let sentence = $derived(sentences[index]);
	$effect(() => {
		if (sentences.length > 0) {
			index = Math.min(index, sentences.length - 1);
		}
	});

	let option = $state('a1');
	let selectedLearningTopics = $state<string[]>([]);
	let vocabularyWords = $state('');
	let vocabularyInputMode = $state('text'); // 'text' or 'file'
	let vocabularyFile = $state<File | null>(null);
	let fileError = $state('');

	// Review words only mode
	let useReviewWordsOnly = $state(false);
	let reviewWordsSource = $state<'all' | 'due-for-review'>('all');
	let reviewWords = $state<Array<{ arabic: string; english: string; transliteration: string }>>([]);
	let isLoadingReviewWords = $state(false);
	let reviewWordsError = $state('');

	let mode = $state((() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			return params.get('mode') || 'write';
		}
	})());

	let sentencesViewed = $state(data.sentencesViewed);

	// Update sentences when dialect changes
	$effect(() => {
		if (typeof window !== 'undefined') {
			const savedSentences = localStorage.getItem(`sentences_${selectedDialect}`);
			if (savedSentences) {
				try {
					const parsed = JSON.parse(savedSentences);
					sentences = filterValidSentences(parsed);
				} catch (error) {
					console.error('Error parsing saved sentences from localStorage:', error);
					sentences = [];
					// Clear corrupted data
					localStorage.removeItem(`sentences_${selectedDialect}`);
				}
			} else {
				sentences = [];
			}
			index = 0;
			updateUrl('sentence', '0');
		}
	});

	function toggleLearningTopic(topicValue: string) {
		if (selectedLearningTopics.includes(topicValue)) {
			selectedLearningTopics = selectedLearningTopics.filter((t: string) => t !== topicValue);
		} else {
			selectedLearningTopics = [...selectedLearningTopics, topicValue];
		}
	}

	async function loadReviewWords() {
		if (!data.user?.id) {
			reviewWordsError = 'User not found';
			return;
		}

		isLoadingReviewWords = true;
		reviewWordsError = '';
		
		try {
			const words = await fetchUserReviewWords(data.user.id, reviewWordsSource);
			reviewWords = words;
			
			if (words.length === 0) {
				reviewWordsError = `You don't have any ${reviewWordsSource === 'all' ? 'saved words' : 'words due for review'} yet. Add words to your review deck first.`;
			}
		} catch (error) {
			console.error('Error loading review words:', error);
			reviewWordsError = 'Failed to load review words. Please try again.';
		} finally {
			isLoadingReviewWords = false;
		}
	}

	// Watch for changes to review words source and toggle
	$effect(() => {
		if (useReviewWordsOnly && data.user?.id) {
			loadReviewWords();
		} else {
			reviewWords = [];
			reviewWordsError = '';
		}
	});

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		fileError = '';
		
		if (file) {
			// Check file size (150KB limit)
			const maxSize = 150 * 1024; // 150KB in bytes
			if (file.size > maxSize) {
				fileError = 'File size must be less than 150KB';
				vocabularyFile = null;
				return;
			}
			
			// Check file type
			const allowedTypes = ['text/plain', 'text/csv', 'application/csv'];
			const fileExtension = file.name.toLowerCase().split('.').pop();
			
			if (!allowedTypes.includes(file.type) && !['txt', 'csv'].includes(fileExtension || '')) {
				fileError = 'Only TXT and CSV files are allowed';
				vocabularyFile = null;
				return;
			}
			
			vocabularyFile = file;
		} else {
			vocabularyFile = null;
		}
	}

	async function processVocabularyFile(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const text = e.target?.result as string;
				if (text) {
					// Process CSV or TXT content
					let words: string[] = [];
					
					if (file.name.toLowerCase().endsWith('.csv')) {
						// Parse CSV - assume words are in first column or comma-separated
						const lines = text.split('\n');
						words = lines.flatMap((line: string) => 
							line.split(',').map((word: string) => word.trim().replace(/['"]/g, ''))
						).filter((word: string) => word.length > 0);
					} else {
						// Parse TXT - assume words are separated by commas, newlines, or spaces
						words = text.split(/[,\n\s]+/).map((word: string) => word.trim()).filter((word: string) => word.length > 0);
					}
					
					resolve(words.join(', '));
				} else {
					reject(new Error('Failed to read file'));
				}
			};
			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsText(file);
		});
	}

	async function generateSentence(option: string, copy: any) {
		isLoading = true;
		isError = false;
		errorMessage = '';
		
		// Show processing toast
		const toastId = showSentenceGenerationToast(selectedDialect, 5);
		
		// Validate review words mode
		if (useReviewWordsOnly && reviewWords.length === 0) {
			showSentenceErrorToast(toastId, `You don't have any ${reviewWordsSource === 'all' ? 'saved words' : 'words due for review'} yet. Add words to your review deck first.`);
			isLoading = false;
			return;
		}

		let finalVocabularyWords = vocabularyWords;
		
		// If file mode is selected and a file is uploaded, process it
		if (!useReviewWordsOnly && vocabularyInputMode === 'file' && vocabularyFile) {
			try {
				finalVocabularyWords = await processVocabularyFile(vocabularyFile);
			} catch (error) {
				showSentenceErrorToast(toastId, 'Failed to process vocabulary file');
				fileError = 'Failed to process file';
				isLoading = false;
				return;
			}
		}
		
		try {
			// Determine which API endpoint to use based on dialect
			const endpoint = selectedDialect === 'egyptian-arabic' ? 
				'/api/generate-sentences-egyptian' : 
				'/api/generate-sentences';

			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { accept: 'application/json' },
				body: JSON.stringify({
					option,
					sentences: copy,
					dialect: selectedDialect,
					learningTopics: useReviewWordsOnly ? [] : selectedLearningTopics,
					vocabularyWords: useReviewWordsOnly ? '' : finalVocabularyWords,
					useReviewWordsOnly: useReviewWordsOnly || false,
					reviewWordsSource: reviewWordsSource || 'all',
					reviewWords: reviewWords || []
				})
			});

			if (!res.ok) {
				throw new Error(`Server error: ${res.status} ${res.statusText}`);
			}

			const chatgptres = await res.json();
			
			if (!chatgptres.message?.message?.content) {
				throw new Error('Invalid response format from server');
			}
			
			const jsonBlob = chatgptres.message.message.content;
			let _sentences;
			try {
				_sentences = JSON.parse(jsonBlob);
			} catch (error) {
				console.error('Error parsing generated sentences JSON:', error);
				throw new Error('Failed to parse generated sentences');
			}
			const newSentences = filterValidSentences(_sentences.sentences || []);
			
			if (newSentences.length === 0) {
				throw new Error('No valid sentences were generated. Please try again.');
			}
			
			const updatedSentences = [...sentences, ...newSentences];
			sentences = updatedSentences;
			localStorage.setItem(`sentences_${selectedDialect}`, JSON.stringify(updatedSentences));
			
			// Show success toast
			showSentenceSuccessToast(toastId, newSentences.length, selectedDialect);
			
		} catch (error) {
			console.error('Error generating sentences:', error);
			const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred while generating sentences. Please try again.';
			
			// Show error toast
			showSentenceErrorToast(toastId, errorMsg);
			
			isError = true;
			errorMessage = errorMsg;
		} finally {
			isLoading = false;
		}
	}

	async function updateSentencesViewed() {
		const res = await fetch('/api/increment-sentences', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({})
		});
		const json = await res.json();
		sentencesViewed = json.sentencesViewed;
	}

	function next() {
		if (index === sentences.length - 1) {
			return;
		}

		updateSentencesViewed();
		index = index + 1;
		updateUrl('sentence', (index+1).toString());
	}

	function previous() {
		if (index === 0) {
			return;
		}
		index = index - 1;
		updateUrl('sentence', (index+1).toString());
	}

	function setMode(event: any) {
		const newMode = event.target.value || 'write';
		mode = newMode;
		updateUrl('mode', newMode);
	}

	function setOption(event: any) {
		option = event.target.value;
	}

	function setDialect(event: any) {
		selectedDialect = event.target.value;
	}

	function generateSentences(event: any) {
		event.preventDefault();
		const copy = [...sentences];
		generateSentence(option, copy);
	}

	function loadMoreSentences() {
		generateSentence(option, sentences);
	}

	function resetSentences() {
		sentences = [];
		index = 0;
		localStorage.removeItem(`sentences_${selectedDialect}`);
		updateUrl('sentence', '0');
	}

	let isLastSentence = $derived(index === sentences.length - 1);
	let hasReachedLimit = $derived(!data.isSubscribed && sentencesViewed >= 5);

	const dialectOptions = [
		{ value: 'egyptian-arabic', label: 'Egyptian Arabic', emoji: '🇪🇬' },
		{ value: 'fusha', label: 'Modern Standard Arabic', emoji: '📚' },
		{ value: 'levantine', label: 'Levantine Arabic', emoji: '🇱🇧' },
		{ value: 'darija', label: 'Moroccan Darija', emoji: '🇲🇦' },
	];

	const learningTopicOptions = [
		{ label: 'Verb Conjugation', value: 'verb conjugation', emoji: '🔄' },
		{ label: 'Noun Plurals', value: 'noun plurals', emoji: '📝' },
		{ label: 'Past Tense', value: 'past tense', emoji: '⏪' },
		{ label: 'Present Tense', value: 'present tense', emoji: '▶️' },
		{ label: 'Infinitive', value: 'infinitive', emoji: '∞' },
		{ label: 'Numbers', value: 'numbers', emoji: '🔢' },
		{ label: 'Future Tense', value: 'future tense', emoji: '⏩' },
		{ label: 'Possessive Suffixes', value: 'possessive suffixes', emoji: '👤' }
	];

	const difficultyOptions = [
		{ value: 'a1', label: 'A1', sublabel: 'Beginner', color: 'bg-green-600' },
		{ value: 'a2', label: 'A2', sublabel: 'Elementary', color: 'bg-green-500' },
		{ value: 'b1', label: 'B1', sublabel: 'Intermediate', color: 'bg-yellow-500' },
		{ value: 'b2', label: 'B2', sublabel: 'Upper Int.', color: 'bg-orange-500' },
		{ value: 'c1', label: 'C1', sublabel: 'Advanced', color: 'bg-red-500' },
		{ value: 'c2', label: 'C2', sublabel: 'Proficient', color: 'bg-red-600' }
	];

</script>

{#if hasReachedLimit && data.session}
	<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-8 text-center sm:mx-auto max-w-2xl rounded-xl shadow-lg">
		<h1 class="text-2xl font-bold text-text-300">You have reached your limit of 5 sentences.</h1>
		<p class="mt-2 text-xl text-text-200">To continue practicing, please subscribe.</p>
		<form method="POST" action="/?/subscribe" class="mx-auto mt-6 w-fit">
			<input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
			<Button type="submit">Subscribe</Button>
		</form>
	</div>
{/if}

{#if isError}
	<div class="px-3 mt-6 sm:px-8 max-w-3xl mx-auto">
		<div class="flex flex-col items-center gap-4 border-2 border-red-200 bg-red-50/50 p-6 text-text-200 shadow-lg rounded-xl">
			<div class="text-center">
				<p class="text-2xl text-red-700 font-bold mb-2">
					Generation Failed
				</p>
				<p class="text-red-600 mb-6">
					{errorMessage}
				</p>
				<button
					onclick={() => { isError = false; errorMessage = ''; }}
					class="px-6 py-2 bg-white text-red-700 rounded-lg border border-red-200 hover:bg-red-50 transition-colors font-medium shadow-sm"
				>
					Try Again
				</button>
			</div>
		</div>
	</div>
{/if}

{#if !isLoading && sentences.length === 0 && !hasReachedLimit}
	<!-- Generation Form -->
	<header class="py-6 sm:py-6 bg-tile-200 border-b border-tile-600 px-6 sm:px-12">
		<div class=" text-left">
			<h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-2 tracking-tight">
				Sentence Practice
			</h1>
			<p class="text-text-200 text-lg sm:text-xl leading-snug max-w-2xl">
				Drill grammar patterns and vocabulary in context with unlimited AI-generated sentences.
			</p>
		</div>
	</header>

	<section class="py-8 sm:py-8">
		<div class=" px-6 sm:px-12">
			<form class="space-y-8" onsubmit={generateSentences}>
				<!-- Review Words Toggle Card -->
				<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
					<div class="p-6">
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-2">
									<span class="text-2xl">🔄</span>
									<h3 class="text-lg font-bold text-text-300">Use Your Review Words</h3>
								</div>
								<p class="text-sm text-text-200 leading-relaxed">
									Generate sentences using words from your review deck. This reinforces vocabulary through contextual practice.
								</p>
							</div>
							<label class="relative inline-flex items-center cursor-pointer">
								<input type="checkbox" bind:checked={useReviewWordsOnly} class="sr-only peer" />
								<div class="w-14 h-8 bg-tile-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
							</label>
						</div>
					</div>
				</div>

				{#if useReviewWordsOnly}
					<!-- Review Words Mode -->
					
					<!-- Dialect Selection -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="p-4 border-b border-tile-600">
							<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
								<span>🌍</span> Select Dialect
							</h3>
						</div>
						<div class="p-6">
							<div class="grid grid-cols-2 gap-3">
								{#each dialectOptions as dialectOption}
									<button
										type="button"
										onclick={() => selectedDialect = dialectOption.value}
										class="flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 text-left {selectedDialect === dialectOption.value ? 'bg-tile-500 border-tile-400 shadow-md' : 'bg-tile-300 border-tile-600 hover:bg-tile-300/70 hover:border-tile-500'}"
									>
										<span class="text-2xl">{dialectOption.emoji}</span>
										<span class="font-semibold text-text-300">{dialectOption.label}</span>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Word Source Selection -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="p-4 border-b border-tile-600">
							<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
								<span>📚</span> Word Source
							</h3>
						</div>
						<div class="p-6">
							<div class="grid grid-cols-2 gap-3">
								<button
									type="button"
									onclick={() => reviewWordsSource = 'all'}
									class="p-4 rounded-lg border-2 transition-all duration-200 text-center {reviewWordsSource === 'all' ? 'bg-tile-500 border-tile-400 shadow-md' : 'bg-tile-300 border-tile-600 hover:bg-tile-300/70'}"
								>
									<span class="block text-2xl mb-2">📖</span>
									<span class="font-semibold text-text-300">All Saved Words</span>
								</button>
								<button
									type="button"
									onclick={() => reviewWordsSource = 'due-for-review'}
									class="p-4 rounded-lg border-2 transition-all duration-200 text-center {reviewWordsSource === 'due-for-review' ? 'bg-tile-500 border-tile-400 shadow-md' : 'bg-tile-300 border-tile-600 hover:bg-tile-300/70'}"
								>
									<span class="block text-2xl mb-2">⏰</span>
									<span class="font-semibold text-text-300">Due for Review</span>
								</button>
							</div>
							
							{#if isLoadingReviewWords}
								<div class="mt-4 p-4 bg-tile-300 rounded-lg text-center">
									<p class="text-text-200">Loading your words...</p>
								</div>
							{:else if reviewWordsError}
								<div class="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg">
									<p class="text-rose-300 text-sm">{reviewWordsError}</p>
								</div>
							{:else if reviewWords.length > 0}
								<div class="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
									<p class="text-emerald-300 font-medium">
										✓ {reviewWords.length} word{reviewWords.length !== 1 ? 's' : ''} ready for practice
									</p>
								</div>
							{/if}
						</div>
					</div>

					<!-- Difficulty Selection -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="p-4 border-b border-tile-600">
							<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
								<span>📊</span> Difficulty Level
							</h3>
						</div>
						<div class="p-6">
							<div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
								{#each difficultyOptions as diff}
									<button
										type="button"
										onclick={() => option = diff.value}
										class="p-3 rounded-lg border-2 transition-all duration-200 text-center {option === diff.value ? 'border-white/50 shadow-lg scale-105' : 'border-transparent opacity-70 hover:opacity-100'} {diff.color}"
									>
										<span class="block text-lg font-bold text-white">{diff.label}</span>
										<span class="block text-xs text-white/80">{diff.sublabel}</span>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Submit Button -->
					<div class="pt-4">
						{#if !data.session}
							<Tooltip text="An account is required to access this feature">
								<button 
									type="submit" 
									disabled={true}
									class="w-full py-4 text-xl font-bold bg-tile-500 text-text-200 rounded-lg opacity-50 cursor-not-allowed"
								>
									Generate Sentences
								</button>
							</Tooltip>
							<p class="text-center text-text-200 mt-4">
								<a href="/login" class="text-sky-400 hover:text-sky-300 font-semibold">Log in</a> or <a href="/signup" class="text-sky-400 hover:text-sky-300 font-semibold">sign up</a> to start practicing
							</p>
						{:else}
							<button 
								type="submit" 
								disabled={useReviewWordsOnly && (reviewWords.length === 0 || isLoadingReviewWords)}
								class="w-full py-4 text-xl font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
							>
								📝 Generate Sentences
							</button>
						{/if}
					</div>

				{:else}
					<!-- Standard Generation Mode -->
					
					<!-- Dialect Selection -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="p-4 border-b border-tile-600">
							<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
								<span>🌍</span> Select Dialect
							</h3>
						</div>
						<div class="p-6">
							<div class="grid grid-cols-2 gap-3">
								{#each dialectOptions as dialectOption}
									<button
										type="button"
										onclick={() => selectedDialect = dialectOption.value}
										class="flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 text-left {selectedDialect === dialectOption.value ? 'bg-tile-500 border-tile-400 shadow-md' : 'bg-tile-300 border-tile-600 hover:bg-tile-300/70 hover:border-tile-500'}"
									>
										<span class="text-2xl">{dialectOption.emoji}</span>
										<span class="font-semibold text-text-300">{dialectOption.label}</span>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Difficulty Selection -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="p-4 border-b border-tile-600">
							<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
								<span>📊</span> Difficulty Level
							</h3>
						</div>
						<div class="p-6">
							<div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
								{#each difficultyOptions as diff}
									<button
										type="button"
										onclick={() => option = diff.value}
										class="p-3 rounded-lg border-2 transition-all duration-200 text-center {option === diff.value ? 'border-white/50 shadow-lg scale-105' : 'border-transparent opacity-70 hover:opacity-100'} {diff.color}"
									>
										<span class="block text-lg font-bold text-white">{diff.label}</span>
										<span class="block text-xs text-white/80">{diff.sublabel}</span>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Learning Topics -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="p-4 border-b border-tile-600">
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
									<span>🎯</span> Focus Topics
									<span class="text-sm font-normal text-text-200">(optional)</span>
								</h3>
								{#if selectedLearningTopics.length > 0}
									<button
										type="button"
										onclick={() => selectedLearningTopics = []}
										class="text-xs text-rose-400 hover:text-rose-300 font-semibold"
									>
										Clear all
									</button>
								{/if}
							</div>
						</div>
						<div class="p-6">
							<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
								{#each learningTopicOptions as topic}
									<button
										type="button"
										onclick={() => toggleLearningTopic(topic.value)}
										class="flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 text-left {selectedLearningTopics.includes(topic.value) ? 'bg-sky-600 border-sky-500 text-white' : 'bg-tile-300 border-tile-600 text-text-300 hover:bg-tile-300/70'}"
									>
										<span>{topic.emoji}</span>
										<span class="text-sm font-medium">{topic.label}</span>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Vocabulary Input -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="p-4 border-b border-tile-600">
							<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
								<span>📝</span> Custom Vocabulary
								<span class="text-sm font-normal text-text-200">(optional)</span>
							</h3>
						</div>
						<div class="p-6">
							<!-- Input Mode Toggle -->
							<div class="flex p-1 bg-tile-300 rounded-lg w-fit mb-4 border border-tile-600">
								<button
									type="button"
									onclick={() => { vocabularyInputMode = 'text'; vocabularyFile = null; fileError = ''; }}
									class="px-4 py-2 text-sm rounded-md transition-all duration-200 font-semibold {vocabularyInputMode === 'text' ? 'bg-tile-500 text-text-300 shadow-sm' : 'text-text-200 hover:text-text-300'}"
								>
									✍️ Text
								</button>
								<button
									type="button"
									onclick={() => { vocabularyInputMode = 'file'; vocabularyWords = ''; }}
									class="px-4 py-2 text-sm rounded-md transition-all duration-200 font-semibold {vocabularyInputMode === 'file' ? 'bg-tile-500 text-text-300 shadow-sm' : 'text-text-200 hover:text-text-300'}"
								>
									📂 File
								</button>
							</div>

							{#if vocabularyInputMode === 'text'}
								<textarea
									bind:value={vocabularyWords}
									rows="3"
									class="w-full rounded-lg border-2 border-tile-600 bg-tile-300 py-3 px-4 text-text-300 resize-none focus:border-tile-500 focus:ring-0 transition-colors text-lg placeholder:text-text-200/50"
									placeholder="Enter words separated by commas (e.g., بيت, مدرسة, طعام)"
								></textarea>
							{:else}
								<div class="p-8 border-2 border-dashed border-tile-600 rounded-lg bg-tile-300/50 text-center hover:bg-tile-300 transition-colors relative group cursor-pointer">
									<input
										type="file"
										accept=".txt,.csv"
										onchange={handleFileChange}
										class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
									/>
									<div class="flex flex-col items-center justify-center gap-2">
										<span class="text-4xl group-hover:scale-110 transition-transform duration-300">📄</span>
										<p class="text-lg font-bold text-text-300">Drop your file here</p>
										<p class="text-sm text-text-200">or click to browse</p>
										<span class="text-xs text-text-200 bg-tile-400 px-3 py-1 rounded-full mt-2">TXT or CSV (max 150KB)</span>
									</div>
								</div>
								{#if vocabularyFile}
									<div class="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-300">
										<span>✓</span>
										<span class="font-medium">{vocabularyFile.name}</span>
										<span class="text-sm opacity-70">({Math.round(vocabularyFile.size / 1024)}KB)</span>
									</div>
								{/if}
								{#if fileError}
									<div class="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-300">
										<span>⚠️</span>
										<span>{fileError}</span>
									</div>
								{/if}
							{/if}
						</div>
					</div>

					<!-- Practice Mode -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="p-4 border-b border-tile-600">
							<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
								<span>✍️</span> Practice Mode
							</h3>
						</div>
						<div class="p-6">
							<div class="grid grid-cols-2 gap-3">
								<button
									type="button"
									onclick={() => mode = 'write'}
									class="p-4 rounded-lg border-2 transition-all duration-200 text-center {mode === 'write' ? 'bg-tile-500 border-tile-400 shadow-md' : 'bg-tile-300 border-tile-600 hover:bg-tile-300/70'}"
								>
									<span class="block text-2xl mb-2">✍️</span>
									<span class="font-semibold text-text-300">Practice Writing</span>
								</button>
								<button
									type="button"
									onclick={() => mode = 'quiz'}
									class="p-4 rounded-lg border-2 transition-all duration-200 text-center {mode === 'quiz' ? 'bg-tile-500 border-tile-400 shadow-md' : 'bg-tile-300 border-tile-600 hover:bg-tile-300/70'}"
								>
									<span class="block text-2xl mb-2">🧩</span>
									<span class="font-semibold text-text-300">Multiple Choice Quiz</span>
								</button>
							</div>
						</div>
					</div>

					<!-- Submit Button -->
					<div class="pt-4">
						{#if !data.session}
							<Tooltip text="An account is required to access this feature">
								<button 
									type="submit" 
									disabled={true}
									class="w-full py-4 text-xl font-bold bg-tile-500 text-text-200 rounded-lg opacity-50 cursor-not-allowed"
								>
									Generate Sentences
								</button>
							</Tooltip>
							<p class="text-center text-text-200 mt-4">
								<a href="/login" class="text-sky-400 hover:text-sky-300 font-semibold">Log in</a> or <a href="/signup" class="text-sky-400 hover:text-sky-300 font-semibold">sign up</a> to start practicing
							</p>
						{:else}
							<button 
								type="submit" 
								class="w-full py-4 text-xl font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
							>
								📝 Generate Sentences
							</button>
						{/if}
					</div>
				{/if}
			</form>
		</div>
	</section>
{/if}

{#if isLoading}
	<div class="px-4 mt-12 sm:px-8 max-w-3xl mx-auto min-h-[60vh] flex items-center justify-center">
		<div class="flex flex-col items-center text-center gap-6 max-w-md">
			<AlphabetCycle />
			<div class="flex flex-col gap-3">
				<h2 class="text-2xl font-bold text-text-300">
					Generating Sentences...
				</h2>
				<p class="text-text-200 text-lg">
					Creating {dialectOptions.find(d => d.value === selectedDialect)?.label} sentences tailored to your level.
					<span class="block mt-2 text-sm opacity-75">This may take up to a minute.</span>
				</p>
			</div>
			
			<div class="bg-tile-300 border border-tile-500 rounded-xl p-4 text-left w-full mt-4 shadow-sm">
				<div class="flex items-start gap-3">
					<span class="text-2xl">💡</span>
					<div>
						<p class="font-bold text-text-300 text-sm mb-1">Pro Tip</p>
						<p class="text-text-200 text-sm">
							You can leave this page and continue using the app. We'll notify you when your sentences are ready!
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else if sentences.length > 0 && index < sentences.length && !hasReachedLimit}
	<div class="min-h-screen flex flex-col">
		<header class="sticky top-0 z-10 border-b border-tile-600 bg-tile-400/95 backdrop-blur-sm shadow-md">
			<div class="max-w-7xl mx-auto px-4 sm:px-8 py-4">
				<div class="flex w-full items-center justify-between">
					<div class="w-24">
						{#if index > 0}
							<Button onClick={previous} type="button" className="!py-1.5 !px-3 text-sm shadow-sm">Previous</Button>
						{/if}
					</div>
					<div class="text-center">
						<h1 class="text-lg font-bold text-text-300 flex items-center gap-2 justify-center">
							<span>Sentence {index + 1}</span>
							<span class="text-text-200 font-normal">of</span>
							<span>{sentences.length}</span>
						</h1>
						<p class="text-xs text-text-200 font-medium uppercase tracking-wider mt-0.5">{dialectOptions.find(d => d.value === selectedDialect)?.label}</p>
					</div>
					<div class="w-24 flex justify-end gap-2">
						{#if index < sentences.length - 1}
							<Button onClick={next} type="button" className="!py-1.5 !px-3 text-sm shadow-sm">Next</Button>
						{/if}
						{#if isLastSentence && !isLoading}
							{#if !data.session}
								<Tooltip text="An account is required to access this feature">
									<Button 
										onClick={loadMoreSentences} 
										type="button"
										disabled={true}
										className="!py-1.5 !px-3 text-sm shadow-sm opacity-50 cursor-not-allowed"
									>
										More
									</Button>
								</Tooltip>
							{:else}
								<Button onClick={loadMoreSentences} type="button" className="!py-1.5 !px-3 text-sm shadow-sm">
									More
								</Button>
							{/if}
						{/if}
					</div>
				</div>
			</div>
		</header>

		<main class="flex-grow bg-tile-300">
			{#if mode === 'write'}
				<section class="px-4 sm:px-8 max-w-7xl mx-auto py-8">
					<SentenceBlock {sentence} {resetSentences} dialect={selectedDialect as Dialect} />
				</section>
			{/if}

			{#if mode === 'quiz'}
				<section class="px-4 sm:px-8 max-w-7xl mx-auto py-8">
					<SentenceQuiz {sentences} {index} {resetSentences} />
				</section>
			{/if}
		</main>
	</div>
{/if}