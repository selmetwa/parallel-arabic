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

	let selectedDialect = $state('egyptian-arabic');
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

	function toggleLearningTopic(topic: string) {
		if (selectedLearningTopics.includes(topic)) {
			selectedLearningTopics = selectedLearningTopics.filter((t: string) => t !== topic);
		} else {
			selectedLearningTopics = [...selectedLearningTopics, topic];
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
		
		let finalVocabularyWords = vocabularyWords;
		
		// If file mode is selected and a file is uploaded, process it
		if (vocabularyInputMode === 'file' && vocabularyFile) {
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
					learningTopics: selectedLearningTopics,
					vocabularyWords: finalVocabularyWords
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
		{ value: 'egyptian-arabic', label: 'Egyptian Arabic' },
		{ value: 'fusha', label: 'Modern Standard Arabic (Fusha)' },
		{ value: 'levantine', label: 'Levantine Arabic' },
		{ value: 'darija', label: 'Moroccan Arabic (Darija)' },
	];

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

	const difficultyOptions = [
		{ value: 'a1', label: 'A1 (Beginner)' },
		{ value: 'a2', label: 'A2 (Elementary)' },
		{ value: 'b1', label: 'B1 (Intermediate)' },
		{ value: 'b2', label: 'B2 (Upper Intermediate)' },
		{ value: 'c1', label: 'C1 (Advanced)' },
		{ value: 'c2', label: 'C2 (Proficient)' }
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
	<div class="px-4 mt-12 sm:px-8 max-w-3xl mx-auto">
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
	<section class="px-4 mt-12 sm:px-8 max-w-7xl mx-auto mb-20">
		<div class="text-left mb-12">
			<h1 class="text-4xl sm:text-5xl text-text-300 font-bold mb-4 tracking-tight">Sentence Practice</h1>
			<p class="text-text-200 text-lg sm:text-xl leading-relaxed opacity-90 max-w-3xl">
				Drill grammar patterns and vocabulary in context with unlimited AI-generated sentences.
			</p>
		</div>

		<div class="max-w-3xl mx-auto border border-tile-500 bg-tile-400/30 shadow-xl rounded-xl overflow-hidden">
			<div class="bg-tile-400 p-6 border-b border-tile-500">
				<h2 class="text-xl font-bold text-text-300">Configure Practice Session</h2>
				<p class="text-text-200 text-sm mt-1">Customize your sentences to match your learning goals.</p>
			</div>
			
			<form class="flex flex-col gap-8 p-6 sm:p-8" onsubmit={generateSentences}>
				<!-- Dialect Selection -->
				<div class="flex flex-col gap-3">
					<h3 class="text-sm font-bold text-text-300 uppercase tracking-wider opacity-80">Select Dialect</h3>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{#each dialectOptions as dialectOption}
							<RadioButton
								className="!text-base !font-medium"
								wrapperClass="!p-3 !rounded-lg hover:bg-tile-400/50 transition-colors duration-200"
								onClick={setDialect}
								selectableFor={dialectOption.value}
								isSelected={selectedDialect === dialectOption.value}
								value={dialectOption.value}
								text={dialectOption.label}
							/>
						{/each}
					</div>
				</div>
				
				<div class="border-t border-tile-500/50 pt-6">
					<h3 class="text-sm font-bold text-text-300 uppercase tracking-wider opacity-80 mb-3">Difficulty Level</h3>
					<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
						{#each difficultyOptions as difficultyOption}
							<RadioButton
								className="!text-sm !font-medium"
								wrapperClass="!p-2.5 !rounded-lg hover:bg-tile-400/50 transition-colors duration-200"
								onClick={setOption}
								selectableFor={difficultyOption.value}
								isSelected={option === difficultyOption.value}
								value={difficultyOption.value}
								text={difficultyOption.label}
							/>
						{/each}
					</div>
				</div>

				<!-- Learning Topics Selection -->
				<div class="border-t border-tile-500/50 pt-6">
					<h3 class="text-sm font-bold text-text-300 uppercase tracking-wider opacity-80 mb-1">Grammar Focus <span class="text-text-200 text-xs font-normal normal-case opacity-70 ml-1">(Optional)</span></h3>
					<p class="text-xs text-text-200 mb-3">Select topics to emphasize in your sentences.</p>
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
					{#if selectedLearningTopics.length > 0}
						<div class="mt-3 flex items-center justify-between text-xs text-text-200 bg-tile-300/50 p-2 rounded-lg border border-tile-500/30">
							<span>Selected: <span class="text-text-300 font-medium">{selectedLearningTopics.join(', ')}</span></span>
							<button
								type="button"
								class="ml-2 text-text-300 hover:underline font-medium"
								onclick={() => selectedLearningTopics = []}
							>
								Clear all
							</button>
						</div>
					{/if}
				</div>

				<!-- Vocabulary Words Input -->
				<div class="border-t border-tile-500/50 pt-6">
					<div class="flex justify-between items-center mb-3">
						<h3 class="text-sm font-bold text-text-300 uppercase tracking-wider opacity-80">Custom Vocabulary <span class="text-text-200 text-xs font-normal normal-case opacity-70 ml-1">(Optional)</span></h3>
						
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
								Upload
							</button>
						</div>
					</div>
					
					<div class="rounded-xl bg-tile-300/50 p-4 border border-tile-500/50">
						{#if vocabularyInputMode === 'text'}
							<textarea
								bind:value={vocabularyWords}
								rows="2"
								class="w-full rounded-lg border border-tile-500 bg-tile-300 p-3 text-sm text-text-300 placeholder:text-text-200/50 focus:border-tile-600 focus:ring-1 focus:ring-tile-600 resize-none"
								placeholder="Enter vocabulary words separated by commas (e.g., بيت, مدرسة, طعام, سيارة)"
							></textarea>
							<p class="text-xs text-text-200 mt-2 opacity-80">
								Tip: You can enter words in Arabic, English, or transliteration.
							</p>
						{:else}
							<div class="relative">
								<input
									type="file"
									accept=".txt,.csv"
									onchange={handleFileChange}
									class="block w-full text-sm text-text-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-tile-500 file:text-text-300 hover:file:bg-tile-600 cursor-pointer"
								/>
								<p class="text-xs text-text-200 mt-2 opacity-80">
									Supports TXT and CSV files (max 150KB).
								</p>
								{#if vocabularyFile}
									<p class="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
										✓ File loaded: {vocabularyFile.name} ({Math.round(vocabularyFile.size / 1024)}KB)
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
				</div>
				
				<div class="border-t border-tile-500/50 pt-6">
					<h3 class="text-sm font-bold text-text-300 uppercase tracking-wider opacity-80 mb-3">Practice Mode</h3>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<RadioButton
							className="!text-base !font-medium"
							wrapperClass="!p-3 !rounded-lg hover:bg-tile-400/50 transition-colors duration-200"
							onClick={setMode}
							selectableFor="write"
							isSelected={mode === 'write'}
							value="write"
							text="✍️ Practice Writing"
						/>
						<RadioButton
							className="!text-base !font-medium"
							wrapperClass="!p-3 !rounded-lg hover:bg-tile-400/50 transition-colors duration-200"
							onClick={setMode}
							selectableFor="quiz"
							isSelected={mode === 'quiz'}
							value="quiz"
							text="🧩 Multiple Choice Quiz"
						/>
					</div>
				</div>
				
				<div class="pt-2">
					{#if !data.session}
						<Tooltip text="An account is required to access this feature">
							<Button 
								type="submit" 
								disabled={true}
								className="w-full py-3 text-base font-bold shadow-md opacity-50 cursor-not-allowed"
							>
								Generate Sentences
							</Button>
						</Tooltip>
					{:else}
						<Button type="submit" className="w-full py-3 text-base font-bold shadow-md hover:shadow-lg transition-all">
							Generate Sentences
						</Button>
					{/if}
				</div>
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