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
	<div class="mx-4 mb-6 mt-12 border border-tile-600 bg-tile-300 py-4 text-center sm:mx-36">
		<h1 class="text-2xl font-bold text-text-300">You have reached your limit of 5 sentences.</h1>
		<p class="mt-2 text-xl text-text-200">To continue practicing, please subscribe.</p>
		<form method="POST" action="/?/subscribe" class="mx-auto mt-4 w-fit">
			<input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
			<Button type="submit">Subscribe</Button>
		</form>
	</div>
{/if}

{#if isError}
	<div class="px-3 mt-6 sm:px-8 max-w-3xl mx-auto">
		<div class="flex flex-col items-center gap-4 border-2 border-tile-600 bg-tile-400 p-6 text-text-200 shadow-lg">
			<div class="text-center">
				<p class="text-2xl text-text-300 font-bold mb-1">
					Generation Failed
				</p>
				<p class="text-text-300 mb-4">
					{errorMessage}
				</p>
				<button
					onclick={() => { isError = false; errorMessage = ''; }}
					class="px-4 py-2 bg-tile-500 text-text-300 rounded border border-tile-600 hover:bg-tile-600 hover:border-tile-500 transition-colors"
				>
					Try Again
				</button>
			</div>
		</div>
	</div>
{/if}

{#if !isLoading && sentences.length === 0 && !hasReachedLimit}
	<section class="px-3 mt-6 sm:px-8 max-w-3xl mx-auto">
		<div class="border-2 border-tile-600 bg-tile-400 shadow-lg">
			<form class="flex flex-col gap-4 p-6" onsubmit={generateSentences}>
				<div class="text-left mb-4">
					<h1 class="text-xl sm:text-2xl text-text-300 font-bold mb-2 tracking-tight">
						Practice your Arabic skills with AI-generated sentences.
					</h1>
					<p class="text-text-200 text-lg leading-snug">Choose your dialect, difficulty, and practice mode.</p>
				</div>

        <!-- Dialect Selection -->
        <div class="flex flex-col gap-3">
					<h2 class="text-lg font-bold text-text-300">Select Arabic Dialect</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{#each dialectOptions as dialectOption}
							<RadioButton
								className="!text-base !font-medium"
								wrapperClass="!p-3 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300"
								onClick={setDialect}
								selectableFor={dialectOption.value}
								isSelected={selectedDialect === dialectOption.value}
								value={dialectOption.value}
								text={dialectOption.label}
							/>
						{/each}
					</div>
				</div>
				
				<div class="flex flex-col gap-3 border-t border-tile-600 pt-4">
					<h2 class="text-lg font-bold text-text-300">Select difficulty level</h2>
					<div class="grid grid-cols-2 gap-2">
						{#each difficultyOptions as difficultyOption}
							<RadioButton
								className="!text-base !font-medium"
								wrapperClass="!p-3 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300"
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
        <div class="flex flex-col gap-3 border-t border-tile-600 pt-4">
          <h2 class="text-lg font-bold text-text-300">Focus on specific language topics (optional)</h2>
          <p class="text-sm text-text-200">Select multiple topics to emphasize in your sentences</p>
          <div class="grid grid-cols-2 gap-2">
            {#each learningTopicOptions as topic}
              <button
                type="button"
                class="text-left p-2 border border-tile-600 bg-tile-200 hover:bg-tile-400 transition-colors text-text-300 text-sm {selectedLearningTopics.includes(topic) ? 'bg-tile-500 border-tile-400' : ''}"
                onclick={() => toggleLearningTopic(topic)}
              >
                <span class="mr-2">{selectedLearningTopics.includes(topic) ? '✓' : ''}</span>
                {topic}
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
        <div class="flex flex-col gap-3 border-t border-tile-600 pt-4">
          <h2 class="text-lg font-bold text-text-300">Include specific vocabulary words (optional)</h2>
          <p class="text-sm text-text-200">Enter words you're studying that you'd like featured in your sentences</p>
          
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
				
				<div class="border-t border-tile-600 pt-4">
					<h2 class="text-lg font-bold text-text-300 mb-3">Select practice mode</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
						<RadioButton
							className="!text-base !font-medium"
							wrapperClass="!p-3 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300"
							onClick={setMode}
							selectableFor="write"
							isSelected={mode === 'write'}
							value="write"
							text="Practice Writing"
						/>
						<RadioButton
							className="!text-base !font-medium"
							wrapperClass="!p-3 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300"
							onClick={setMode}
							selectableFor="quiz"
							isSelected={mode === 'quiz'}
							value="quiz"
							text="Multiple Choice Quiz"
						/>
					</div>
				</div>
				
				<div class="pt-2">
					<Button type="submit">Generate Sentences</Button>
				</div>
			</form>
		</div>
	</section>
{/if}

{#if isLoading}
	<div class="px-3 mt-6 sm:px-8 max-w-3xl mx-auto">
		<div class="flex flex-col items-center gap-4 border-2 border-tile-600 bg-tile-400 p-6 text-text-200 shadow-lg">
			<AlphabetCycle />
			<div class="text-center">
				<p class="text-2xl text-text-300 font-bold mb-1">
					Generating your {dialectOptions.find(d => d.value === selectedDialect)?.label} sentences using an LLM adapted specifically for Arabic
				</p>
				<p class="text-text-200">
					This may take up to 1 minute.
				</p>
        <p class="text-lg text-text-200 bg-tile-400 p-3 ">
          💡 <strong>Tip:</strong> You can leave this page and continue using the app. We'll send a notification when sentences are ready!
        </p>
			</div>
		</div>
	</div>
{:else if sentences.length > 0 && index < sentences.length && !hasReachedLimit}
	<header class="px-3 sm:px-8 max-w-6xl mx-auto border-b border-tile-600 bg-tile-400 py-4 shadow-lg">
		<div class="flex w-full items-center justify-between">
			<div class="w-max">
				{#if index > 0}
					<Button onClick={previous} type="button">Previous</Button>
				{/if}
			</div>
			<div>
				<h1 class="text-lg font-bold text-text-300">{index + 1} / {sentences.length}</h1>
				<p class="text-sm text-text-200">{dialectOptions.find(d => d.value === selectedDialect)?.label}</p>
			</div>
			<div class="w-max flex gap-2">
				{#if index < sentences.length - 1}
					<Button onClick={next} type="button">Next</Button>
				{/if}
				{#if isLastSentence && !isLoading}
					<Button onClick={loadMoreSentences} type="button">Load More</Button>
				{/if}
			</div>
		</div>
	</header>

	{#if mode === 'write'}
		<section class="px-3 sm:px-8 max-w-6xl mx-auto py-4">
			<SentenceBlock {sentence} {resetSentences} dialect={selectedDialect as Dialect} />
		</section>
	{/if}

	{#if mode === 'quiz'}
		<section class="px-3 sm:px-8 max-w-6xl mx-auto">
			<SentenceQuiz {sentences} {index} {resetSentences} />
		</section>
	{/if}
{/if}
