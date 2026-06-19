<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import RadioButton from '$lib/components/RadioButton.svelte';
  import GeneratedItemsModal from './GeneratedItemsModal.svelte';
  import { getDefaultDialect } from '$lib/helpers/get-default-dialect';
  import { fetchUserReviewWords } from '$lib/helpers/fetch-review-words';
  import { trackEvent } from '$lib/analytics';

  interface GeneratedItem {
    arabic: string;
    english: string;
    transliteration: string;
  }

  type ReviewUser = { id?: string; target_dialect?: string | null } | null;

  interface Props {
    open?: boolean;
    user?: ReviewUser;
    onClose?: () => void;
    /** Called after sentences are saved so the host can refresh its list. */
    onCompleted?: () => void;
    /** Action for the "Start Reviewing" button on the success screen. */
    onStartReviewing?: () => void;
  }

  let { open = $bindable(false), user = null, onClose, onCompleted, onStartReviewing }: Props = $props();

  const dialectOptions = [
    { value: 'egyptian-arabic', label: 'Egyptian Arabic' },
    { value: 'fusha', label: 'Modern Standard Arabic (Fusha)' },
    { value: 'levantine', label: 'Levantine Arabic' },
    { value: 'darija', label: 'Moroccan Arabic (Darija)' }
  ];

  const difficultyOptions = [
    { value: 'a1', label: 'A1 (Beginner)' },
    { value: 'a2', label: 'A2 (Elementary)' },
    { value: 'b1', label: 'B1 (Intermediate)' },
    { value: 'b2', label: 'B2 (Upper Intermediate)' },
    { value: 'c1', label: 'C1 (Advanced)' },
    { value: 'c2', label: 'C2 (Proficient)' }
  ];

  const learningTopicOptions = [
    'verb conjugation', 'noun plurals', 'past tense', 'present tense',
    'infinitive', 'numbers', 'future tense', 'possessive suffixes'
  ];

  let dialectOverride = $state<string | null>(null);
  const selectedDialect = $derived(dialectOverride ?? getDefaultDialect(user));
  let difficultyOption = $state('a1');
  let selectedLearningTopics = $state<string[]>([]);
  let vocabularyWords = $state('');
  let vocabularyInputMode = $state<'text' | 'file'>('text');
  let vocabularyFile = $state<File | null>(null);
  let fileError = $state('');
  let generateError = $state<string | null>(null);
  let isGenerating = $state(false);

  // Review words only mode
  let useReviewWordsOnly = $state(false);
  let reviewWordsSource = $state<'all' | 'due-for-review'>('all');
  let reviewWords = $state<GeneratedItem[]>([]);
  let isLoadingReviewWords = $state(false);
  let reviewWordsError = $state('');

  let showResults = $state(false);
  let generatedItems = $state<GeneratedItem[]>([]);

  const dialectLabel = $derived(dialectOptions.find((d) => d.value === selectedDialect)?.label ?? '');

  function setDialect(event: any) {
    dialectOverride = event.target.value;
  }

  function setDifficultyOption(event: any) {
    difficultyOption = event.target.value;
  }

  function toggleLearningTopic(topic: string) {
    if (selectedLearningTopics.includes(topic)) {
      selectedLearningTopics = selectedLearningTopics.filter((t) => t !== topic);
    } else {
      selectedLearningTopics = [...selectedLearningTopics, topic];
    }
  }

  async function loadReviewWords() {
    if (!user?.id) {
      reviewWordsError = 'User not found';
      return;
    }

    isLoadingReviewWords = true;
    reviewWordsError = '';

    try {
      const words = await fetchUserReviewWords(user.id, reviewWordsSource);
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

  function onToggleReviewWordsOnly() {
    if (useReviewWordsOnly) {
      loadReviewWords();
    } else {
      reviewWords = [];
      reviewWordsError = '';
    }
  }

  function onChangeReviewWordsSource(value: 'all' | 'due-for-review') {
    reviewWordsSource = value;
    if (useReviewWordsOnly) {
      loadReviewWords();
    }
  }

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
            words = lines
              .flatMap((line) => line.split(',').map((word) => word.trim().replace(/['"]/g, '')))
              .filter((word) => word.length > 0);
          } else {
            words = text.split(/[,\n\s]+/).map((word) => word.trim()).filter((word) => word.length > 0);
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

  function filterValidSentences(sentences: any[]): GeneratedItem[] {
    return sentences.filter(
      (sentence) =>
        sentence &&
        typeof sentence.arabic === 'string' &&
        typeof sentence.english === 'string' &&
        typeof sentence.transliteration === 'string' &&
        sentence.arabic.trim() !== '' &&
        sentence.english.trim() !== '' &&
        sentence.transliteration.trim() !== ''
    );
  }

  function closeForm() {
    open = false;
    generateError = null;
    onClose?.();
  }

  function closeResults() {
    showResults = false;
    generatedItems = [];
  }

  async function generateAndSaveSentences() {
    if (useReviewWordsOnly && reviewWords.length === 0) {
      generateError = `You don't have any ${reviewWordsSource === 'all' ? 'saved words' : 'words due for review'} yet. Add words to your review deck first.`;
      return;
    }

    trackEvent('review_sentences_generation_started', {
      dialect: selectedDialect,
      difficulty: difficultyOption,
      vocabulary_source: useReviewWordsOnly ? 'review_words' : vocabularyInputMode,
      learning_topics: selectedLearningTopics
    });

    let finalVocabularyWords = vocabularyWords;
    if (!useReviewWordsOnly && vocabularyInputMode === 'file' && vocabularyFile) {
      try {
        finalVocabularyWords = await processVocabularyFile(vocabularyFile);
      } catch (error) {
        generateError = 'Failed to process vocabulary file';
        return;
      }
    }

    isGenerating = true;
    generateError = null;
    generatedItems = [];
    showResults = true;
    open = false;

    try {
      const endpoint = selectedDialect === 'egyptian-arabic'
        ? '/api/generate-sentences-egyptian'
        : '/api/generate-sentences';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: JSON.stringify({
          option: difficultyOption,
          sentences: [],
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

      const newSentences = filterValidSentences(JSON.parse(chatgptres.message.message.content).sentences || []);

      if (newSentences.length === 0) {
        throw new Error('No valid sentences were generated. Please try again.');
      }

      generatedItems = newSentences;
      isGenerating = false;

      selectedLearningTopics = [];
      vocabularyWords = '';
      vocabularyFile = null;
      fileError = '';
    } catch (error) {
      console.error('Error generating sentences:', error);
      generateError = error instanceof Error ? error.message : 'An unexpected error occurred while generating sentences. Please try again.';
      isGenerating = false;
      showResults = false;
      open = true;
    }
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
    <div class="w-full max-w-3xl bg-tile-300 border-2 border-tile-600 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 z-10 flex justify-between items-center p-6 bg-tile-300 border-b border-tile-500">
        <h2 class="text-2xl font-bold text-text-300 flex items-center gap-3">
          <span class="text-3xl">✍️</span> Generate Sentences
        </h2>
        <button
          aria-label="Close"
          class="p-2 hover:bg-tile-400 rounded-lg transition-colors text-text-200 hover:text-text-300"
          onclick={closeForm}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="p-6 sm:p-8">
        <form class="space-y-8" onsubmit={(e) => { e.preventDefault(); generateAndSaveSentences(); }}>
          {#if generateError}
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded flex items-start gap-3">
              <div class="text-xl">⚠️</div>
              <div>
                <p class="font-bold">Error</p>
                <p>{generateError}</p>
              </div>
            </div>
          {/if}

          <!-- Review Words Only Toggle -->
          <div class="flex flex-col gap-3 bg-tile-400/30 p-4 rounded-xl border border-tile-500/50">
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
                  onchange={onToggleReviewWordsOnly}
                  class="peer w-5 h-5 cursor-pointer appearance-none rounded border border-tile-600 bg-tile-200 checked:bg-tile-600 checked:border-tile-600 focus:ring-offset-0 focus:ring-1 focus:ring-tile-500 transition-all"
                />
                <svg class="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1 top-1 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
            </div>
          </div>

          {#if useReviewWordsOnly}
            <!-- Review Words Only Mode -->
            <div class="flex flex-col gap-4 bg-tile-400/30 p-4 rounded-xl border border-tile-500/50">
              <div class="space-y-3">
                <p class="block text-lg font-bold text-text-300">Select Dialect</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {#each dialectOptions as dialectOption (dialectOption.value)}
                    <RadioButton
                      className="!text-base !font-medium"
                      wrapperClass="!p-4 border-2 border-tile-500 bg-tile-400/30 hover:bg-tile-400 hover:border-tile-600 transition-all duration-200 rounded-xl"
                      onClick={setDialect}
                      selectableFor={dialectOption.value}
                      isSelected={selectedDialect === dialectOption.value}
                      value={dialectOption.value}
                      text={dialectOption.label}
                    />
                  {/each}
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <p class="text-sm font-bold text-text-300">Word Source</p>
                <div class="flex gap-4">
                  <RadioButton
                    className="!text-sm !font-medium"
                    wrapperClass="!p-3 !rounded-lg flex-1 hover:bg-tile-400/50 transition-colors"
                    onClick={(e) => onChangeReviewWordsSource(e.target.value)}
                    selectableFor="all"
                    isSelected={reviewWordsSource === 'all'}
                    value="all"
                    text="All Saved Words"
                  />
                  <RadioButton
                    className="!text-sm !font-medium"
                    wrapperClass="!p-3 !rounded-lg flex-1 hover:bg-tile-400/50 transition-colors"
                    onClick={(e) => onChangeReviewWordsSource(e.target.value)}
                    selectableFor="due-for-review"
                    isSelected={reviewWordsSource === 'due-for-review'}
                    value="due-for-review"
                    text="Words Due for Review"
                  />
                </div>
              </div>

              {#if isLoadingReviewWords}
                <div class="text-sm text-text-200">Loading words...</div>
              {:else if reviewWordsError}
                <div class="p-3 bg-red-50/50 border border-red-200 rounded-lg">
                  <p class="text-sm text-red-600">{reviewWordsError}</p>
                </div>
              {:else if reviewWords.length > 0}
                <div class="p-3 bg-tile-300 border border-tile-500 rounded-lg">
                  <p class="text-sm font-medium text-text-300">
                    {reviewWords.length} word{reviewWords.length !== 1 ? 's' : ''} will be used in your sentences
                  </p>
                </div>
              {/if}

              <div class="space-y-3">
                <p class="block text-lg font-bold text-text-300">Difficulty Level</p>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {#each difficultyOptions as option (option.value)}
                    <RadioButton
                      className="!text-sm !font-medium"
                      wrapperClass="!p-3 border-2 border-tile-500 bg-tile-400/30 hover:bg-tile-400 hover:border-tile-600 transition-all duration-200 rounded-lg"
                      onClick={setDifficultyOption}
                      selectableFor={option.value}
                      isSelected={difficultyOption === option.value}
                      value={option.value}
                      text={option.label}
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
            </div>
          {:else}
            <!-- Original Generation Mode -->
            <div class="space-y-3">
              <p class="block text-lg font-bold text-text-300">Select Dialect</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {#each dialectOptions as dialectOption (dialectOption.value)}
                  <RadioButton
                    className="!text-base !font-medium"
                    wrapperClass="!p-4 border-2 border-tile-500 bg-tile-400/30 hover:bg-tile-400 hover:border-tile-600 transition-all duration-200 rounded-xl"
                    onClick={setDialect}
                    selectableFor={dialectOption.value}
                    isSelected={selectedDialect === dialectOption.value}
                    value={dialectOption.value}
                    text={dialectOption.label}
                  />
                {/each}
              </div>
            </div>

            <div class="space-y-3">
              <p class="block text-lg font-bold text-text-300">Difficulty Level</p>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {#each difficultyOptions as option (option.value)}
                  <RadioButton
                    className="!text-sm !font-medium"
                    wrapperClass="!p-3 border-2 border-tile-500 bg-tile-400/30 hover:bg-tile-400 hover:border-tile-600 transition-all duration-200 rounded-lg"
                    onClick={setDifficultyOption}
                    selectableFor={option.value}
                    isSelected={difficultyOption === option.value}
                    value={option.value}
                    text={option.label}
                  />
                {/each}
              </div>
            </div>

            <div class="space-y-3">
              <p class="block text-lg font-bold text-text-300">Focus Topics <span class="text-sm font-normal text-text-200 ml-2">(Optional)</span></p>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {#each learningTopicOptions as topic (topic)}
                  <button
                    type="button"
                    class="text-left p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium {selectedLearningTopics.includes(topic) ? 'bg-tile-500 border-tile-600 text-text-300 shadow-sm' : 'bg-tile-200 border-tile-400 text-text-200 hover:bg-tile-400'}"
                    onclick={() => toggleLearningTopic(topic)}
                  >
                    <div class="flex items-center justify-between">
                      <span>{topic}</span>
                      {#if selectedLearningTopics.includes(topic)}
                        <span>✓</span>
                      {/if}
                    </div>
                  </button>
                {/each}
              </div>
            </div>

            <div class="space-y-3 bg-tile-400/30 p-6 rounded-xl border border-tile-500">
              <p class="block text-lg font-bold text-text-300">Include Vocabulary <span class="text-sm font-normal text-text-200 ml-2">(Optional)</span></p>
              <p class="text-sm text-text-200 mb-4">Enter specific words you want to practice in context.</p>

              <div class="flex gap-2 mb-4">
                <button
                  type="button"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-all {vocabularyInputMode === 'text' ? 'bg-tile-500 text-text-300 shadow-sm' : 'bg-tile-200 text-text-200 hover:bg-tile-400'}"
                  onclick={() => { vocabularyInputMode = 'text'; vocabularyFile = null; fileError = ''; }}
                >
                  Type Words
                </button>
                <button
                  type="button"
                  class="px-4 py-2 rounded-lg text-sm font-medium transition-all {vocabularyInputMode === 'file' ? 'bg-tile-500 text-text-300 shadow-sm' : 'bg-tile-200 text-text-200 hover:bg-tile-400'}"
                  onclick={() => { vocabularyInputMode = 'file'; vocabularyWords = ''; }}
                >
                  Upload File
                </button>
              </div>

              {#if vocabularyInputMode === 'text'}
                <textarea
                  bind:value={vocabularyWords}
                  rows="3"
                  class="w-full rounded-lg border-2 border-tile-500 bg-tile-200 p-3 text-text-300 focus:border-tile-600 focus:ring-0 transition-colors"
                  placeholder="Enter words separated by commas (e.g., بيت, مدرسة, طعام)"
                ></textarea>
              {:else}
                <div class="border-2 border-dashed border-tile-500 rounded-lg p-6 text-center hover:bg-tile-400/30 transition-colors">
                  <input
                    type="file"
                    id="vocab-file"
                    accept=".txt,.csv"
                    onchange={handleFileChange}
                    class="hidden"
                  />
                  <label for="vocab-file" class="cursor-pointer block">
                    {#if vocabularyFile}
                      <div class="text-green-600 font-medium mb-2">✓ {vocabularyFile.name}</div>
                      <div class="text-xs text-text-200">{Math.round(vocabularyFile.size / 1024)}KB</div>
                    {:else}
                      <div class="text-4xl mb-2">📄</div>
                      <p class="text-text-300 font-medium">Click to upload .txt or .csv</p>
                      <p class="text-xs text-text-200 mt-1">Max 150KB</p>
                    {/if}
                  </label>
                </div>
                {#if fileError}
                  <p class="text-sm text-red-500 mt-2">{fileError}</p>
                {/if}
              {/if}
            </div>

            <div class="pt-4">
              <Button type="submit" className="w-full !py-4 !text-lg !rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                Generate Sentences
              </Button>
            </div>
          {/if}
        </form>
      </div>
    </div>
  </div>
{/if}

{#if showResults}
  {#key generatedItems}
    <GeneratedItemsModal
      type="sentences"
      dialect={selectedDialect}
      {dialectLabel}
      {isGenerating}
      items={generatedItems}
      onClose={closeResults}
      onSaved={() => onCompleted?.()}
      {onStartReviewing}
    />
  {/key}
{/if}
