<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
	import { goto } from '$app/navigation';
	import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
	import { type Dialect } from '$lib/types/index';
	import { toast } from 'svelte-sonner';
	import { showStoryCreationToast, showStorySuccessToast, showTranscriptionToast, showTranscriptionSuccessToast, showErrorToast } from '$lib/helpers/toast-helpers';
	import PaywallModal from '$lib/components/PaywallModal.svelte';
	import { fetchUserReviewWords } from '$lib/helpers/fetch-review-words';

	let isPaywallModalOpen = $state(false);

	function openPaywallModal() {
		isPaywallModalOpen = true;
	}

	function handleClosePaywallModal() {
		isPaywallModalOpen = false;
	}

	interface Props {
		dialect: Dialect;
		data: any;
	}

	const { data, dialect }: Props = $props();

	let isOpen = $state(false);
	let description = $state('');
	let option = $state('a1');
	let isLoading = $state(false);
	let storyType = $state('story');
	let sentenceCount = $state(25);
	let selectedLearningTopics = $state<string[]>([]);
	let vocabularyWords = $state('');
	let vocabularyInputMode = $state('text'); // 'text' or 'file'
	let vocabularyFile = $state<File | null>(null);
	let fileError = $state('');

	// New audio upload states
	let creationMode = $state<'generate' | 'upload'>('generate');
	let audioFile = $state<File | null>(null);
	let audioFileError = $state('');
	let isDragOver = $state(false);
	let isTranscribing = $state(false);
	let customTitle = $state('');
	let useCustomTitle = $state(false);
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
			description = '';
			vocabularyWords = '';
			selectedLearningTopics = [];
			audioFile = null;
			audioFileError = '';
			fileError = '';
			generationError = '';
			errorDetails = '';
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
				duration: 3000 // Auto-dismiss success notifications after 3 seconds
			});
		} else {
			vocabularyFile = null;
		}
	}

	// Audio file handling functions
	function handleAudioFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			validateAndSetAudioFile(file);
		}
	}

	function handleAudioDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		
		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			validateAndSetAudioFile(files[0]);
		}
	}

	function handleAudioDragOver(event: DragEvent) {
		event.preventDefault();
		isDragOver = true;
	}

	function handleAudioDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
	}

	function validateAndSetAudioFile(file: File) {
		audioFileError = '';
		
		// Check file size (25MB limit for audio)
		const maxSize = 25 * 1024 * 1024; // 25MB
		if (file.size > maxSize) {
			audioFileError = 'Audio file size must be less than 25MB';
			audioFile = null;
			toast.error('Audio file too large', {
				description: 'Audio file must be less than 25MB. Please compress your audio file or select a different one.',
				duration: Infinity
			});
			return;
		}
		
		// Check file type
		const allowedTypes = [
			'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac', 
			'audio/m4a', 'audio/mp4', 'audio/webm', 'audio/ogg'
		];
		
		if (!allowedTypes.includes(file.type)) {
			audioFileError = 'Unsupported file type. Supported formats: MP3, WAV, FLAC, M4A, MP4, WebM, OGG';
			audioFile = null;
			toast.error('Unsupported audio format', {
				description: 'Please select an audio file in one of these formats: MP3, WAV, FLAC, M4A, MP4, WebM, or OGG.',
				duration: Infinity
			});
			return;
		}
		
		audioFile = file;
		
		// Show success toast
		toast.success('Audio file loaded', {
			description: `Successfully loaded ${file.name} (${formatFileSize(file.size)})`,
			duration: 3000 // Auto-dismiss success notifications after 3 seconds
		});
		
		// Auto-generate title from filename if not using custom title
		if (!useCustomTitle) {
			const baseName = file.name.replace(/\.[^/.]+$/, ''); // Remove file extension
			customTitle = baseName.replace(/[-_]/g, ' '); // Replace dashes and underscores with spaces
		}
	}

	function removeAudioFile() {
		audioFile = null;
		audioFileError = '';
		customTitle = '';
	}

	function formatFileSize(bytes: number) {
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(1)} MB`;
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
		
		// Validate inputs first
		if (creationMode === 'upload' && !audioFile) {
			audioFileError = 'Please select an audio file';
			// Show error toast for immediate feedback
			toast.error('Please select an audio file', {
				description: 'You need to upload an Arabic audio file to transcribe',
				duration: Infinity
			});
			return;
		}
		
		// Validate review words mode
		if (useReviewWordsOnly && reviewWords.length === 0) {
			reviewWordsError = `You don't have any ${reviewWordsSource === 'all' ? 'saved words' : 'words due for review'} yet. Add words to your review deck first.`;
			return;
		}
		
		// Prepare data for background generation
		const generationData = {
			creationMode,
			audioFile,
			useCustomTitle,
			customTitle,
			option,
			description,
			dialect,
			storyType,
			sentenceCount,
			selectedLearningTopics,
			vocabularyWords,
			vocabularyInputMode,
			vocabularyFile,
			useReviewWordsOnly,
			reviewWordsSource,
			reviewWords
		};
		
		// Show loading state and keep modal open
		isLoading = true;
		isTranscribing = creationMode === 'upload';
		
		// Show initial processing toast
		const processingToastId = creationMode === 'upload' 
			? showTranscriptionToast()
			: showStoryCreationToast(dialect, storyType);
		
		// Continue generation (modal stays open)
		generateStoryInBackground(generationData, processingToastId);
	}

	async function generateStoryInBackground(data: any, processingToastId: any) {
		try {
			if (data.creationMode === 'upload') {
				// Audio upload mode - transcribe and create story from audio
				if (!data.audioFile) {
					showErrorToast(processingToastId, 'Please select an audio file');
					return;
				}

				// Step 1: Transcribe the audio file
				toast.loading('Transcribing audio...', { id: processingToastId });
				
				const formData = new FormData();
				formData.append('audio', data.audioFile);

				const transcribeResponse = await fetch('/api/audio-transcribe', {
					method: 'POST',
					body: formData,
				});

				const transcriptionData = await transcribeResponse.json();

				if (!transcribeResponse.ok) {
					throw new Error(transcriptionData.error || 'Failed to transcribe audio');
				}

				// Step 2: Create story from transcription
				toast.loading('Creating story from transcription...', { id: processingToastId });
				
				const storyFormData = new FormData();
				storyFormData.append('mode', 'transcription');
				storyFormData.append('transcript', transcriptionData.transcript);
				storyFormData.append('sentences', JSON.stringify(transcriptionData.sentences || []));
				storyFormData.append('dialect', data.dialect);
				storyFormData.append('customTitle', data.useCustomTitle ? data.customTitle : '');
				storyFormData.append('originalFileName', data.audioFile.name);
				storyFormData.append('audioFile', data.audioFile); // Send the actual audio file

				// const API_URL = dialect === 'egyptian-arabic' ? '/api/create-story-egyptian' : '/api/create-story';
				let API_URL = '/api/create-story';
				if (data.dialect === 'egyptian-arabic') {
					API_URL = '/api/create-story-egyptian';
				} else if (data.dialect === 'darija') {
					API_URL = '/api/create-story-darija';
				}

				const createStoryResponse = await fetch(API_URL, {
					method: 'POST',
					body: storyFormData // Send as FormData instead of JSON
				});

				const storyResult = await createStoryResponse.json();
				
				if (!createStoryResponse.ok) {
					throw new Error(storyResult.error || 'Failed to create story from transcription');
				}

				// Success! Show success toast with link (no auto-redirect)
				showTranscriptionSuccessToast(processingToastId, storyResult.storyId);
				
				// Reset loading states and close modal so user can see the success
				isLoading = false;
				isTranscribing = false;
				closeModal();        
			} else {
				// Original AI generation mode
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
				
				let API_URL = '/api/create-story';
				if (data.dialect === 'egyptian-arabic') {
					API_URL = '/api/create-story-egyptian';
				} else if (data.dialect === 'darija') {
					API_URL = '/api/create-story-darija';
				} 
				
				const res = await fetch(API_URL, {
					method: 'POST',
					headers: { accept: 'application/json' },
					body: JSON.stringify({
						option: data.option,
						description: data.description,
						dialect: data.dialect, // Specify dialect for story generation
						storyType: data.storyType,
						sentenceCount: data.sentenceCount,
						learningTopics: data.selectedLearningTopics, // Send selected learning topics
						vocabularyWords: finalVocabularyWords, // Send vocabulary words to feature
						useReviewWordsOnly: data.useReviewWordsOnly || false,
						reviewWordsSource: data.reviewWordsSource || 'all',
						reviewWords: data.reviewWords || []
					})
				});

				const chatgptres = await res.json();

				if (!res.ok) {
					throw new Error(chatgptres.error || 'Failed to create story');
				}

				// Success! Show success toast with link (no auto-redirect)
				showStorySuccessToast(processingToastId, data.storyType, chatgptres.storyId);
				
				// Reset loading states and close modal so user can see the success
				isLoading = false;
				closeModal();
			}
		} catch (error) {
			console.error('Error creating story:', error);
			
			// Parse and display user-friendly error messages
			const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
			
			// Set user-friendly error messages based on error type
			if (errorMsg.includes('Failed to parse JSON')) {
				generationError = 'AI Response Format Error';
				errorDetails = 'The AI generated content in an unexpected format. This is usually temporary. Please try again, and if the issue persists, try adjusting your prompt or reducing the content length.';
			} else if (errorMsg.includes('transcribe')) {
				generationError = 'Transcription Failed';
				errorDetails = errorMsg.includes('Audio file too large') 
					? 'The audio file is too large. Please use a file smaller than 25MB or try compressing it.'
					: 'We couldn\'t transcribe the audio file. Please ensure it contains clear Arabic speech and try again.';
			} else if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
				generationError = 'Connection Error';
				errorDetails = 'Unable to reach the server. Please check your internet connection and try again.';
			} else if (errorMsg.includes('timeout') || errorMsg.includes('time out')) {
				generationError = 'Request Timeout';
				errorDetails = 'The generation took too long. Try creating shorter content or simplifying your request.';
			} else if (errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
				generationError = 'Service Limit Reached';
				errorDetails = 'Too many requests in a short time. Please wait a moment and try again.';
			} else {
				generationError = 'Generation Failed';
				errorDetails = errorMsg || 'An unexpected error occurred. Please try again. If the problem persists, try simplifying your request or reducing the content length.';
			}
			
			// Show error toast
			showErrorToast(processingToastId, generationError, errorDetails);
			
			// Reset loading states but keep modal open so user can see error and try again
			isLoading = false;
			isTranscribing = false;
		}
	}

	function setOption(event: any) {
		option = event.target.value;
	}

	function setStoryType(event: any) {
		storyType = event.target.value;
	}

	function setSentenceCount(event: any) {
		sentenceCount = parseInt(event.target.value);
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
	}

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

	const sentenceOptions = [
		{ value: 15, label: '15 sentences (Short)' },
		{ value: 25, label: '25 sentences (Medium)' },
		{ value: 35, label: '35 sentences (Long)' }
	];

	const difficultyOptions = [
		{ value: 'a1', label: 'A1 (Beginner)' },
		{ value: 'a2', label: 'A2 (Elementary)' },
		{ value: 'b1', label: 'B1 (Intermediate)' },
		{ value: 'b2', label: 'B2 (Upper Intermediate)' },
		{ value: 'c1', label: 'C1 (Advanced)' },
		{ value: 'c2', label: 'C2 (Proficient)' }
	];
</script>

<PaywallModal isOpen={isPaywallModalOpen} handleCloseModal={handleClosePaywallModal}></PaywallModal>

<Modal {isOpen} handleCloseModal={closeModal} width="700px" height={isLoading ? "fit-content" : "90%"}>
	<div class="p-6">
		{#if isLoading}
			<div class="mx-auto my-8 flex flex-col items-center text-center gap-6 max-w-md">
				<AlphabetCycle />
				<div class="flex flex-col gap-3">
					<h2 class="text-2xl font-bold text-text-300">
						{#if dialect === 'darija'}
							Generating Darija {storyType === 'story' ? 'Story' : 'Conversation'}...
						{:else if dialect === 'egyptian-arabic'}
							Generating Egyptian Arabic {storyType === 'story' ? 'Story' : 'Conversation'}...
						{:else}
							Generating {dialectName[dialect]} {storyType === 'story' ? 'Story' : 'Conversation'}...
						{/if}
					</h2>
					<p class="text-text-200 text-lg">
						Using specialized AI to create custom content just for you.
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
								You can close this modal and continue using the app. We'll notify you when your content is ready!
							</p>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="mb-6 border-b border-tile-500 pb-4">
				<h1 class="text-2xl font-bold text-text-300 mb-1">Create {dialectName[dialect]} Content</h1>
				<p class="text-text-200 text-sm">
					Generate original stories and conversations or upload audio to transcribe.
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

				<!-- Review Words Only Toggle - Prominent Feature -->
				<div class="flex flex-col gap-4 bg-gradient-to-br from-tile-400/40 to-tile-500/30 p-5 rounded-xl border-2 border-tile-600/60 shadow-lg">
					<div class="flex items-start justify-between gap-4">
						<div class="flex flex-col gap-2 flex-1">
							<div class="flex items-center gap-2">
								<span class="text-2xl">🎯</span>
								<p class="text-base font-bold text-text-300">Use Review Words Only</p>
							</div>
							<p class="text-sm text-text-200 leading-relaxed">
								<strong class="text-text-300">Context-Based Learning:</strong> Generate content using words you're already learning. This reinforces your memory by seeing words in new contexts, improving retention through spaced repetition. Experience your vocabulary in authentic, meaningful stories and conversations that help you learn faster.
							</p>
						</div>
						<div class="relative flex items-center flex-shrink-0">
							<input
								type="checkbox"
								id="useReviewWordsOnly"
								bind:checked={useReviewWordsOnly}
								class="peer w-6 h-6 cursor-pointer appearance-none rounded border-2 border-tile-600 bg-tile-200 checked:bg-tile-600 checked:border-tile-600 focus:ring-offset-0 focus:ring-2 focus:ring-tile-500 transition-all"
							/>
							<svg class="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1 top-1 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
						</div>
					</div>
				</div>

				{#if useReviewWordsOnly}
					<!-- Review Words Only Mode -->
					<div class="flex flex-col gap-4 bg-tile-400/30 p-4 rounded-xl border border-tile-500/50">
						<!-- Review Words Source Selection -->
						<div class="flex flex-col gap-2">
							<label class="text-sm font-bold text-text-300">Word Source</label>
							<div class="flex gap-4">
								<RadioButton
									className="!text-sm !font-medium"
									wrapperClass="!p-3 !rounded-lg flex-1 hover:bg-tile-400/50 transition-colors"
									onClick={(e) => { reviewWordsSource = e.target.value as 'all' | 'due-for-review'; }}
									selectableFor="all"
									isSelected={reviewWordsSource === 'all'}
									value="all"
									text="All Saved Words"
								/>
								<RadioButton
									className="!text-sm !font-medium"
									wrapperClass="!p-3 !rounded-lg flex-1 hover:bg-tile-400/50 transition-colors"
									onClick={(e) => { reviewWordsSource = e.target.value as 'all' | 'due-for-review'; }}
									selectableFor="due-for-review"
									isSelected={reviewWordsSource === 'due-for-review'}
									value="due-for-review"
									text="Words Due for Review"
								/>
							</div>
						</div>

						<!-- Word Count Display -->
						{#if isLoadingReviewWords}
							<div class="text-sm text-text-200">Loading words...</div>
						{:else if reviewWordsError}
							<div class="p-3 bg-red-50/50 border border-red-200 rounded-lg">
								<p class="text-sm text-red-600">{reviewWordsError}</p>
							</div>
						{:else if reviewWords.length > 0}
							<div class="p-3 bg-tile-300 border border-tile-500 rounded-lg">
								<p class="text-sm font-medium text-text-300">
									{reviewWords.length} word{reviewWords.length !== 1 ? 's' : ''} will be used in your {storyType}
								</p>
							</div>
						{/if}
					</div>

					<!-- Content Type (keep for review words mode) -->
					<div class="flex flex-col gap-2">
						<label class="text-sm font-bold text-text-300">Content Type</label>
						<div class="flex gap-4">
							<RadioButton
								className="!text-sm !font-medium"
								wrapperClass="!p-3 !rounded-lg flex-1 hover:bg-tile-400/50 transition-colors"
								onClick={setStoryType}
								selectableFor="story"
								isSelected={storyType === 'story'}
								value="story"
								text="Story (Narrative)"
							/>
							<RadioButton
								className="!text-sm !font-medium"
								wrapperClass="!p-3 !rounded-lg flex-1 hover:bg-tile-400/50 transition-colors"
								onClick={setStoryType}
								selectableFor="conversation"
								isSelected={storyType === 'conversation'}
								value="conversation"
								text="Conversation (Dialogue)"
							/>
						</div>
					</div>

					<!-- Difficulty Selection (keep for review words mode) -->
					<div class="flex flex-col gap-2">
						<label class="text-sm font-bold text-text-300">Difficulty Level</label>
						<div class="flex flex-col gap-2">
							{#each difficultyOptions as difficultyOption}
								<RadioButton
									className="!text-sm"
									wrapperClass="!p-2 !rounded-lg hover:bg-tile-400/50 transition-colors"
									onClick={setOption}
									selectableFor={difficultyOption.value}
									isSelected={option === difficultyOption.value}
									value={difficultyOption.value}
									text={difficultyOption.label}
								/>
							{/each}
						</div>
					</div>

					<div class="pt-2">
						<Button 
							type="submit" 
							className="w-full py-3 text-base font-bold shadow-md hover:shadow-lg transition-all"
							disabled={reviewWords.length === 0 || isLoadingReviewWords}
						>
							Create {storyType === 'story' ? 'Story' : 'Conversation'}
						</Button>
					</div>
				{:else}
					<!-- Original Generation Mode -->
				<!-- Creation Mode Selection -->
				<div class="flex flex-col gap-3 bg-tile-400/30 p-4 rounded-xl border border-tile-500/50">
					<p class="text-sm font-bold text-text-300">Choose Creation Method</p>
					<div class="flex gap-4">
						<RadioButton
							className="!text-base !font-medium"
							wrapperClass="!p-3 !rounded-lg flex-1 hover:bg-tile-400/50 transition-colors"
							onClick={(e) => creationMode = e.target.value}
							selectableFor="generate"
							isSelected={creationMode === 'generate'}
							value="generate"
							text="✨ AI Generate"
						/>
						<RadioButton
							className="!text-base !font-medium"
							wrapperClass="!p-3 !rounded-lg flex-1 hover:bg-tile-400/50 transition-colors"
							onClick={(e) => creationMode = e.target.value}
							selectableFor="upload"
							isSelected={creationMode === 'upload'}
							value="upload"
							text="🎵 Upload Audio"
						/>
					</div>
					<p class="text-xs text-text-200 opacity-80 pl-1">
						{#if creationMode === 'generate'}
							Create original content customized to your level and interests.
						{:else}
							Transcribe an existing Arabic audio file into an interactive lesson.
						{/if}
					</p>
				</div>

				{#if creationMode === 'upload' && !useReviewWordsOnly}
					<!-- Audio Upload Section -->
					<div class="p-5 border border-tile-500 bg-tile-300 rounded-xl shadow-sm">
						<h3 class="text-lg font-bold text-text-300 mb-2">Upload Arabic Audio</h3>
						<p class="text-sm text-text-200 mb-4 flex items-center gap-2">
							<span class="text-lg">ℹ️</span>
							<span>Use <a href="https://ezconv.com/" class="text-text-300 font-medium hover:underline" target="_blank">ezconv.com</a> to convert YouTube videos to MP3.</span>
						</p>
						
						<!-- Title Input for Audio Mode -->
						<div class="mb-6">
							<div class="flex items-center gap-2 mb-3 cursor-pointer group" onclick={() => useCustomTitle = !useCustomTitle}>
								<div class="relative flex items-center">
									<input
										type="checkbox"
										id="useCustomTitle"
										bind:checked={useCustomTitle}
										class="peer w-4 h-4 cursor-pointer appearance-none rounded border border-tile-600 bg-tile-200 checked:bg-tile-600 checked:border-tile-600 focus:ring-offset-0 focus:ring-1 focus:ring-tile-500 transition-all"
									/>
									<svg class="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5 top-0.5 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
								</div>
								<label for="useCustomTitle" class="text-sm text-text-300 font-medium cursor-pointer select-none group-hover:text-text-200 transition-colors">
									Use custom title
								</label>
							</div>
							
							{#if useCustomTitle}
								<input
									type="text"
									bind:value={customTitle}
									placeholder="Enter custom title for your story..."
									class="w-full rounded-lg border border-tile-500 bg-tile-200 py-2.5 px-3 text-text-300 focus:border-tile-600 focus:ring-1 focus:ring-tile-600 transition-all"
								/>
							{:else if audioFile}
								<p class="text-sm text-text-200 bg-tile-400/30 p-2 rounded-lg border border-tile-500/30">
									Title will be: <span class="font-bold text-text-300">{customTitle}</span>
								</p>
							{/if}
						</div>

						<!-- Audio File Drop Zone -->
						<div
							class="relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 
								{isDragOver ? 'border-blue-400 bg-blue-50/10' : audioFile ? 'border-green-500 bg-green-50/10' : 'border-tile-500 hover:border-tile-600 hover:bg-tile-400/30'}"
							ondrop={handleAudioDrop}
							ondragover={handleAudioDragOver}
							ondragleave={handleAudioDragLeave}
						>
							{#if audioFile}
								<div class="space-y-4">
									<div class="flex items-center justify-center">
										<div class="w-16 h-16 rounded-full bg-green-100/20 flex items-center justify-center text-green-500">
											<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
											</svg>
										</div>
									</div>
									<div>
										<p class="text-base font-bold text-text-300 mb-1">{audioFile.name}</p>
										<p class="text-xs font-medium text-text-200 bg-tile-400/50 px-2 py-1 rounded-full inline-block">
											{formatFileSize(audioFile.size)} • {audioFile.type.split('/')[1]?.toUpperCase() || 'AUDIO'}
										</p>
									</div>
									<button
										type="button"
										onclick={removeAudioFile}
										class="px-4 py-2 bg-tile-400 text-text-300 rounded-lg hover:bg-tile-500 transition-colors text-sm font-medium border border-tile-500 hover:border-tile-600"
									>
										Remove File
									</button>
								</div>
							{:else}
								<div class="space-y-4">
									<div class="flex items-center justify-center">
										<div class="w-16 h-16 rounded-full bg-tile-400/50 flex items-center justify-center text-tile-600">
											<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
											</svg>
										</div>
									</div>
									<div>
										<p class="text-lg font-bold text-text-300 mb-1">Drop audio file here</p>
										<p class="text-sm text-text-200">or click anywhere to browse</p>
									</div>
									<div class="text-xs text-text-200 opacity-70">
										MP3, WAV, FLAC, M4A, MP4, WebM, OGG (max 25MB)
									</div>
								</div>
								
								<input
									type="file"
									accept="audio/*"
									onchange={handleAudioFileSelect}
									class="inset-0 absolute w-full h-full opacity-0 cursor-pointer"
								/>
							{/if}
						</div>
						
						{#if audioFileError}
							<div class="mt-3 p-3 bg-red-50/50 border border-red-200 rounded-lg flex items-center gap-2">
								<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
								<p class="text-sm font-medium text-red-600">{audioFileError}</p>
							</div>
						{/if}
						
						<!-- Transcribe Button for Audio Mode -->
						{#if audioFile}
							<div class="mt-6">
								<Button type="submit" className="w-full py-3 text-base font-bold shadow-md hover:shadow-lg transition-all">
									{#if isTranscribing}
										<div class="flex items-center justify-center gap-2">
											<div role="status">
												<svg aria-hidden="true" class="h-5 w-5 animate-spin fill-white text-white/30" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
													<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
												</svg>
											</div>
											<span>Transcribing...</span>
										</div>
									{:else}
										<span>🎵 Transcribe & Create</span>
									{/if}
								</Button>
							</div>
						{/if}
					</div>
				{/if}

				{#if creationMode === 'upload' && !useReviewWordsOnly}
					<!-- Audio Upload Section (only show when not in review words mode) -->
					<div class="p-5 border border-tile-500 bg-tile-300 rounded-xl shadow-sm">
						<h3 class="text-lg font-bold text-text-300 mb-2">Upload Arabic Audio</h3>
						<p class="text-sm text-text-200 mb-4 flex items-center gap-2">
							<span class="text-lg">ℹ️</span>
							<span>Use <a href="https://ezconv.com/" class="text-text-300 font-medium hover:underline" target="_blank">ezconv.com</a> to convert YouTube videos to MP3.</span>
						</p>
						
						<!-- Title Input for Audio Mode -->
						<div class="mb-6">
							<div class="flex items-center gap-2 mb-3 cursor-pointer group" onclick={() => useCustomTitle = !useCustomTitle}>
								<div class="relative flex items-center">
									<input
										type="checkbox"
										id="useCustomTitle"
										bind:checked={useCustomTitle}
										class="peer w-4 h-4 cursor-pointer appearance-none rounded border border-tile-600 bg-tile-200 checked:bg-tile-600 checked:border-tile-600 focus:ring-offset-0 focus:ring-1 focus:ring-tile-500 transition-all"
									/>
									<svg class="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5 top-0.5 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
								</div>
								<label for="useCustomTitle" class="text-sm text-text-300 font-medium cursor-pointer select-none group-hover:text-text-200 transition-colors">
									Use custom title
								</label>
							</div>
							
							{#if useCustomTitle}
								<input
									type="text"
									bind:value={customTitle}
									placeholder="Enter custom title for your story..."
									class="w-full rounded-lg border border-tile-500 bg-tile-200 py-2.5 px-3 text-text-300 focus:border-tile-600 focus:ring-1 focus:ring-tile-600 transition-all"
								/>
							{:else if audioFile}
								<p class="text-sm text-text-200 bg-tile-400/30 p-2 rounded-lg border border-tile-500/30">
									Title will be: <span class="font-bold text-text-300">{customTitle}</span>
								</p>
							{/if}
						</div>

						<!-- Audio File Drop Zone -->
						<div
							class="relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 
								{isDragOver ? 'border-blue-400 bg-blue-50/10' : audioFile ? 'border-green-500 bg-green-50/10' : 'border-tile-500 hover:border-tile-600 hover:bg-tile-400/30'}"
							ondrop={handleAudioDrop}
							ondragover={handleAudioDragOver}
							ondragleave={handleAudioDragLeave}
						>
							{#if audioFile}
								<div class="space-y-4">
									<div class="flex items-center justify-center">
										<div class="w-16 h-16 rounded-full bg-green-100/20 flex items-center justify-center text-green-500">
											<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
											</svg>
										</div>
									</div>
									<div>
										<p class="text-base font-bold text-text-300 mb-1">{audioFile.name}</p>
										<p class="text-xs font-medium text-text-200 bg-tile-400/50 px-2 py-1 rounded-full inline-block">
											{formatFileSize(audioFile.size)} • {audioFile.type.split('/')[1]?.toUpperCase() || 'AUDIO'}
										</p>
									</div>
									<button
										type="button"
										onclick={removeAudioFile}
										class="px-4 py-2 bg-tile-400 text-text-300 rounded-lg hover:bg-tile-500 transition-colors text-sm font-medium border border-tile-500 hover:border-tile-600"
									>
										Remove File
									</button>
								</div>
							{:else}
								<div class="space-y-4">
									<div class="flex items-center justify-center">
										<div class="w-16 h-16 rounded-full bg-tile-400/50 flex items-center justify-center text-tile-600">
											<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
											</svg>
										</div>
									</div>
									<div>
										<p class="text-lg font-bold text-text-300 mb-1">Drop audio file here</p>
										<p class="text-sm text-text-200">or click anywhere to browse</p>
									</div>
									<div class="text-xs text-text-200 opacity-70">
										MP3, WAV, FLAC, M4A, MP4, WebM, OGG (max 25MB)
									</div>
								</div>
								
								<input
									type="file"
									accept="audio/*"
									onchange={handleAudioFileSelect}
									class="inset-0 absolute w-full h-full opacity-0 cursor-pointer"
								/>
							{/if}
						</div>
						
						{#if audioFileError}
							<div class="mt-3 p-3 bg-red-50/50 border border-red-200 rounded-lg flex items-center gap-2">
								<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
								<p class="text-sm font-medium text-red-600">{audioFileError}</p>
							</div>
						{/if}
						
						<!-- Transcribe Button for Audio Mode -->
						{#if audioFile}
							<div class="mt-6">
								<Button type="submit" className="w-full py-3 text-base font-bold shadow-md hover:shadow-lg transition-all">
									{#if isTranscribing}
										<div class="flex items-center justify-center gap-2">
											<div role="status">
												<svg aria-hidden="true" class="h-5 w-5 animate-spin fill-white text-white/30" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
													<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
												</svg>
											</div>
											<span>Transcribing...</span>
										</div>
									{:else}
										<span>🎵 Transcribe & Create</span>
									{/if}
								</Button>
							</div>
						{/if}
					</div>
				{/if}

				{#if creationMode === 'generate' && !useReviewWordsOnly}
					<!-- Original AI Generation Options -->
					<div class="flex flex-col gap-2">
						<label class="text-sm font-bold text-text-300">Content Type</label>
						<div class="flex gap-4">
							<RadioButton
								className="!text-sm !font-medium"
								wrapperClass="!p-3 !rounded-lg flex-1 hover:bg-tile-400/50 transition-colors"
								onClick={setStoryType}
								selectableFor="story"
								isSelected={storyType === 'story'}
								value="story"
								text="Story (Narrative)"
							/>
							<RadioButton
								className="!text-sm !font-medium"
								wrapperClass="!p-3 !rounded-lg flex-1 hover:bg-tile-400/50 transition-colors"
								onClick={setStoryType}
								selectableFor="conversation"
								isSelected={storyType === 'conversation'}
								value="conversation"
								text="Conversation (Dialogue)"
							/>
						</div>
					</div>

					<div class="flex flex-col gap-2">
						<label for="description" class="text-sm font-bold text-text-300">
							Topic or Theme <span class="font-normal text-text-200 text-xs ml-1">(Optional)</span>
						</label>
						<textarea
							name="description"
							bind:value={description}
							id="description"
							rows="3"
							class="w-full rounded-lg border border-tile-500 bg-tile-300 p-3 text-sm text-text-300 placeholder:text-text-200/50 focus:border-tile-600 focus:ring-1 focus:ring-tile-600 resize-none transition-all"
							placeholder={`Describe what you want your ${storyType} to be about...`}
						></textarea>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<!-- Difficulty Selection -->
						<div class="flex flex-col gap-2">
							<label class="text-sm font-bold text-text-300">Difficulty Level</label>
							<div class="flex flex-col gap-2">
								{#each difficultyOptions as difficultyOption}
									<RadioButton
										className="!text-sm"
										wrapperClass="!p-2 !rounded-lg hover:bg-tile-400/50 transition-colors"
										onClick={setOption}
										selectableFor={difficultyOption.value}
										isSelected={option === difficultyOption.value}
										value={difficultyOption.value}
										text={difficultyOption.label}
									/>
								{/each}
							</div>
						</div>

						<!-- Length Selection -->
						<div class="flex flex-col gap-2">
							<label class="text-sm font-bold text-text-300">Length</label>
							<div class="flex flex-col gap-2">
								{#each sentenceOptions as option}
									<RadioButton
										className="!text-sm"
										wrapperClass="!p-2 !rounded-lg hover:bg-tile-400/50 transition-colors"
										onClick={setSentenceCount}
										selectableFor={option.value.toString()}
										isSelected={sentenceCount === option.value}
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
							{#each learningTopicOptions as topic}
								<button
									type="button"
									class="text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-200
										{selectedLearningTopics.includes(topic) 
											? 'bg-tile-500 border-tile-600 text-text-300 shadow-sm' 
											: 'bg-tile-300 border-tile-500 text-text-200 hover:border-tile-600 hover:text-text-300'}"
									onclick={() => toggleLearningTopic(topic)}
								>
									<div class="flex items-center gap-2">
										<div class="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">
											{#if selectedLearningTopics.includes(topic)}✓{/if}
										</div>
										{topic}
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
							Create {storyType === 'story' ? 'Story' : 'Conversation'}
						</Button>
					</div>
				{/if}
				{/if}
			</form>
		{/if}
	</div>
</Modal>

<div class="w-fit">
	{#if !data.session || !data.isSubscribed || !data.hasActiveSubscription}
		<Button onClick={openPaywallModal} type="button" className="shadow-sm hover:shadow-md transition-all">
			Create New Content
		</Button>
	{:else}
		<Button onClick={openModal} type="button" className="shadow-sm hover:shadow-md transition-all">
			Create New Content
		</Button>
	{/if}
</div>