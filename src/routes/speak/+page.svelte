<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
	import { currentDialect } from '$lib/store/store';
	import { PUBLIC_PRICE_ID } from '$env/static/public';
	import { goto } from '$app/navigation';
	import { updateUrl } from '$lib/helpers/update-url';
	import SpeakSentence from '$lib/components/dialect-shared/speak/SpeakSentence.svelte';
	import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
	import { type sentenceObjectItem, type Dialect } from '$lib/types/index';
	import { onMount } from 'svelte';
	import { showSentenceGenerationToast, showSpeakSentenceSuccessToast, showSentenceErrorToast } from '$lib/helpers/toast-helpers';
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
			const urlIndex = parseInt(params.get('speak_sentence') ?? '0') || 0;
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
			const savedSentences = localStorage.getItem(`speak_sentence_${selectedDialect}`);
			if (savedSentences) {
				try {
					const parsed = JSON.parse(savedSentences);
					return filterValidSentences(parsed);
				} catch (error) {
					console.error('Error parsing saved sentences from localStorage:', error);
					localStorage.removeItem(`speak_sentence_${selectedDialect}`);
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
	let vocabularyInputMode = $state('text');
	let vocabularyFile = $state<File | null>(null);
	let fileError = $state('');

	// Review words only mode
	let useReviewWordsOnly = $state(false);
	let reviewWordsSource = $state<'all' | 'due-for-review'>('all');
	let reviewWords = $state<Array<{ arabic: string; english: string; transliteration: string }>>([]);
	let isLoadingReviewWords = $state(false);
	let reviewWordsError = $state('');

	let sentencesViewed = $state(data.sentencesViewed);

	// Update sentences when dialect changes
	$effect(() => {
		if (typeof window !== 'undefined') {
			const savedSentences = localStorage.getItem(`speak_sentence_${selectedDialect}`);
			if (savedSentences) {
				try {
					const parsed = JSON.parse(savedSentences);
					sentences = filterValidSentences(parsed);
				} catch (error) {
					console.error('Error parsing saved sentences from localStorage:', error);
					sentences = [];
					localStorage.removeItem(`speak_sentence_${selectedDialect}`);
				}
			} else {
				sentences = [];
			}
			index = 0;
			updateUrl('speak_sentence', '0');
		}
	});

	function toggleLearningTopic(topic: string) {
		if (selectedLearningTopics.includes(topic)) {
			selectedLearningTopics = selectedLearningTopics.filter((t: string) => t !== topic);
		} else {
			selectedLearningTopics = [...selectedLearningTopics, topic];
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
			const maxSize = 150 * 1024;
			if (file.size > maxSize) {
				fileError = 'File size must be less than 150KB';
				vocabularyFile = null;
				return;
			}
			
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
					let words: string[] = [];
					
					if (file.name.toLowerCase().endsWith('.csv')) {
						const lines = text.split('\n');
						words = lines.flatMap((line: string) => 
							line.split(',').map((word: string) => word.trim().replace(/['"]/g, ''))
						).filter((word: string) => word.length > 0);
					} else {
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
		
		const toastId = showSentenceGenerationToast(selectedDialect);
		
		if (useReviewWordsOnly && reviewWords.length === 0) {
			showSentenceErrorToast(toastId, `You don't have any ${reviewWordsSource === 'all' ? 'saved words' : 'words due for review'} yet. Add words to your review deck first.`);
			isLoading = false;
			return;
		}

		let finalVocabularyWords = vocabularyWords;
		
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
			localStorage.setItem(`speak_sentence_${selectedDialect}`, JSON.stringify(updatedSentences));
			
			showSpeakSentenceSuccessToast(toastId, newSentences.length, selectedDialect);
			
		} catch (error) {
			console.error('Error generating sentences:', error);
			const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred while generating sentences. Please try again.';
			
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
		updateUrl('speak_sentence', (index+1).toString());
	}

	function previous() {
		if (index === 0) {
			return;
		}
		index = index - 1;
		updateUrl('speak_sentence', (index+1).toString());
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
		localStorage.removeItem(`speak_sentence_${selectedDialect}`);
		updateUrl('speak_sentence', '0');
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

<section class="min-h-screen bg-tile-300">
	{#if hasReachedLimit && data.session}
		<!-- Subscription Limit Reached -->
		<div class="py-12 sm:py-16">
			<div class="max-w-2xl mx-auto px-4 sm:px-8">
				<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-8 sm:p-12 shadow-lg text-center">
					<div class="text-6xl mb-6">🔒</div>
					<h1 class="text-2xl sm:text-3xl font-bold text-text-300 mb-4">Free Limit Reached</h1>
					<p class="text-lg text-text-200 mb-8 leading-relaxed">
						You've practiced 5 sentences today. Subscribe to unlock unlimited speaking practice and accelerate your Arabic learning.
					</p>
					<form method="POST" action="/?/subscribe">
						<input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
						<button type="submit" class="px-8 py-4 text-lg font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl">
							Subscribe Now →
						</button>
					</form>
				</div>
			</div>
		</div>

	{:else if isError}
		<!-- Error State -->
		<div class="py-12 sm:py-16">
			<div class="max-w-2xl mx-auto px-4 sm:px-8">
				<div class="bg-tile-400 border-2 border-rose-500/50 rounded-lg p-8 sm:p-12 shadow-lg text-center">
					<div class="text-6xl mb-6">⚠️</div>
					<h1 class="text-2xl sm:text-3xl font-bold text-text-300 mb-4">Generation Failed</h1>
					<p class="text-lg text-text-200 mb-8 leading-relaxed">
						{errorMessage}
					</p>
					<button
						onclick={() => { isError = false; errorMessage = ''; }}
						class="px-8 py-4 text-lg font-semibold bg-tile-500 text-text-300 border-2 border-tile-600 rounded-lg hover:bg-tile-600 transition-all duration-300"
					>
						Try Again
					</button>
				</div>
			</div>
		</div>

	{:else if isLoading}
		<!-- Loading State -->
		<div class="py-12 sm:py-16">
			<div class="max-w-2xl mx-auto px-4 sm:px-8">
				<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-12 shadow-lg text-center">
					<div class="scale-150 mb-8">
						<AlphabetCycle />
					</div>
					<h2 class="text-2xl sm:text-3xl font-bold text-text-300 mb-3">
						Generating Your Sentences
					</h2>
					<p class="text-lg text-text-200 mb-2">
						Creating personalized {dialectOptions.find(d => d.value === selectedDialect)?.label} practice...
					</p>
					<p class="text-sm text-text-200/70">This may take up to 30 seconds</p>
				</div>
			</div>
		</div>

	{:else if sentences.length === 0 && !hasReachedLimit}
		<!-- Generation Form -->
		<header class="py-12 sm:py-16 bg-tile-200 border-b border-tile-600">
			<div class="max-w-4xl mx-auto px-4 sm:px-8 text-center">
				<div class="text-6xl mb-6">🎙️</div>
				<h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-300 leading-tight mb-6">
					Speaking Practice
				</h1>
				<p class="text-lg sm:text-xl text-text-200 leading-relaxed max-w-2xl mx-auto">
					Practice your Arabic pronunciation with AI-generated sentences. Get real-time feedback on your speaking.
				</p>
			</div>
		</header>

		<section class="py-12 sm:py-16">
			<div class="max-w-4xl mx-auto px-4 sm:px-8">
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
										<p class="text-emerald-600 font-medium">
											✓ {reviewWords.length} word{reviewWords.length !== 1 ? 's' : ''} ready for practice
										</p>
									</div>
								{/if}
							</div>
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
					{/if}

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

					{#if !useReviewWordsOnly}
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
										<div class="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-600">
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
					{/if}

					<!-- Submit Button -->
					<div class="pt-4">
						{#if !data.session}
							<Tooltip text="An account is required to access this feature">
								<button 
									type="submit" 
									disabled={true}
									class="w-full py-4 text-xl font-bold bg-tile-500 text-text-200 rounded-lg opacity-50 cursor-not-allowed"
								>
									Generate Speaking Sentences
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
								🎙️ Generate Speaking Sentences
							</button>
						{/if}
					</div>
				</form>
			</div>
		</section>

		<!-- Features Section -->
		<section class="py-12 sm:py-16 bg-tile-200 border-t border-tile-600">
			<div class="max-w-4xl mx-auto px-4 sm:px-8">
				<h2 class="text-2xl sm:text-3xl font-bold text-text-300 text-center mb-8">How It Works</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg text-center">
						<div class="text-4xl mb-4">🤖</div>
						<h3 class="text-xl font-bold text-text-300 mb-3">AI-Generated</h3>
						<p class="text-text-200 leading-relaxed">
							Personalized sentences based on your level and chosen topics.
						</p>
					</div>

					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg text-center">
						<div class="text-4xl mb-4">🎯</div>
						<h3 class="text-xl font-bold text-text-300 mb-3">Real-time Feedback</h3>
						<p class="text-text-200 leading-relaxed">
							Instant pronunciation assessment to help you improve.
						</p>
					</div>

					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-6 shadow-lg text-center">
						<div class="text-4xl mb-4">📈</div>
						<h3 class="text-xl font-bold text-text-300 mb-3">Track Progress</h3>
						<p class="text-text-200 leading-relaxed">
							Practice at your own pace and watch your skills grow.
						</p>
					</div>
				</div>
			</div>
		</section>

	{:else if sentences.length > 0 && index < sentences.length && !hasReachedLimit}
		<!-- Practice Mode Header -->
		<header class="py-4 bg-tile-400 border-b border-tile-600 sticky top-0 z-20 shadow-md">
			<div class="max-w-7xl mx-auto px-4 sm:px-8">
				<div class="flex items-center justify-between">
					<div class="w-28">
						{#if index > 0}
							<button 
								onclick={previous} 
								class="flex items-center gap-1 px-4 py-2 bg-tile-500 text-text-300 font-semibold rounded-lg hover:bg-tile-600 transition-colors border border-tile-600"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
								</svg>
								Prev
							</button>
						{/if}
					</div>
					
					<div class="flex flex-col items-center">
						<div class="flex items-center gap-3">
							<span class="px-3 py-1 bg-tile-500 rounded-full text-sm font-bold text-text-300">
								{index + 1} / {sentences.length}
							</span>
						</div>
						<span class="text-xs text-text-200 mt-1">
							{dialectOptions.find(d => d.value === selectedDialect)?.label}
						</span>
					</div>
					
					<div class="w-28 flex justify-end gap-2">
						{#if index < sentences.length - 1}
							<button 
								onclick={next} 
								class="flex items-center gap-1 px-4 py-2 bg-tile-500 text-text-300 font-semibold rounded-lg hover:bg-tile-600 transition-colors border border-tile-600"
							>
								Next
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</button>
						{/if}
						{#if isLastSentence && !isLoading}
							{#if data.session}
								<button 
									onclick={loadMoreSentences}
									class="flex items-center gap-1 px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
									</svg>
									More
								</button>
							{/if}
						{/if}
					</div>
				</div>
			</div>
		</header>

		<SpeakSentence {sentence} {resetSentences} dialect={selectedDialect as Dialect} />
	{/if}
</section>
