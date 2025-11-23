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
				<!-- Topic Input -->
				<div class="flex flex-col gap-2">
					<label for="topic" class="text-sm font-bold text-text-300">
						Lesson Topic
					</label>
					<textarea
						name="topic"
						bind:value={topic}
						id="topic"
						rows="3"
						class="w-full rounded-lg border border-tile-500 bg-tile-300 p-3 text-text-300 placeholder:text-text-200/50 focus:border-tile-600 focus:ring-1 focus:ring-tile-600 resize-none transition-all"
						placeholder="e.g., Ordering coffee at a cafe, Meeting new friends, Weekend plans..."
					></textarea>
					<p class="text-xs text-text-200 opacity-80">
						Describe the main theme or situation you want to practice.
					</p>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
					<!-- Level Selection -->
					<div class="flex flex-col gap-2">
						<label class="text-sm font-bold text-text-300">Difficulty Level</label>
						<div class="flex flex-col gap-2">
							{#each levelOptions as levelOption}
								<RadioButton
									className="!text-sm !font-medium"
									wrapperClass="!p-2.5 !rounded-lg hover:bg-tile-400/50 transition-colors"
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
					<div class="flex flex-col gap-2">
						<label class="text-sm font-bold text-text-300">Lesson Length</label>
						<div class="flex flex-col gap-2">
							{#each subLessonCountOptions as option}
								<RadioButton
									className="!text-sm"
									wrapperClass="!p-2.5 !rounded-lg hover:bg-tile-400/50 transition-colors"
									onClick={(e) => subLessonCount = parseInt(e.target.value)}
									selectableFor={option.value.toString()}
									isSelected={subLessonCount === option.value}
									value={option.value.toString()}
									text={option.label}
								/>
							{/each}
						</div>
					</div>
				</div>

				<!-- Learning Topics Selection -->
				<div class="flex flex-col gap-2">
					<label class="text-sm font-bold text-text-300">
						Grammar Focus <span class="font-normal text-text-200 text-xs ml-1">(Optional)</span>
					</label>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
						{#each learningTopicOptions as topicOption}
							<button
								type="button"
								class="text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-200
									{selectedLearningTopics.includes(topicOption) 
										? 'bg-tile-500 border-tile-600 text-text-300 shadow-sm' 
										: 'bg-tile-300 border-tile-500 text-text-200 hover:border-tile-600 hover:text-text-300'}"
								onclick={() => toggleLearningTopic(topicOption)}
							>
								<div class="flex items-center gap-2">
									<div class="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">
										{#if selectedLearningTopics.includes(topicOption)}✓{/if}
									</div>
									{topicOption}
								</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- Vocabulary Words Input -->
				<div class="flex flex-col gap-3 rounded-xl bg-tile-400/30 p-4 border border-tile-500/50">
					<div class="flex justify-between items-center">
						<label class="text-sm font-bold text-text-300">
							Custom Vocabulary <span class="font-normal text-text-200 text-xs ml-1">(Optional)</span>
						</label>
						
						<!-- Input Mode Toggle -->
						<div class="flex bg-tile-300 rounded-lg p-1 border border-tile-500">
							<button
								type="button"
								class="px-3 py-1 text-xs font-medium rounded-md transition-all {vocabularyInputMode === 'text' ? 'bg-tile-500 text-text-300 shadow-sm' : 'text-text-200 hover:text-text-300'}"
								onclick={() => { vocabularyInputMode = 'text'; vocabularyFile = null; fileError = ''; }}
							>
								Text
							</button>
							<button
								type="button"
								class="px-3 py-1 text-xs font-medium rounded-md transition-all {vocabularyInputMode === 'file' ? 'bg-tile-500 text-text-300 shadow-sm' : 'text-text-200 hover:text-text-300'}"
								onclick={() => { vocabularyInputMode = 'file'; vocabularyWords = ''; }}
							>
								File Upload
							</button>
						</div>
					</div>
					
					{#if vocabularyInputMode === 'text'}
						<textarea
							bind:value={vocabularyWords}
							rows="2"
							class="w-full rounded-lg border border-tile-500 bg-tile-300 p-3 text-sm text-text-300 placeholder:text-text-200/50 focus:border-tile-600 focus:ring-1 focus:ring-tile-600 resize-none"
							placeholder="e.g., house, car, food (comma separated)"
						></textarea>
					{:else}
						<div class="relative">
							<input
								type="file"
								accept=".txt,.csv"
								onchange={handleFileChange}
								class="block w-full text-sm text-text-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-tile-500 file:text-text-300 hover:file:bg-tile-600 cursor-pointer"
							/>
							{#if vocabularyFile}
								<p class="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
									✓ {vocabularyFile.name}
								</p>
							{/if}
							{#if fileError}
								<p class="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
									⚠ {fileError}
								</p>
							{/if}
						</div>
					{/if}
				</div>

				<div class="pt-2">
					<Button type="submit" className="w-full py-3 text-base font-bold shadow-md hover:shadow-lg transition-all">
						Create Lesson
					</Button>
				</div>
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