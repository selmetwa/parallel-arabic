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
          // Clear corrupted data
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
  let vocabularyInputMode = $state('text'); // 'text' or 'file'
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
          // Clear corrupted data
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
    const toastId = showSentenceGenerationToast(selectedDialect);
    
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
      localStorage.setItem(`speak_sentence_${selectedDialect}`, JSON.stringify(updatedSentences));
      
      // Show success toast
      showSpeakSentenceSuccessToast(toastId, newSentences.length, selectedDialect);
      
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
	<div class="px-4 mt-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
		<div class="border border-tile-600 bg-tile-300 py-8 px-6 text-center rounded-xl shadow-sm">
			<h1 class="text-3xl font-bold text-text-300 mb-2">You have reached your limit of 5 sentences.</h1>
			<p class="text-xl text-text-200 mb-6">To continue practicing, please subscribe.</p>
			<form method="POST" action="/?/subscribe" class="mx-auto w-fit">
				<!-- Modify this value using your own Stripe price_id -->
				<input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
				<Button type="submit" className="!text-lg !px-8 !py-3">Subscribe Now</Button>
			</form>
		</div>
	</div>
{/if}

{#if isError}
	<div class="px-4 mt-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
		<div class="flex flex-col items-center gap-4 border-2 border-tile-600 bg-tile-400 p-8 text-text-200 shadow-md rounded-xl">
			<div class="text-center">
				<p class="text-3xl text-text-300 font-bold mb-2">
					Generation Failed
				</p>
				<p class="text-text-300 text-lg mb-6 max-w-2xl mx-auto">
					{errorMessage}
				</p>
				<button
					onclick={() => { isError = false; errorMessage = ''; }}
					class="px-6 py-2 bg-tile-500 text-text-300 rounded-lg border border-tile-600 hover:bg-tile-600 hover:border-tile-500 transition-all duration-300 font-bold"
				>
					Try Again
				</button>
			</div>
		</div>
	</div>
{/if}

{#if !isLoading && sentences.length === 0 && !hasReachedLimit}
	<section class="px-4 mt-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
		<div class="border-2 border-tile-600 bg-tile-400/50 shadow-sm rounded-xl overflow-hidden">
			<form class="flex flex-col p-8" onsubmit={generateSentences}>
				<div class="text-left mb-8 pb-6 border-b border-tile-500">
					<h1 class="text-4xl sm:text-5xl text-text-300 font-bold mb-3 tracking-tight">
						Practice speaking Arabic
					</h1>
					<p class="text-text-200 text-xl sm:text-2xl leading-relaxed">Choose your dialect, difficulty, and start speaking practice with AI feedback.</p>
				</div>

				<!-- Review Words Only Toggle -->
				<div class="flex flex-col gap-3 bg-tile-400/30 p-4 rounded-xl border border-tile-500/50 mb-8">
					<div class="flex items-center justify-between">
						<div class="flex flex-col gap-1">
							<p class="text-sm font-bold text-text-300">Use Review Words Only</p>
							<p class="text-xs text-text-200 opacity-80">
								Generate content using words you're already learning. This reinforces your memory by seeing words in new contexts, improving retention through spaced repetition.
							</p>
						</div>
						<div class="relative flex items-center">
							<input
								type="checkbox"
								id="useReviewWordsOnly"
								bind:checked={useReviewWordsOnly}
								class="peer w-5 h-5 cursor-pointer appearance-none rounded border border-tile-600 bg-tile-200 checked:bg-tile-600 checked:border-tile-600 focus:ring-offset-0 focus:ring-1 focus:ring-tile-500 transition-all"
							/>
							<svg class="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1 top-1 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
						</div>
					</div>
				</div>

				{#if useReviewWordsOnly}
					<!-- Review Words Only Mode -->
					<!-- Dialect Selection -->
					<div class="flex flex-col gap-4 mb-8">
						<h2 class="text-2xl font-bold text-text-300">Select Arabic Dialect</h2>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{#each dialectOptions as dialectOption}
								<RadioButton
									className="!text-lg !font-medium"
									wrapperClass="!p-4 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300 rounded-xl bg-tile-300/50"
									onClick={setDialect}
									selectableFor={dialectOption.value}
									isSelected={selectedDialect === dialectOption.value}
									value={dialectOption.value}
									text={dialectOption.label}
								/>
							{/each}
						</div>
					</div>

					<!-- Review Words Source Selection -->
					<div class="flex flex-col gap-2 mb-8">
						<label class="text-2xl font-bold text-text-300">Word Source</label>
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
						<div class="text-sm text-text-200 mb-8">Loading words...</div>
					{:else if reviewWordsError}
						<div class="p-3 bg-red-50/50 border border-red-200 rounded-lg mb-8">
							<p class="text-sm text-red-600">{reviewWordsError}</p>
						</div>
					{:else if reviewWords.length > 0}
						<div class="p-3 bg-tile-300 border border-tile-500 rounded-lg mb-8">
							<p class="text-sm font-medium text-text-300">
								{reviewWords.length} word{reviewWords.length !== 1 ? 's' : ''} will be used in your sentences
							</p>
						</div>
					{/if}

					<!-- Difficulty Selection -->
					<div class="flex flex-col gap-4 mb-8 border-t border-tile-500 pt-8">
						<h2 class="text-2xl font-bold text-text-300">Select difficulty level</h2>
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
							{#each difficultyOptions as difficultyOption}
								<RadioButton
									className="!text-base !font-medium"
									wrapperClass="!p-3 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300 rounded-xl bg-tile-300/50"
									onClick={setOption}
									selectableFor={difficultyOption.value}
									isSelected={option === difficultyOption.value}
									value={difficultyOption.value}
									text={difficultyOption.label}
								/>
							{/each}
						</div>
					</div>

					<div class="pt-4">
						<Button 
							type="submit" 
							className="w-full !py-4 !text-lg !rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
							disabled={reviewWords.length === 0 || isLoadingReviewWords}
						>
							Generate Sentences
						</Button>
					</div>
				{:else}
					<!-- Original Generation Mode -->
					<!-- Dialect Selection -->
					<div class="flex flex-col gap-4 mb-8">
						<h2 class="text-2xl font-bold text-text-300">Select Arabic Dialect</h2>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{#each dialectOptions as dialectOption}
								<RadioButton
									className="!text-lg !font-medium"
									wrapperClass="!p-4 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300 rounded-xl bg-tile-300/50"
									onClick={setDialect}
									selectableFor={dialectOption.value}
									isSelected={selectedDialect === dialectOption.value}
									value={dialectOption.value}
									text={dialectOption.label}
								/>
							{/each}
						</div>
					</div>
					
					<div class="flex flex-col gap-4 mb-8 border-t border-tile-500 pt-8">
						<h2 class="text-2xl font-bold text-text-300">Select difficulty level</h2>
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
							{#each difficultyOptions as difficultyOption}
								<RadioButton
									className="!text-base !font-medium"
									wrapperClass="!p-3 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300 rounded-xl bg-tile-300/50"
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
					<div class="flex flex-col gap-4 mb-8 border-t border-tile-500 pt-8">
						<div class="flex flex-col gap-1">
							<h2 class="text-2xl font-bold text-text-300">Focus on specific topics</h2>
							<p class="text-text-200">Select multiple topics to emphasize in your speaking practice (optional)</p>
						</div>
						<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
							{#each learningTopicOptions as topic}
								<button
									type="button"
									class="text-left p-3 rounded-lg border-2 transition-all duration-200 text-text-300 text-sm font-medium {selectedLearningTopics.includes(topic) ? 'bg-tile-500 border-tile-400 shadow-inner' : 'bg-tile-300/50 border-tile-600 hover:bg-tile-300 hover:border-tile-500'}"
									onclick={() => toggleLearningTopic(topic)}
								>
									<span class="mr-2">{selectedLearningTopics.includes(topic) ? '✓' : '○'}</span>
									{topic}
								</button>
							{/each}
						</div>
						{#if selectedLearningTopics.length > 0}
							<div class="text-sm text-text-200 mt-2 p-3 bg-tile-300/30 rounded-lg border border-tile-500/30 flex justify-between items-center">
								<span>Selected: <strong>{selectedLearningTopics.join(', ')}</strong></span>
								<button
									type="button"
									class="ml-4 text-red-400 hover:text-red-300 underline text-xs font-bold"
									onclick={() => selectedLearningTopics = []}
								>
									Clear all
								</button>
							</div>
						{/if}
					</div>

					<!-- Vocabulary Words Input -->
					<div class="flex flex-col gap-4 mb-8 border-t border-tile-500 pt-8">
						<div class="flex flex-col gap-1">
							<h2 class="text-2xl font-bold text-text-300">Include specific vocabulary</h2>
							<p class="text-text-200">Enter words you're studying that you'd like to practice (optional)</p>
						</div>
						
						<!-- Input Mode Toggle -->
						<div class="flex p-1 bg-tile-300/50 rounded-lg w-fit border border-tile-600">
							<button
								type="button"
								class="px-4 py-2 text-sm rounded-md transition-all duration-200 font-bold {vocabularyInputMode === 'text' ? 'bg-tile-500 text-text-300 shadow-sm' : 'text-text-200 hover:text-text-300'}"
								onclick={() => { vocabularyInputMode = 'text'; vocabularyFile = null; fileError = ''; }}
							>
								✍️ Text Input
							</button>
							<button
								type="button"
								class="px-4 py-2 text-sm rounded-md transition-all duration-200 font-bold {vocabularyInputMode === 'file' ? 'bg-tile-500 text-text-300 shadow-sm' : 'text-text-200 hover:text-text-300'}"
								onclick={() => { vocabularyInputMode = 'file'; vocabularyWords = ''; }}
							>
								📂 File Upload
							</button>
						</div>
          
          {#if vocabularyInputMode === 'text'}
            <div class="relative">
              <textarea
                bind:value={vocabularyWords}
                rows="3"
                class="w-full rounded-xl border-2 border-tile-600 bg-tile-300/50 py-3 px-4 text-text-300 resize-none focus:border-tile-400 focus:ring-0 transition-colors text-lg"
                placeholder="Enter vocabulary words separated by commas (e.g., بيت, مدرسة, طعام, سيارة)"
              ></textarea>
              <div class="absolute bottom-3 right-3 text-xs text-text-200 bg-tile-400/80 px-2 py-1 rounded">
                Supports Arabic, English, Transliteration
              </div>
            </div>
          {:else}
            <div class="p-6 border-2 border-dashed border-tile-600 rounded-xl bg-tile-300/30 text-center hover:bg-tile-300/50 transition-colors relative group">
              <input
                type="file"
                accept=".txt,.csv"
                onchange={handleFileChange}
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div class="flex flex-col items-center justify-center gap-2">
                <span class="text-4xl group-hover:scale-110 transition-transform duration-300">📄</span>
                <p class="text-lg font-bold text-text-300">Drop your vocabulary file here</p>
                <p class="text-sm text-text-200">or click to browse</p>
                <div class="mt-2 text-xs text-text-200 bg-tile-400/50 px-3 py-1 rounded-full">
                  Supports TXT & CSV (max 150KB)
                </div>
              </div>
            </div>
              {#if vocabularyFile}
                <div class="p-3 bg-green-900/20 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400">
                  <span>✓</span>
                  <span>File loaded: <strong>{vocabularyFile.name}</strong> ({Math.round(vocabularyFile.size / 1024)}KB)</span>
                </div>
              {/if}
              {#if fileError}
                <div class="p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
                  <span>⚠</span>
                  <span>{fileError}</span>
                </div>
              {/if}
          {/if}
        </div>
				
				<div class="pt-4">
					{#if !data.session}
						<Tooltip text="An account is required to access this feature">
							<Button 
								type="submit" 
								disabled={true}
								className="opacity-50 cursor-not-allowed w-full !text-xl !py-4"
							>
								Generate Speaking Sentences
							</Button>
						</Tooltip>
					{:else}
						<Button type="submit" className="w-full !text-xl !py-4 shadow-lg hover:translate-y-[-2px]">
							Generate Speaking Sentences
						</Button>
					{/if}
				</div>
				{/if}
			</form>
		</div>
	</section>
{/if}

{#if isLoading}
	<div class="px-4 mt-6 sm:px-8 lg:px-12 max-w-7xl mx-auto">
		<div class="flex flex-col items-center gap-6 border-2 border-tile-600 bg-tile-400 p-12 text-text-200 shadow-md rounded-xl text-center">
			<div class="scale-150 mb-4">
				<AlphabetCycle />
			</div>
			<div>
				<p class="text-3xl text-text-300 font-bold mb-2">
					Generating your {dialectOptions.find(d => d.value === selectedDialect)?.label} sentences
				</p>
				<p class="text-text-200 text-xl">
					Creating personalized speaking practice... (up to 30s)
				</p>
			</div>
		</div>
	</div>
{:else if sentences.length > 0 && index < sentences.length && !hasReachedLimit}
	<header class="border-b border-tile-600 bg-tile-400/50 px-4 py-4 text-center sm:px-8 lg:px-12 shadow-sm mb-8">
		<div class="flex w-full items-center justify-between max-w-7xl mx-auto">
			<div class="w-max">
				{#if index > 0}
					<Button onClick={previous} type="button" className="!text-sm">Previous</Button>
				{/if}
			</div>
			<div class="flex flex-col items-center">
				<h1 class="text-xl font-bold text-text-300">Sentence {index + 1} of {sentences.length}</h1>
				<div class="text-sm font-medium text-text-200 bg-tile-300/50 px-3 py-0.5 rounded-full border border-tile-500/30 mt-1">
          {dialectOptions.find(d => d.value === selectedDialect)?.label}
        </div>
			</div>
			<div class="w-max flex gap-2">
				{#if index < sentences.length - 1}
					<Button onClick={next} type="button" className="!text-sm">Next</Button>
				{/if}
				{#if isLastSentence && !isLoading}
					{#if !data.session}
						<Tooltip text="An account is required to access this feature">
							<Button 
								onClick={loadMoreSentences} 
								type="button"
								disabled={true}
								className="opacity-50 cursor-not-allowed !text-sm"
							>
								Load More
							</Button>
						</Tooltip>
					{:else}
						<Button onClick={loadMoreSentences} type="button" className="!text-sm">
							Load More
						</Button>
					{/if}
				{/if}
			</div>
		</div>
	</header>

	<SpeakSentence {sentence} {resetSentences} dialect={selectedDialect as Dialect} />
{/if}
