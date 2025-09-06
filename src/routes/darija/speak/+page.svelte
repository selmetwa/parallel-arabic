<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import RadioButton from '$lib/components/RadioButton.svelte';
	import { darijaSentencesInStore, currentDialect } from '$lib/store/store';
	import { PUBLIC_PRICE_ID } from '$env/static/public';
	import { goto } from '$app/navigation';
  import { updateUrl } from '$lib/helpers/update-url';
  import SpeakSentence from '$lib/components/dialect-shared/speak/SpeakSentence.svelte';
  import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
  import { type sentenceObjectItem } from '$lib/types/index';
  import { onMount } from 'svelte';
	let { data } = $props();

	let isLoading = $state(false);

  onMount(() => {
    currentDialect.set('darija');
  });

  let index = $state((() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlIndex = parseInt(params.get('speak_sentence_darija') ?? '0') || 0;
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

  let sentences = $state((() => {
    if (typeof window !== 'undefined') {
      const savedSentences = localStorage.getItem('speak_sentence_darija');
      if (savedSentences) {
        const parsed = JSON.parse(savedSentences);
        return filterValidSentences(parsed);
      }
    }
    const storeSentences = Array.isArray($darijaSentencesInStore) ? $darijaSentencesInStore : [];
    return filterValidSentences(storeSentences);
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

  // Remove mode state since it's not needed for speaking

	let sentencesViewed = $state(data.sentencesViewed);

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

	async function generateSentance(option: string, copy: any) {
		isLoading = true;
		isError = false;
		errorMessage = '';
    
    let finalVocabularyWords = vocabularyWords;
    
    // If file mode is selected and a file is uploaded, process it
    if (vocabularyInputMode === 'file' && vocabularyFile) {
      try {
        finalVocabularyWords = await processVocabularyFile(vocabularyFile);
      } catch (error) {
        fileError = 'Failed to process file';
        isLoading = false;
        return;
      }
    }
    
    try {
      const res = await fetch('/api/generate-sentences', {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: JSON.stringify({
          option,
          sentences: copy,
          dialect: 'darija',
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
      const _sentences = JSON.parse(jsonBlob);
      const newSentences = filterValidSentences(_sentences.sentences || []);
      
      if (newSentences.length === 0) {
        throw new Error('No valid sentences were generated. Please try again.');
      }
      
      const updatedSentences = [...sentences, ...newSentences];
      sentences = updatedSentences;
      darijaSentencesInStore.set(updatedSentences as any);
      localStorage.setItem('speak_sentence_darija', JSON.stringify(updatedSentences));
    } catch (error) {
      console.error('Error generating sentences:', error);
      isError = true;
      errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while generating sentences. Please try again.';
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
    updateUrl('speak_sentence_darija', (index+1).toString());
	}

	function previous() {
		if (index === 0) {
			return;
		}
		index = index - 1;
		updateUrl('speak_sentence_darija', (index+1).toString());
	}

	function setOption(event: any) {
		option = event.target.value;
	}

	// Remove setMode function since it's not needed

	function generateSentences(event: any) {
		event.preventDefault();
		const copy = [...sentences];
		generateSentance(option, copy);
	}

	function loadMoreSentences() {
		generateSentance(option, sentences);
	}

  function resetSentences() {
    sentences = [];
    index = 0;
    localStorage.removeItem('speak_sentence_darija');
    updateUrl('speak_sentence_darija', '0');
  }

	let isLastSentence = $derived(index === sentences.length - 1);

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

	let hasReachedLimit = $derived(!data.isSubscribed && sentencesViewed >= 5);
</script>

{#if !data.session}
	<div class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
		<div class="border border-tile-600 bg-tile-300 py-4 px-3 text-center">
			<h1 class="text-2xl font-bold text-text-300">
				You must have an account to access this content.
			</h1>
			<div class="mx-auto mt-4 w-fit">
				<Button type="button" onClick={() => goto('/signup')}>Create Account</Button>
			</div>
		</div>
	</div>
{/if}

{#if hasReachedLimit && data.session}
	<div class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
		<div class="border border-tile-600 bg-tile-300 py-4 px-3 text-center">
			<h1 class="text-2xl font-bold text-text-300">You have reached your limit of 20 sentences.</h1>
			<p class="mt-2 text-xl text-text-200">To continue practicing, please subscribe.</p>
			<form method="POST" action="/?/subscribe" class="mx-auto mt-4 w-fit">
				<!-- Modify this value using your own Stripe price_id -->
				<input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />

				<Button type="submit">Subscribe</Button>
			</form>
		</div>
	</div>
{/if}

{#if !isLoading && sentences.length === 0 && !hasReachedLimit && data.session}
	<section class="px-3 mt-6 sm:px-8 max-w-3xl mx-auto">
		<div class="border-2 border-tile-600 bg-tile-400 shadow-lg">
			<form class="flex flex-col gap-4 p-6" onsubmit={generateSentences}>
				<div class="text-left mb-4">
					<h1 class="text-xl sm:text-2xl text-text-300 font-bold mb-2 tracking-tight">
						Practice your speaking with generated sentences.
					</h1>
					<p class="text-text-200 text-lg leading-snug">Select your preferred difficulty.</p>
				</div>
				
				<div class="flex flex-col gap-3">
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
          <p class="text-sm text-text-200">Select multiple topics to emphasize in your speaking practice</p>
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
          <p class="text-sm text-text-200">Enter words you're studying that you'd like to practice speaking</p>
          
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
					Generating your sentences
				</p>
				<p class="text-text-200">
					This usually takes a few seconds.
				</p>
			</div>
		</div>
	</div>
{:else if sentences.length > 0 && index < sentences.length && !hasReachedLimit && data.session}
	<header class="border-b border-tile-600 bg-tile-400 px-3 py-4 text-center sm:px-8">
		<div class="flex w-full items-center justify-between max-w-5xl mx-auto">
			<div class="w-max">
				{#if index > 0}
					<Button onClick={previous} type="button">Previous</Button>
				{/if}
			</div>
			<div>
				<h1 class="text-lg font-bold text-text-300">{index + 1} / {sentences.length}</h1>
			</div>
			<div class="w-max flex gap-2">
				{#if index < sentences.length - 1}
					<Button onClick={next} type="button">Next</Button>
				{/if}
				{#if isLastSentence && !isLoading}
					<Button onClick={loadMoreSentences} type="button">Load More Sentences</Button>
				{/if}
			</div>
		</div>
	</header>

	<SpeakSentence {sentence} {resetSentences} dialect="darija" />
{/if}
