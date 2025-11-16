<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import ReviewCard from './components/ReviewCard.svelte';
  import RadioButton from '$lib/components/RadioButton.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  interface ReviewWord {
    id: string;
    arabic: string;
    english: string;
    transliteration: string;
    audioUrl?: string;
    dialect: string;
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    nextReviewDate: number | null;
    lastReviewDate: number | null;
    isLearning: boolean;
  }

  let words = $state<ReviewWord[]>([]);
  let currentIndex = $state(0);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let sessionComplete = $state(false);
  let reviewedCount = $state(0);
  let reviewedWordIds = $state<Set<string>>(new Set());
  
  // Sentence generation state
  let showGenerateSentences = $state(false);
  let isGeneratingSentences = $state(false);
  let selectedDialect = $state('egyptian-arabic');
  let difficultyOption = $state('a1');
  let selectedLearningTopics = $state<string[]>([]);
  let vocabularyWords = $state('');
  let vocabularyInputMode = $state('text');
  let vocabularyFile = $state<File | null>(null);
  let fileError = $state('');
  let generateError = $state<string | null>(null);
  let generateSuccess = $state<string | null>(null);
  
  // Word generation state
  let showGenerateWords = $state(false);
  let isGeneratingWords = $state(false);
  let selectedWordTypes = $state<string[]>([]);
  let customWordRequest = $state('');
  let wordGenerateError = $state<string | null>(null);
  let wordGenerateSuccess = $state<string | null>(null);
  let showGenerationModal = $state(false);
  let generationType = $state<'sentences' | 'words' | null>(null);
  let generationComplete = $state(false);
  let savedCount = $state(0);

  // Load progress from localStorage
  function loadProgress() {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('review-progress');
      if (saved) {
        const progress = JSON.parse(saved);
        currentIndex = progress.currentIndex || 0;
        reviewedCount = progress.reviewedCount || 0;
        reviewedWordIds = new Set(progress.reviewedWordIds || []);
        
        // Check if session was complete
        if (progress.sessionComplete) {
          sessionComplete = true;
        }
      }
    } catch (error) {
      console.error('Error loading review progress:', error);
    }
  }

  // Save progress to localStorage
  function saveProgress() {
    if (typeof window === 'undefined') return;
    
    try {
      const progress = {
        currentIndex,
        reviewedCount,
        reviewedWordIds: Array.from(reviewedWordIds),
        sessionComplete,
        timestamp: Date.now()
      };
      localStorage.setItem('review-progress', JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving review progress:', error);
    }
  }

  // Clear progress from localStorage
  function clearProgress() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('review-progress');
  }

  onMount(async () => {
    // Load saved progress first
    loadProgress();
    await loadWords();
    
    // After loading words, adjust currentIndex if needed
    if (words.length > 0 && currentIndex >= words.length) {
      // If saved index is beyond current words, reset to 0
      currentIndex = 0;
      saveProgress();
    }
  });

  async function loadWords() {
    isLoading = true;
    error = null;

    try {
      const response = await fetch('/api/review-words');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load words');
      }

      const loadedWords = result.words || [];
      
      // If we have saved progress, check if the current batch matches
      // If the batch has changed (different words), reset progress for new batch
      const currentWordIds = new Set(loadedWords.map((w: ReviewWord) => w.id));
      const savedWordIds = reviewedWordIds;
      
      // Check if any saved reviewed words are in the current batch
      const hasOverlap = Array.from(savedWordIds).some(id => currentWordIds.has(id));
      
      // If no overlap, this is likely a new batch, so reset reviewedWordIds
      // but keep currentIndex and reviewedCount if they're reasonable
      if (!hasOverlap && savedWordIds.size > 0 && loadedWords.length > 0) {
        // New batch detected - reset reviewed words but keep position if valid
        reviewedWordIds = new Set();
        if (currentIndex >= loadedWords.length) {
          currentIndex = 0;
        }
      }
      
      // Filter out words that were already reviewed in this session (within current batch)
      const filteredWords = loadedWords.filter((word: ReviewWord) => !reviewedWordIds.has(word.id));
      
      words = filteredWords;
      
      // Adjust currentIndex if it's beyond the filtered words length
      if (currentIndex >= words.length && words.length > 0) {
        currentIndex = 0;
      }
      
      // If all words were already reviewed in this batch, mark session as complete
      if (words.length === 0 && loadedWords.length > 0) {
        sessionComplete = true;
      } else if (words.length === 0) {
        sessionComplete = true;
      }
      
      // Save progress after loading
      saveProgress();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load words';
    } finally {
      isLoading = false;
    }
  }

  async function handleReview(difficulty: 1 | 2 | 3) {
    if (currentIndex >= words.length) return;

    const word = words[currentIndex];

    try {
      const response = await fetch('/api/review-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          saved_word_id: word.id,
          difficulty
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to record review');
      }

      reviewedCount++;
      reviewedWordIds.add(word.id);
      
      // Save progress after each review
      saveProgress();
      
      // Move to next word
      if (currentIndex < words.length - 1) {
        currentIndex++;
        // Reset showAnswer immediately when moving to next word
        // This prevents the answer from briefly showing for the next word
      } else {
        // Session complete
        sessionComplete = true;
      }
      
      // Save progress again after moving
      saveProgress();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to record review';
    }
  }

  function startNewSession() {
    currentIndex = 0;
    reviewedCount = 0;
    reviewedWordIds = new Set();
    sessionComplete = false;
    clearProgress();
    loadWords();
  }

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

  function filterValidSentences(sentences: any[]): any[] {
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

  async function generateAndSaveSentences() {
    isGeneratingSentences = true;
    generateError = null;
    generateSuccess = null;
    showGenerationModal = true;
    generationType = 'sentences';
    generationComplete = false;
    savedCount = 0;
    // Close the form when generation starts
    showGenerateSentences = false;
    
    let finalVocabularyWords = vocabularyWords;
    
    if (vocabularyInputMode === 'file' && vocabularyFile) {
      try {
        finalVocabularyWords = await processVocabularyFile(vocabularyFile);
      } catch (error) {
        generateError = 'Failed to process vocabulary file';
        isGeneratingSentences = false;
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
          option: difficultyOption,
          sentences: [],
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
        throw new Error('Failed to parse generated sentences');
      }
      
      const newSentences = filterValidSentences(_sentences.sentences || []);
      
      if (newSentences.length === 0) {
        throw new Error('No valid sentences were generated. Please try again.');
      }

      // Save sentences to saved_words
      const saveRes = await fetch('/api/save-sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentences: newSentences,
          dialect: selectedDialect
        })
      });

      const saveResult = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saveResult.error || 'Failed to save sentences');
      }

      savedCount = saveResult.saved;
      generationComplete = true;
      generateSuccess = `Successfully generated and saved ${saveResult.saved} sentence${saveResult.saved !== 1 ? 's' : ''} to your review deck!`;
      
      // Reset form
      selectedLearningTopics = [];
      vocabularyWords = '';
      vocabularyFile = null;
      fileError = '';
      
      // Reload words to include new ones
      await loadWords();
      
    } catch (error) {
      console.error('Error generating sentences:', error);
      generateError = error instanceof Error ? error.message : 'An unexpected error occurred while generating sentences. Please try again.';
      generationComplete = false;
    } finally {
      isGeneratingSentences = false;
    }
  }
  
  function closeGenerationModal() {
    showGenerationModal = false;
    generationType = null;
    generationComplete = false;
    savedCount = 0;
    showGenerateSentences = false;
    showGenerateWords = false;
  }
  
  function startReviewSession() {
    closeGenerationModal();
    startNewSession();
  }

  function setDialect(event: any) {
    selectedDialect = event.target.value;
  }

  function setDifficultyOption(event: any) {
    difficultyOption = event.target.value;
  }

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

  const wordTypeOptions = [
    'nouns',
    'verbs',
    'adjectives',
    'numbers',
    'colors',
    'food and drinks',
    'family members',
    'body parts',
    'animals',
    'clothing',
    'time and dates',
    'places and locations',
    'transportation',
    'emotions',
    'actions',
    'adverbs',
    'prepositions',
    'common phrases'
  ];

  function toggleWordType(type: string) {
    if (selectedWordTypes.includes(type)) {
      selectedWordTypes = selectedWordTypes.filter((t: string) => t !== type);
    } else {
      selectedWordTypes = [...selectedWordTypes, type];
    }
  }

  function filterValidWords(words: any[]): any[] {
    return words.filter(word => 
      word && 
      typeof word.arabic === 'string' && 
      typeof word.english === 'string' && 
      typeof word.transliteration === 'string' &&
      word.arabic.trim() !== '' &&
      word.english.trim() !== '' &&
      word.transliteration.trim() !== ''
    );
  }

  async function generateAndSaveWords() {
    isGeneratingWords = true;
    wordGenerateError = null;
    wordGenerateSuccess = null;
    showGenerationModal = true;
    generationType = 'words';
    generationComplete = false;
    savedCount = 0;
    // Close the form when generation starts
    showGenerateWords = false;
    
    try {
      const res = await fetch('/api/generate-words', {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: JSON.stringify({
          dialect: selectedDialect,
          wordTypes: selectedWordTypes,
          difficulty: difficultyOption,
          customRequest: customWordRequest
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
      let _words;
      try {
        _words = JSON.parse(jsonBlob);
      } catch (error) {
        throw new Error('Failed to parse generated words');
      }
      
      const newWords = filterValidWords(_words.words || []);
      
      if (newWords.length === 0) {
        throw new Error('No valid words were generated. Please try again.');
      }

      // Save words to saved_words (using same endpoint as sentences since format is compatible)
      const saveRes = await fetch('/api/save-sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentences: newWords, // Same format as sentences
          dialect: selectedDialect
        })
      });

      const saveResult = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saveResult.error || 'Failed to save words');
      }

      savedCount = saveResult.saved;
      generationComplete = true;
      wordGenerateSuccess = `Successfully generated and saved ${saveResult.saved} word${saveResult.saved !== 1 ? 's' : ''} to your review deck!`;
      
      // Reset form
      selectedWordTypes = [];
      customWordRequest = '';
      
      // Reload words to include new ones
      await loadWords();
      
    } catch (error) {
      console.error('Error generating words:', error);
      wordGenerateError = error instanceof Error ? error.message : 'An unexpected error occurred while generating words. Please try again.';
      generationComplete = false;
    } finally {
      isGeneratingWords = false;
    }
  }
</script>

<div class="min-h-screen bg-tile-200">
  <div class="max-w-4xl mx-auto px-4 py-8">
    <header class="mb-8 text-center">
      <h1 class="text-4xl font-bold text-text-300 mb-2">Review Words</h1>
      <p class="text-text-200">Practice your saved words with spaced repetition</p>
    </header>

    {#if isLoading}
      <div class="flex justify-center items-center py-20">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-text-300 mx-auto mb-4"></div>
          <p class="text-text-300">Loading words...</p>
        </div>
      </div>
    {:else if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p class="font-semibold">Error</p>
        <p>{error}</p>
        <Button onClick={loadWords} type="button" className="mt-4">Retry</Button>
      </div>
    {:else if sessionComplete}
      <div class="bg-tile-300 border border-tile-500 rounded-lg p-8 text-center">
        <h2 class="text-3xl font-bold text-text-300 mb-4">Session Complete!</h2>
        <p class="text-xl text-text-200 mb-6">
          You reviewed {reviewedCount} word{reviewedCount !== 1 ? 's' : ''} today.
        </p>
        <div class="space-y-4">
          <div class="flex gap-4 justify-center flex-wrap">
          <Button onClick={startNewSession} type="button">Review More</Button>
          <Button onClick={() => goto('/review/import')} type="button">Import More Words</Button>
            <Button onClick={() => showGenerateSentences = true} type="button">Generate Sentences</Button>
            <Button onClick={() => showGenerateWords = true} type="button">Generate Words</Button>
          </div>
          <div class="flex flex-col gap-2 text-sm text-text-200 text-center">
            <p><strong>Import More Words:</strong> Import from over 16,000 vocab words</p>
            <p><strong>Generate Words:</strong> Create your own content, great for beginners</p>
            <p><strong>Generate Sentences:</strong> Great for sentence-based comprehension</p>
          </div>
        </div>
      </div>
    {:else if words.length === 0}
      <div class="bg-tile-300 border border-tile-500 rounded-lg p-8 text-center">
        <h2 class="text-3xl font-bold text-text-300 mb-4">No Words to Review</h2>
        <p class="text-xl text-text-200 mb-6">
          You don't have any words in your review deck yet.
        </p>
        <div class="space-y-4">
          <div class="flex gap-4 justify-center flex-wrap">
        <Button onClick={() => goto('/review/import')} type="button">Import Words</Button>
            <Button onClick={() => showGenerateSentences = true} type="button">Generate Sentences</Button>
            <Button onClick={() => showGenerateWords = true} type="button">Generate Words</Button>
          </div>
          <div class="flex flex-col gap-2 text-sm text-text-200 text-center">
            <p><strong>Import Words:</strong> Import from over 16,000 vocab words</p>
            <p><strong>Generate Words:</strong> Create your own content, great for beginners</p>
            <p><strong>Generate Sentences:</strong> Great for sentence-based comprehension</p>
          </div>
        </div>
      </div>
    {:else}
      <div class="mb-6">
        <div class="flex justify-between items-center mb-4">
          <div class="text-text-300">
            <span class="font-semibold">{currentIndex + 1}</span> / <span>{words.length}</span>
          </div>
          <div class="text-text-200 text-sm">
            Reviewed: {reviewedCount}
          </div>
        </div>
        <div class="w-full bg-tile-400 rounded-full h-2">
          <div 
            class="bg-tile-600 h-2 rounded-full transition-all duration-300"
            style="width: {((currentIndex + 1) / words.length) * 100}%"
          ></div>
        </div>
      </div>

      <ReviewCard 
        word={words[currentIndex]} 
        onReview={handleReview}
      />
      
      <div class="mt-6 space-y-3">
        <div class="text-center flex gap-4 justify-center flex-wrap">
          <Button onClick={() => showGenerateSentences = true} type="button">Generate Sentences</Button>
          <Button onClick={() => showGenerateWords = true} type="button">Generate Words</Button>
        </div>
        <div class="flex flex-col gap-2 text-sm text-text-200 text-center">
          <p><strong>Generate Words:</strong> Create your own content, great for beginners</p>
          <p><strong>Generate Sentences:</strong> Great for sentence-based comprehension</p>
        </div>
      </div>
    {/if}

    {#if showGenerateSentences}
      <div class="mt-8 bg-tile-300 border border-tile-500 rounded-lg shadow-lg p-6 sm:p-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-text-300">Generate Your Own Review Materials</h2>
          <Button onClick={() => { showGenerateSentences = false; generateError = null; generateSuccess = null; }} type="button">Close</Button>
        </div>

        {#if isGeneratingSentences}
          <div class="flex flex-col items-center gap-4 py-8">
            <AlphabetCycle />
            <div class="text-center">
              <p class="text-xl text-text-300 font-bold mb-2">
                Generating {dialectOptions.find(d => d.value === selectedDialect)?.label} sentences...
              </p>
              <p class="text-text-200">
                This may take up to 1 minute. Sentences will be automatically added to your review deck.
              </p>
            </div>
          </div>
        {:else}
          <form class="flex flex-col gap-4" onsubmit={(e) => { e.preventDefault(); generateAndSaveSentences(); }}>
            {#if generateError}
              <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p class="font-semibold">Error</p>
                <p>{generateError}</p>
              </div>
            {/if}

            {#if generateSuccess}
              <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <p class="font-semibold">Success!</p>
                <p>{generateSuccess}</p>
              </div>
            {/if}

            <!-- Dialect Selection -->
            <div class="flex flex-col gap-3">
              <h3 class="text-lg font-bold text-text-300">Select Arabic Dialect</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

            <!-- Difficulty Selection -->
            <div class="flex flex-col gap-3 border-t border-tile-600 pt-4">
              <h3 class="text-lg font-bold text-text-300">Select difficulty level</h3>
              <div class="grid grid-cols-2 gap-2">
                {#each difficultyOptions as option}
                  <RadioButton
                    className="!text-base !font-medium"
                    wrapperClass="!p-3 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300"
                    onClick={setDifficultyOption}
                    selectableFor={option.value}
                    isSelected={difficultyOption === option.value}
                    value={option.value}
                    text={option.label}
                  />
                {/each}
              </div>
            </div>

            <!-- Learning Topics Selection -->
            <div class="flex flex-col gap-3 border-t border-tile-600 pt-4">
              <h3 class="text-lg font-bold text-text-300">Focus on specific language topics (optional)</h3>
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
              <h3 class="text-lg font-bold text-text-300">Include specific vocabulary words (optional)</h3>
              <p class="text-sm text-text-200">Enter words you're studying that you'd like featured in your sentences</p>
              
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
              {:else}
                <div class="space-y-2">
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onchange={handleFileChange}
                    class="block w-full text-sm text-text-300 file:mr-4 file:py-2 file:px-4 file:rounded-0 file:border-0 file:text-sm file:font-medium file:bg-tile-400 file:text-text-300 hover:file:bg-tile-500 border border-tile-600 bg-tile-200 p-2"
                  />
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

            <div class="pt-4 border-t border-tile-600">
              <Button type="submit" className="w-full">Generate & Save Sentences</Button>
            </div>
          </form>
        {/if}
      </div>
    {/if}

    {#if showGenerateWords}
      <div class="mt-8 bg-tile-300 border border-tile-500 rounded-lg shadow-lg p-6 sm:p-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-text-300">Generate Your Own Words</h2>
          <Button onClick={() => { showGenerateWords = false; wordGenerateError = null; wordGenerateSuccess = null; }} type="button">Close</Button>
        </div>

        {#if isGeneratingWords}
          <div class="flex flex-col items-center gap-4 py-8">
            <AlphabetCycle />
            <div class="text-center">
              <p class="text-xl text-text-300 font-bold mb-2">
                Generating {dialectOptions.find(d => d.value === selectedDialect)?.label} words...
              </p>
              <p class="text-text-200">
                This may take up to 1 minute. Words will be automatically added to your review deck.
              </p>
            </div>
          </div>
        {:else}
          <form class="flex flex-col gap-4" onsubmit={(e) => { e.preventDefault(); generateAndSaveWords(); }}>
            {#if wordGenerateError}
              <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p class="font-semibold">Error</p>
                <p>{wordGenerateError}</p>
              </div>
            {/if}

            {#if wordGenerateSuccess}
              <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <p class="font-semibold">Success!</p>
                <p>{wordGenerateSuccess}</p>
              </div>
            {/if}

            <!-- Dialect Selection -->
            <div class="flex flex-col gap-3">
              <h3 class="text-lg font-bold text-text-300">Select Arabic Dialect</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

            <!-- Difficulty Selection -->
            <div class="flex flex-col gap-3 border-t border-tile-600 pt-4">
              <h3 class="text-lg font-bold text-text-300">Select difficulty level</h3>
              <div class="grid grid-cols-2 gap-2">
                {#each difficultyOptions as option}
                  <RadioButton
                    className="!text-base !font-medium"
                    wrapperClass="!p-3 border-2 border-tile-600 hover:border-tile-500 transition-colors duration-300"
                    onClick={setDifficultyOption}
                    selectableFor={option.value}
                    isSelected={difficultyOption === option.value}
                    value={option.value}
                    text={option.label}
                  />
                {/each}
              </div>
            </div>

            <!-- Word Types Selection -->
            <div class="flex flex-col gap-3 border-t border-tile-600 pt-4">
              <h3 class="text-lg font-bold text-text-300">Select word types (optional)</h3>
              <p class="text-sm text-text-200">Select multiple word types to generate. Leave empty to generate a mix of all types.</p>
              <div class="grid grid-cols-2 gap-2">
                {#each wordTypeOptions as wordType}
                  <button
                    type="button"
                    class="text-left p-2 border border-tile-600 bg-tile-200 hover:bg-tile-400 transition-colors text-text-300 text-sm {selectedWordTypes.includes(wordType) ? 'bg-tile-500 border-tile-400' : ''}"
                    onclick={() => toggleWordType(wordType)}
                  >
                    <span class="mr-2">{selectedWordTypes.includes(wordType) ? '✓' : ''}</span>
                    {wordType}
                  </button>
                {/each}
              </div>
              {#if selectedWordTypes.length > 0}
                <div class="text-sm text-text-200">
                  Selected: {selectedWordTypes.join(', ')}
                  <button
                    type="button"
                    class="ml-2 underline hover:text-text-300"
                    onclick={() => selectedWordTypes = []}
                  >
                    Clear all
                  </button>
                </div>
              {/if}
            </div>

            <!-- Custom Request Input -->
            <div class="flex flex-col gap-3 border-t border-tile-600 pt-4">
              <h3 class="text-lg font-bold text-text-300">Additional requirements (optional)</h3>
              <p class="text-sm text-text-200">Describe what kind of words you want, e.g., "words related to cooking", "medical terms", etc.</p>
              <textarea
                bind:value={customWordRequest}
                rows="3"
                class="rounded-0 border border-tile-600 bg-tile-200 py-2 px-2 text-text-300 resize-none"
                placeholder="e.g., words related to cooking, medical terms, business vocabulary..."
              ></textarea>
            </div>

            <div class="pt-4 border-t border-tile-600">
              <Button type="submit" className="w-full">Generate & Save Words</Button>
            </div>
          </form>
        {/if}
      </div>
    {/if}

    <!-- Generation Modal -->
    {#if showGenerationModal}
      <Modal isOpen={showGenerationModal} handleCloseModal={closeGenerationModal} width="600px">
        <div class="p-6">
          {#if !generationComplete && (isGeneratingSentences || isGeneratingWords)}
            <div class="flex flex-col items-center gap-4 py-8">
              <AlphabetCycle />
              <div class="text-center">
                <p class="text-xl text-text-300 font-bold mb-2">
                  Generating {generationType === 'sentences' ? 'sentences' : 'words'}...
                </p>
                <p class="text-text-200">
                  This may take up to 1 minute. {generationType === 'sentences' ? 'Sentences' : 'Words'} will be automatically added to your review deck.
                </p>
              </div>
            </div>
          {:else if generationComplete}
            <div class="flex flex-col items-center gap-4 py-8">
              <div class="text-6xl mb-4">✅</div>
              <h2 class="text-2xl font-bold text-text-300 mb-2">Generation Complete!</h2>
              <p class="text-text-200 text-center mb-6">
                Successfully generated and saved {savedCount} {generationType === 'sentences' ? 'sentence' : 'word'}{savedCount !== 1 ? 's' : ''} to your review deck!
              </p>
              <div class="flex gap-4">
                <Button onClick={startReviewSession} type="button" className="bg-green-600 hover:bg-green-700">
                  Start Review Session
                </Button>
                <Button onClick={closeGenerationModal} type="button">
                  Close
                </Button>
              </div>
            </div>
          {:else if generateError || wordGenerateError}
            <div class="flex flex-col items-center gap-4 py-8">
              <div class="text-6xl mb-4">❌</div>
              <h2 class="text-2xl font-bold text-text-300 mb-2">Generation Failed</h2>
              <p class="text-text-200 text-center mb-6">
                {generateError || wordGenerateError}
              </p>
              <Button onClick={closeGenerationModal} type="button">
                Close
              </Button>
            </div>
          {/if}
        </div>
      </Modal>
    {/if}
  </div>
</div>

