<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
	import { goto } from '$app/navigation';
	import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
	import { type Dialect } from '$lib/types/index';
	import { toast } from 'svelte-sonner';
	import { showLessonCreationToast, showLessonSuccessToast, showErrorToast } from '$lib/helpers/toast-helpers';

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
		}
	}

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
		
		// Prepare data for background generation
		const generationData = {
			topic,
			dialect,
			level,
			selectedLearningTopics,
			vocabularyWords,
			vocabularyInputMode,
			vocabularyFile,
			subLessonCount
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
					subLessonCount: data.subLessonCount
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
				errorDetails = 'The AI generated content in an unexpected format. This is usually temporary. Please try again, and if the issue persists, try adjusting your topic or reducing the sub-lesson count.';
			} else if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
				generationError = 'Connection Error';
				errorDetails = 'Unable to reach the server. Please check your internet connection and try again.';
			} else if (errorMsg.includes('timeout') || errorMsg.includes('time out')) {
				generationError = 'Request Timeout';
				errorDetails = 'The generation took too long. Try creating a simpler lesson or reducing the number of sub-lessons.';
			} else if (errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
				generationError = 'Service Limit Reached';
				errorDetails = 'Too many requests in a short time. Please wait a moment and try again.';
			} else {
				generationError = 'Generation Failed';
				errorDetails = errorMsg || 'An unexpected error occurred. Please try again. If the problem persists, try simplifying your request or reducing the sub-lesson count.';
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

	function toggleLearningTopic(topic: string) {
		if (selectedLearningTopics.includes(topic)) {
			selectedLearningTopics = selectedLearningTopics.filter((t: string) => t !== topic);
		} else {
			selectedLearningTopics = [...selectedLearningTopics, topic];
		}
	}

	const dialectName: Record<Dialect, string> = {
		fusha: 'Modern Standard Arabic',
		darija: 'Moroccan Darija',
		'egyptian-arabic': 'Egyptian Arabic',
	};

	const learningTopicOptions = [
		'verb conjugation',
		'noun plurals',
		'past tense',
		'present tense',
		'infinitive',
		'numbers',
		'future tense',
		'possessive suffixes'
	];

	const levelOptions = [
		{ value: 'beginner', label: 'Beginner' },
		{ value: 'intermediate', label: 'Intermediate' },
		{ value: 'advanced', label: 'Advanced' }
	];

	const subLessonCountOptions = [
		{ value: 2, label: '2 sub-lessons (Quick)' },
		{ value: 3, label: '3 sub-lessons (Standard)' },
		{ value: 4, label: '4 sub-lessons (Comprehensive)' },
		{ value: 5, label: '5 sub-lessons (In-depth)' }
	];
</script>

<Modal {isOpen} handleCloseModal={closeModal} width="700px" height={isLoading ? "fit-content" : "90%"}>
	<div class="p-4">
		{#if isLoading}
			<div
				class="mx-auto my-4 flex w-fit flex-col items-center gap-3 p-4 text-text-200 sm:flex-row"
			>
				<AlphabetCycle />
				<div class="flex flex-col gap-2">
					<p class="text-2xl text-text-300">
						{#if dialect === 'darija'}
							Generating your lesson using an LLM adapted specifically for Moroccan Darija.
						{:else if dialect === 'egyptian-arabic'}
							Generating your lesson using an LLM adapted specifically for Egyptian Arabic.
						{:else}
							Generating your {dialectName[dialect]} lesson, hang tight.
						{/if}
					</p>
					<p class="text-xl text-text-200">
						{#if dialect === 'darija' || dialect === 'egyptian-arabic'}
							This usually takes up to 2 minutes.
						{:else}
							This usually takes a few seconds.
						{/if}
					</p>
					<p class="text-lg text-text-200 bg-tile-400 p-3 rounded border border-tile-500">
						💡 <strong>Tip:</strong> You can close this modal and continue using the app. We'll notify you with a toast when your lesson is ready!
					</p>
				</div>
			</div>
		{:else}
			<h1 class="text-2xl font-semibold text-text-300">Create {dialectName[dialect]} Lesson</h1>
			<p>
				<i>Lessons are AI generated in {dialectName[dialect]} and may contain mistakes</i>
			</p>
			
			<!-- Error Message Display -->
			{#if generationError}
				<div class="mt-4 p-4 border-2 border-red-400 bg-red-50 rounded-lg">
					<div class="flex items-start gap-3">
						<div class="flex-shrink-0 mt-1">
							<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
						</div>
						<div class="flex-1">
							<h3 class="text-lg font-semibold text-red-700 mb-1">{generationError}</h3>
							<p class="text-sm text-red-600">{errorDetails}</p>
							<button
								type="button"
								onclick={() => { generationError = ''; errorDetails = ''; }}
								class="mt-3 text-sm text-red-700 hover:text-red-800 underline"
							>
								Dismiss
							</button>
						</div>
					</div>
				</div>
			{/if}
			
			<form onsubmit={handleSubmit}>
				<!-- Topic Input -->
				<div class="mt-4 flex flex-col">
					<label for="topic" class="text-text-200">
						What topic should the lesson cover?
					</label>
					<textarea
						name="topic"
						bind:value={topic}
						id="topic"
						rows="3"
						class="rounded-0 border border-tile-600 bg-tile-200 py-2 px-2 text-text-300 resize-none"
						placeholder="e.g., Greetings and introductions, Numbers 1-20, Food and dining, etc."
					></textarea>
					<p class="text-xs text-text-200 mt-1">
						Describe the main topic or theme for your lesson
					</p>
				</div>

				<!-- Level Selection -->
				<div class="mt-4 flex flex-col gap-2">
					<p class="text-md text-text-300">Select difficulty level:</p>
					<div class="flex gap-4">
						{#each levelOptions as levelOption}
							<RadioButton
								className="!text-lg"
								wrapperClass="!p-2"
								onClick={setLevel}
								selectableFor={levelOption.value}
								isSelected={level === levelOption.value}
								value={levelOption.value}
								text={levelOption.label}
							/>
						{/each}
					</div>
				</div>

				<!-- Sub-lesson Count Selection -->
				<div class="mt-4 flex flex-col gap-2">
					<p class="text-md text-text-300">Number of sub-lessons:</p>
					<div class="flex gap-2 flex-wrap">
						{#each subLessonCountOptions as option}
							<RadioButton
								className="!text-sm"
								wrapperClass="!p-2"
								onClick={(e) => subLessonCount = parseInt(e.target.value)}
								selectableFor={option.value.toString()}
								isSelected={subLessonCount === option.value}
								value={option.value.toString()}
								text={option.label}
							/>
						{/each}
					</div>
				</div>

				<!-- Learning Topics Selection -->
				<div class="mt-4 flex flex-col gap-2">
					<p class="text-md text-text-300">Focus on specific language topics (optional):</p>
					<p class="text-sm text-text-200">Select multiple topics to emphasize in your lesson</p>
					<div class="grid grid-cols-2 gap-2">
						{#each learningTopicOptions as topicOption}
							<button
								type="button"
								class="text-left p-2 border border-tile-600 bg-tile-200 hover:bg-tile-400 transition-colors text-text-300 text-sm {selectedLearningTopics.includes(topicOption) ? 'bg-tile-500 border-tile-400' : ''}"
								onclick={() => toggleLearningTopic(topicOption)}
							>
								<span class="mr-2">{selectedLearningTopics.includes(topicOption) ? '✓' : ''}</span>
								{topicOption}
							</button>
						{/each}
					</div>
					{#if selectedLearningTopics.length > 0}
						<div class="text-sm text-text-200">
							Selected: {selectedLearningTopics.join(', ')}
							<button
								type="button"
								class="ml-2 underline hover:text-text-300"
								onclick={() => selectedLearningTopics = []}
							>
								Clear all
							</button>
						</div>
					{/if}
				</div>

				<!-- Vocabulary Words Input -->
				<div class="mt-4 flex flex-col gap-2">
					<p class="text-md text-text-300">Include specific vocabulary words (optional):</p>
					<p class="text-sm text-text-200">Enter words you're studying that you'd like featured in your lesson</p>
					
					<!-- Input Mode Toggle -->
					<div class="flex gap-2 mb-3">
						<button
							type="button"
							class="px-3 py-1 text-sm border border-tile-600 transition-colors {vocabularyInputMode === 'text' ? 'bg-tile-500 text-text-300' : 'bg-tile-200 text-text-200 hover:bg-tile-400'}"
							onclick={() => { vocabularyInputMode = 'text'; vocabularyFile = null; fileError = ''; }}
						>
							Text Input
						</button>
						<button
							type="button"
							class="px-3 py-1 text-sm border border-tile-600 transition-colors {vocabularyInputMode === 'file' ? 'bg-tile-500 text-text-300' : 'bg-tile-200 text-text-200 hover:bg-tile-400'}"
							onclick={() => { vocabularyInputMode = 'file'; vocabularyWords = ''; }}
						>
							File Upload
						</button>
					</div>
					
					{#if vocabularyInputMode === 'text'}
						<textarea
							bind:value={vocabularyWords}
							rows="3"
							class="rounded-0 border border-tile-600 bg-tile-200 py-2 px-2 text-text-300 resize-none"
							placeholder="Enter vocabulary words separated by commas (e.g., بيت, مدرسة, طعام, سيارة)"
						></textarea>
						<p class="text-xs text-text-200">
							<strong>Tip:</strong> You can enter words in Arabic, English, or transliteration. Separate multiple words with commas.
						</p>
					{:else}
						<div class="space-y-2">
							<input
								type="file"
								accept=".txt,.csv"
								onchange={handleFileChange}
								class="block w-full text-sm text-text-300 file:mr-4 file:py-2 file:px-4 file:rounded-0 file:border-0 file:text-sm file:font-medium file:bg-tile-400 file:text-text-300 hover:file:bg-tile-500 border border-tile-600 bg-tile-200 p-2"
							/>
							<p class="text-xs text-text-200">
								<strong>Supported formats:</strong> TXT, CSV files (max 150KB)<br/>
								<strong>TXT format:</strong> Words separated by commas, spaces, or new lines<br/>
								<strong>CSV format:</strong> Words in any column, separated by commas
							</p>
							{#if vocabularyFile}
								<p class="text-sm text-green-400">
									✓ File loaded: {vocabularyFile.name} ({Math.round(vocabularyFile.size / 1024)}KB)
								</p>
							{/if}
							{#if fileError}
								<p class="text-sm text-red-400">
									⚠ {fileError}
								</p>
							{/if}
						</div>
					{/if}
				</div>

				<Button type="submit" className="mt-5">Create Lesson</Button>
			</form>
		{/if}
	</div>
</Modal>

<div class="w-fit mt-2">
	{#if !data.session}
		<Button onClick={() => goto('/signup')} type="button">Create your own {dialectName[dialect]} lesson</Button>
	{:else}
		<Button onClick={openModal} type="button">Create your own {dialectName[dialect]} lesson</Button>
	{/if}
</div>

