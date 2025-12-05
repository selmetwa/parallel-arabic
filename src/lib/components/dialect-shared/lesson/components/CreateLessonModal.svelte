<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
	import { goto } from '$app/navigation';
	import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
	import { type Dialect } from '$lib/types/index';
	import { toast } from 'svelte-sonner';
	import { showLessonCreationToast, showLessonSuccessToast, showErrorToast } from '$lib/helpers/toast-helpers';
	import { fetchUserReviewWords } from '$lib/helpers/fetch-review-words';

	interface Props {
		dialect: Dialect;
		data: any;
	}

	const { data, dialect }: Props = $props();

	let isOpen = $state(false);
	let topic = $state('');
	let level = $state<'beginner' | 'intermediate' | 'advanced'>('beginner');
	let isLoading = $state(false);
	let selectedLearningTopics = $state<string[]>([]);
	let vocabularyWords = $state('');
	let vocabularyInputMode = $state('text'); // 'text' or 'file'
	let vocabularyFile = $state<File | null>(null);
	let fileError = $state('');
	let subLessonCount = $state(3);
	let generationError = $state('');
	let errorDetails = $state('');

	// Review words only mode
	let useReviewWordsOnly = $state(false);
	let reviewWordsSource = $state<'all' | 'due-for-review'>('all');
	let reviewWords = $state<Array<{ arabic: string; english: string; transliteration: string }>>([]);
	let isLoadingReviewWords = $state(false);
	let reviewWordsError = $state('');

	function openModal() {
		if (!data.session) {
			goto('/signup');
		}
		isOpen = true;
	}

	function closeModal() {
		isOpen = false;
		// Reset form state when modal is closed (but don't interrupt ongoing generation)
		if (!isLoading) {
			topic = '';
			vocabularyWords = '';
			selectedLearningTopics = [];
			vocabularyFile = null;
			fileError = '';
			generationError = '';
			errorDetails = '';
			subLessonCount = 3;
			level = 'beginner';
			useReviewWordsOnly = false;
			reviewWordsSource = 'all';
			reviewWords = [];
			reviewWordsError = '';
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
      console.log('words', words);
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
		if (useReviewWordsOnly && isOpen && data.user?.id) {
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
				toast.error('File too large', {
					description: 'Vocabulary file must be less than 150KB. Please reduce file size and try again.',
					duration: Infinity
				});
				return;
			}
			
			// Check file type
			const allowedTypes = ['text/plain', 'text/csv', 'application/csv'];
			const fileExtension = file.name.toLowerCase().split('.').pop();
			
			if (!allowedTypes.includes(file.type) && !['txt', 'csv'].includes(fileExtension || '')) {
				fileError = 'Only TXT and CSV files are allowed';
				vocabularyFile = null;
				toast.error('Invalid file type', {
					description: 'Only TXT and CSV files are allowed for vocabulary lists. Please select a different file.',
					duration: Infinity
				});
				return;
			}
			
			vocabularyFile = file;
			toast.success('Vocabulary file loaded', {
				description: `Successfully loaded ${file.name} (${Math.round(file.size / 1024)}KB)`,
				duration: 3000
			});
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

	async function handleSubmit(event: any) {
		event.preventDefault();
		
		// Clear any previous errors
		generationError = '';
		errorDetails = '';
		
		// Validate review words mode
		if (useReviewWordsOnly && reviewWords.length === 0) {
			reviewWordsError = `You don't have any ${reviewWordsSource === 'all' ? 'saved words' : 'words due for review'} yet. Add words to your review deck first.`;
			return;
		}
		
		// Prepare data for background generation
		const generationData = {
			topic,
			dialect,
			level,
			selectedLearningTopics,
			vocabularyWords,
			vocabularyInputMode,
			vocabularyFile,
			subLessonCount,
			useReviewWordsOnly,
			reviewWordsSource,
			reviewWords
		};
		
		// Show loading state and keep modal open
		isLoading = true;
		
		// Show initial processing toast
		const processingToastId = showLessonCreationToast(dialect);
		
		// Continue generation (modal stays open)
		generateLessonInBackground(generationData, processingToastId);
	}

	async function generateLessonInBackground(data: any, processingToastId: any) {
		try {
			let finalVocabularyWords = data.vocabularyWords;
			
			// If file mode is selected and a file is uploaded, process it
			if (data.vocabularyInputMode === 'file' && data.vocabularyFile) {
				try {
					finalVocabularyWords = await processVocabularyFile(data.vocabularyFile);
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : 'Failed to process vocabulary file';
					showErrorToast(processingToastId, 'Failed to process vocabulary file', errorMsg);
					return;
				}
			}
			
			const res = await fetch('/api/create-lesson', {
				method: 'POST',
				headers: { accept: 'application/json' },
				body: JSON.stringify({
					topic: data.topic,
					dialect: data.dialect,
					level: data.level,
					learningTopics: data.selectedLearningTopics,
					vocabularyWords: finalVocabularyWords,
					subLessonCount: data.subLessonCount,
					useReviewWordsOnly: data.useReviewWordsOnly || false,
					reviewWordsSource: data.reviewWordsSource || 'all',
					reviewWords: data.reviewWords || []
				})
			});

			const result = await res.json();

			if (!res.ok) {
				throw new Error(result.error || 'Failed to create lesson');
			}

			if (!result.lessonId) {
				throw new Error('Lesson created but no lesson ID returned');
			}

			// Success! Show success toast
			showLessonSuccessToast(processingToastId, result.lessonId);
			
			// Reset loading states and close modal
			isLoading = false;
			closeModal();
			
			// Redirect to the lesson page
			goto(`/lessons/${result.lessonId}`);
		} catch (error) {
			console.error('Error creating lesson:', error);
			
			// Parse and display user-friendly error messages
			const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
			
			// Set user-friendly error messages based on error type
			if (errorMsg.includes('Failed to parse JSON')) {
				generationError = 'AI Response Format Error';
				errorDetails = 'The AI generated content in an unexpected format. This is usually temporary. Please try again, and if the issue persists, try adjusting your topic or selecting a shorter lesson length.';
			} else if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
				generationError = 'Connection Error';
				errorDetails = 'Unable to reach the server. Please check your internet connection and try again.';
			} else if (errorMsg.includes('timeout') || errorMsg.includes('time out')) {
				generationError = 'Request Timeout';
				errorDetails = 'The generation took too long. Try creating a simpler lesson or selecting a shorter lesson length.';
			} else if (errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
				generationError = 'Service Limit Reached';
				errorDetails = 'Too many requests in a short time. Please wait a moment and try again.';
			} else {
				generationError = 'Generation Failed';
				errorDetails = errorMsg || 'An unexpected error occurred. Please try again. If the problem persists, try simplifying your request or selecting a shorter lesson length.';
			}
			
			// Show error toast
			showErrorToast(processingToastId, generationError, errorDetails);
			
			// Reset loading states but keep modal open so user can see error and try again
			isLoading = false;
		}
	}

	function setLevel(event: any) {
		level = event.target.value as 'beginner' | 'intermediate' | 'advanced';
	}

	function toggleLearningTopic(topicValue: string) {
		if (selectedLearningTopics.includes(topicValue)) {
			selectedLearningTopics = selectedLearningTopics.filter((t: string) => t !== topicValue);
		} else {
			selectedLearningTopics = [...selectedLearningTopics, topicValue];
		}
	}

	const dialectName: Record<Dialect, string> = {
		fusha: 'Modern Standard Arabic',
		darija: 'Moroccan Darija',
		'egyptian-arabic': 'Egyptian Arabic',
    'levantine': 'Levantine Arabic',
	};

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

	const levelOptions = [
		{ value: 'beginner', label: 'Beginner' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' }
	];

	const subLessonCountOptions = [
		{ value: 2, label: 'Quick (~16 steps)' },
		{ value: 3, label: 'Standard (~24 steps)' },
		{ value: 4, label: 'Comprehensive (~32 steps)' },
		{ value: 5, label: 'In-depth (~40 steps)' }
	];
</script>

<Modal {isOpen} handleCloseModal={closeModal} width="700px" height={isLoading ? "fit-content" : "90%"}>
	<div class="p-6">
		{#if isLoading}
			<div class="mx-auto my-8 flex flex-col items-center text-center gap-6 max-w-md">
				<AlphabetCycle />
				<div class="flex flex-col gap-3">
					<h2 class="text-2xl font-bold text-text-300">
						{#if dialect === 'darija'}
							Generating Darija Lesson...
						{:else if dialect === 'egyptian-arabic'}
							Generating Egyptian Arabic Lesson...
						{:else}
							Generating {dialectName[dialect]} Lesson...
						{/if}
					</h2>
					<p class="text-text-200 text-lg">
						Using specialized AI to create a custom lesson just for you.
						<span class="block mt-2 text-sm opacity-75">
							{#if dialect === 'darija' || dialect === 'egyptian-arabic'}
								This usually takes about 1-2 minutes.
							{:else}
								This usually takes a few seconds.
							{/if}
						</span>
					</p>
				</div>
				
				<div class="bg-tile-300 border border-tile-500 rounded-xl p-4 text-left w-full mt-2">
					<div class="flex items-start gap-3">
						<span class="text-2xl">💡</span>
						<div>
							<p class="font-bold text-text-300 text-sm mb-1">Pro Tip</p>
							<p class="text-text-200 text-sm">
								You can close this modal and continue using the app. We'll notify you when your lesson is ready!
							</p>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="mb-6 border-b border-tile-500 pb-4">
				<h1 class="text-2xl font-bold text-text-300 mb-1">Create {dialectName[dialect]} Lesson</h1>
				<p class="text-text-200 text-sm">
					Design a custom AI-generated lesson tailored to your needs.
				</p>
			</div>
			
			<!-- Error Message Display -->
			{#if generationError}
				<div class="mb-6 p-4 border border-red-200 bg-red-50/50 rounded-xl">
					<div class="flex items-start gap-3">
						<div class="flex-shrink-0 text-red-500 mt-0.5">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
						</div>
						<div class="flex-1">
							<h3 class="text-sm font-bold text-red-800 mb-1">{generationError}</h3>
							<p class="text-sm text-red-600 mb-2">{errorDetails}</p>
							<button
								type="button"
								onclick={() => { generationError = ''; errorDetails = ''; }}
								class="text-xs font-medium text-red-700 hover:text-red-800 hover:underline"
							>
								Dismiss
							</button>
						</div>
					</div>
				</div>
			{/if}
			
			<form onsubmit={handleSubmit} class="flex flex-col gap-6">
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
									Generate lessons using words from your review deck. This reinforces vocabulary through contextual practice.
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

					<!-- Difficulty Level -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="p-4 border-b border-tile-600">
							<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
								<span>📊</span> Difficulty Level
							</h3>
						</div>
						<div class="p-6">
							<div class="grid grid-cols-3 gap-3">
								{#each levelOptions as levelOption}
									<button
										type="button"
										onclick={() => level = levelOption.value as 'beginner' | 'intermediate' | 'advanced'}
										class="p-4 rounded-lg border-2 transition-all duration-200 text-center {level === levelOption.value ? 'bg-tile-500 border-tile-400 shadow-md' : 'bg-tile-300 border-tile-600 hover:bg-tile-300/70'}"
									>
										<span class="font-semibold text-text-300">{levelOption.label}</span>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Lesson Length -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="p-4 border-b border-tile-600">
							<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
								<span>📏</span> Lesson Length
							</h3>
						</div>
						<div class="p-6">
							<div class="grid grid-cols-2 gap-3">
								{#each subLessonCountOptions as option}
									<button
										type="button"
										onclick={() => subLessonCount = option.value}
										class="p-4 rounded-lg border-2 transition-all duration-200 text-center {subLessonCount === option.value ? 'bg-tile-500 border-tile-400 shadow-md' : 'bg-tile-300 border-tile-600 hover:bg-tile-300/70'}"
									>
										<span class="font-semibold text-text-300">{option.label}</span>
									</button>
								{/each}
							</div>
						</div>
					</div>

					<!-- Submit Button -->
					<div class="pt-4">
						<Button 
							type="submit" 
							className="w-full py-4 text-xl font-bold shadow-lg hover:shadow-xl transition-all"
							disabled={reviewWords.length === 0 || isLoadingReviewWords}
						>
							📚 Create Lesson
						</Button>
					</div>
				{:else}
					<!-- Standard Generation Mode -->
					
					<!-- Topic Input -->
					<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
						<div class="p-4 border-b border-tile-600">
							<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
								<span>📖</span> Lesson Topic
							</h3>
						</div>
						<div class="p-6">
							<textarea
								name="topic"
								bind:value={topic}
								id="topic"
								rows="3"
								class="w-full rounded-lg border-2 border-tile-600 bg-tile-300 py-3 px-4 text-text-300 placeholder:text-text-200/50 focus:border-tile-500 focus:ring-0 resize-none transition-colors text-lg"
								placeholder="e.g., Ordering coffee at a cafe, Meeting new friends, Weekend plans..."
							></textarea>
							<p class="text-xs text-text-200 mt-2 opacity-80">
								Describe the main theme or situation you want to practice.
							</p>
						</div>
					</div>

					<!-- Level and Length Selection -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<!-- Level Selection -->
						<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
							<div class="p-4 border-b border-tile-600">
								<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
									<span>📊</span> Difficulty Level
								</h3>
							</div>
							<div class="p-6">
								<div class="flex flex-col gap-3">
									{#each levelOptions as levelOption}
										<button
											type="button"
											onclick={() => level = levelOption.value as 'beginner' | 'intermediate' | 'advanced'}
											class="p-4 rounded-lg border-2 transition-all duration-200 text-left {level === levelOption.value ? 'bg-tile-500 border-tile-400 shadow-md' : 'bg-tile-300 border-tile-600 hover:bg-tile-300/70'}"
										>
											<span class="font-semibold text-text-300">{levelOption.label}</span>
										</button>
									{/each}
								</div>
							</div>
						</div>

						<!-- Lesson Length Selection -->
						<div class="bg-tile-400 border-2 border-tile-600 rounded-lg shadow-lg overflow-hidden">
							<div class="p-4 border-b border-tile-600">
								<h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
									<span>📏</span> Lesson Length
								</h3>
							</div>
							<div class="p-6">
								<div class="flex flex-col gap-3">
									{#each subLessonCountOptions as option}
										<button
											type="button"
											onclick={() => subLessonCount = option.value}
											class="p-4 rounded-lg border-2 transition-all duration-200 text-left {subLessonCount === option.value ? 'bg-tile-500 border-tile-400 shadow-md' : 'bg-tile-300 border-tile-600 hover:bg-tile-300/70'}"
										>
											<span class="font-semibold text-text-300">{option.label}</span>
										</button>
									{/each}
								</div>
							</div>
						</div>
					</div>

					<!-- Learning Topics Selection -->
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

					<!-- Vocabulary Words Input -->
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

					<!-- Submit Button -->
					<div class="pt-4">
						<Button type="submit" className="w-full py-4 text-xl font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
							📚 Create Lesson
						</Button>
					</div>
				{/if}
			</form>
		{/if}
	</div>
</Modal>

<div class="w-fit">
	{#if !data.session}
		<Button onClick={() => goto('/signup')} type="button" className="shadow-sm hover:shadow-md transition-all">
			Create New Lesson
		</Button>
	{:else}
		<Button onClick={openModal} type="button" className="shadow-sm hover:shadow-md transition-all">
			Create New Lesson
		</Button>
	{/if}
</div>