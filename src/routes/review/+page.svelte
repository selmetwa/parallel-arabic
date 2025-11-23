<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import ReviewCard from './components/ReviewCard.svelte';
  import RadioButton from '$lib/components/RadioButton.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
  import { PUBLIC_PRICE_ID } from '$env/static/public';

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
  let totalReviewCount = $state<number | null>(null);
  let hasActiveSubscription = $state(false);
  let remainingFreeReviews = $state<number | null>(null);
  let requiresSubscription = $state(false);
  
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
        // Handle paywall
        if (result.requiresSubscription) {
          requiresSubscription = true;
          totalReviewCount = result.reviewCount || 0;
          words = [];
          isLoading = false;
          return;
        }
        throw new Error(result.error || 'Failed to load words');
      }

      // Update subscription and review count info
      totalReviewCount = result.reviewCount || 0;
      hasActiveSubscription = result.hasActiveSubscription || false;
      remainingFreeReviews = result.remainingFreeReviews ?? null;
      requiresSubscription = false;

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
        // Handle paywall
        if (result.requiresSubscription) {
          requiresSubscription = true;
          totalReviewCount = result.reviewCount || 0;
          error = result.message || 'Subscription required to continue reviewing words.';
          return;
        }
        throw new Error(result.error || 'Failed to record review');
      }

      reviewedCount++;
      reviewedWordIds.add(word.id);
      
      // Update total review count if returned
      if (result.reviewCount !== undefined) {
        totalReviewCount = result.reviewCount;
        remainingFreeReviews = hasActiveSubscription ? null : Math.max(0, 5 - (totalReviewCount || 0));
      }
      
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

<div class="min-h-screen bg-tile-300 py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
    <header class="mb-12 text-center">
      <h1 class="text-4xl sm:text-5xl font-bold text-text-300 tracking-tight mb-4">Review Words</h1>
      <p class="text-lg sm:text-xl text-text-200 max-w-2xl mx-auto">
        Practice your saved words with spaced repetition
      </p>
      {#if remainingFreeReviews !== null && remainingFreeReviews > 0 && !hasActiveSubscription}
        <p class="text-sm text-text-200 mt-4 inline-block bg-tile-400/50 px-4 py-2 rounded-full border border-tile-600">
          <span class="font-semibold text-text-300">{remainingFreeReviews}</span> free review{remainingFreeReviews !== 1 ? 's' : ''} remaining
        </p>
      {/if}
    </header>

    {#if requiresSubscription}
      <div class="max-w-3xl mx-auto bg-yellow-50 border-2 border-yellow-400 rounded-xl p-8 text-center mb-12 shadow-lg">
        <div class="text-5xl mb-4">👑</div>
        <h2 class="text-2xl font-bold text-yellow-800 mb-4">Free Limit Reached</h2>
        <p class="text-lg text-yellow-700 mb-8">
          You've completed {totalReviewCount} word review{totalReviewCount !== 1 ? 's' : ''}. 
          Subscribe to continue using spaced repetition and unlock unlimited reviews!
        </p>
        <form method="POST" action="/?/subscribe" class="flex justify-center">
          <input type="hidden" name="price_id" value={PUBLIC_PRICE_ID} />
          <Button type="submit" className="!bg-yellow-600 !hover:bg-yellow-700 !border-yellow-700 !text-white !text-lg !px-8 !py-3">
            Subscribe Now
          </Button>
        </form>
      </div>
    {/if}

    {#if isLoading}
      <div class="flex justify-center items-center py-20">
        <div class="text-center">
          <AlphabetCycle />
          <p class="text-text-300 mt-4 text-xl font-medium">Loading your deck...</p>
        </div>
      </div>
    {:else if error}
      <div class="max-w-3xl mx-auto bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl mb-8 text-center">
        <p class="font-bold text-xl mb-2">Error</p>
        <p class="mb-4">{error}</p>
        <Button onClick={loadWords} type="button">Try Again</Button>
      </div>
    {:else if sessionComplete || words.length === 0}
      <div class="max-w-5xl mx-auto space-y-12">
        <div class="bg-tile-400/50 border-2 border-tile-600 rounded-xl p-8 sm:p-12 text-center shadow-lg">
          <div class="text-6xl mb-6">{sessionComplete ? '🎉' : '📚'}</div>
          <h2 class="text-3xl sm:text-4xl font-bold text-text-300 mb-4">
            {sessionComplete ? 'Session Complete!' : 'No Words to Review'}
          </h2>
          <p class="text-xl text-text-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            {sessionComplete 
              ? "Great job! You've reviewed all your scheduled words for now. Want to add more content to your deck?" 
              : "You don't have any words in your review deck yet. Start by adding some content below."}
          </p>
          {#if sessionComplete}
            <Button onClick={startNewSession} type="button" className="!text-lg !px-8 !py-3">
              Review More
            </Button>
          {/if}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <!-- Generate Words -->
          <button 
            class="flex flex-col items-center text-center p-8 rounded-xl border-2 border-tile-600 bg-tile-400/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            onclick={() => { showGenerateWords = true; showGenerateSentences = false; }}
          >
            <div class="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">📝</div>
            <h3 class="text-2xl font-bold text-text-300 mb-3">Generate Words</h3>
            <p class="text-text-200 leading-relaxed">
              Create custom vocabulary lists tailored to your level and interests. Perfect for beginners.
            </p>
          </button>

          <!-- Generate Sentences -->
          <button 
            class="flex flex-col items-center text-center p-8 rounded-xl border-2 border-tile-600 bg-tile-400/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            onclick={() => { showGenerateSentences = true; showGenerateWords = false; }}
          >
            <div class="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">✍️</div>
            <h3 class="text-2xl font-bold text-text-300 mb-3">Generate Sentences</h3>
            <p class="text-text-200 leading-relaxed">
              Practice with AI-generated sentences focusing on specific grammar topics or vocabulary.
            </p>
          </button>

          <!-- Import Words -->
          <button 
            class="flex flex-col items-center text-center p-8 rounded-xl border-2 border-tile-600 bg-tile-400/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            onclick={() => goto('/review/import')}
          >
            <div class="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">📥</div>
            <h3 class="text-2xl font-bold text-text-300 mb-3">Import Words</h3>
            <p class="text-text-200 leading-relaxed">
              Bulk import words from our library of over 16,000 terms or upload your own list.
            </p>
          </button>
        </div>
      </div>
    {:else}
      <div class="max-w-3xl mx-auto">
        <div class="mb-6 flex justify-between items-end px-2">
          <div class="text-text-300 font-medium text-lg">
            Word <span class="text-2xl font-bold">{currentIndex + 1}</span><span class="text-text-200">/{words.length}</span>
          </div>
          <div class="text-text-200 bg-tile-400/50 px-3 py-1 rounded-lg border border-tile-500">
            Reviewed: <span class="font-bold text-text-300">{reviewedCount}</span>
          </div>
        </div>
        
        <div class="w-full bg-tile-400 rounded-full h-3 mb-8 overflow-hidden border border-tile-500">
          <div 
            class="bg-tile-600 h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style="width: {((currentIndex + 1) / words.length) * 100}%"
          >
            <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
          </div>
        </div>

        <div class="mb-12">
          <ReviewCard 
            word={words[currentIndex]} 
            onReview={handleReview}
          />
        </div>
        
        <!-- Mini Generation Options -->
        <div class="border-t border-tile-500 pt-8">
          <h3 class="text-xl font-bold text-text-300 text-center mb-6">Want to add more practice material?</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              class="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-tile-600 bg-tile-400/30 hover:bg-tile-400/60 transition-all duration-300"
              onclick={() => showGenerateWords = true}
            >
              <span class="text-2xl">📝</span>
              <span class="font-bold text-text-300">Generate Words</span>
            </button>
            <button 
              class="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-tile-600 bg-tile-400/30 hover:bg-tile-400/60 transition-all duration-300"
              onclick={() => showGenerateSentences = true}
            >
              <span class="text-2xl">✍️</span>
              <span class="font-bold text-text-300">Generate Sentences</span>
            </button>
          </div>
        </div>
      </div>
    {/if}

    {#if showGenerateSentences}
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
        <div class="w-full max-w-3xl bg-tile-300 border-2 border-tile-600 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 z-10 flex justify-between items-center p-6 bg-tile-300 border-b border-tile-500">
            <h2 class="text-2xl font-bold text-text-300 flex items-center gap-3">
              <span class="text-3xl">✍️</span> Generate Sentences
            </h2>
            <button 
              class="p-2 hover:bg-tile-400 rounded-lg transition-colors text-text-200 hover:text-text-300"
              onclick={() => { showGenerateSentences = false; generateError = null; generateSuccess = null; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div class="p-6 sm:p-8">
            {#if isGeneratingSentences}
              <div class="flex flex-col items-center justify-center py-12 text-center">
                <AlphabetCycle className="w-24 h-24 mb-6" />
                <h3 class="text-2xl font-bold text-text-300 mb-2">Generating Sentences...</h3>
                <p class="text-text-200 max-w-md mx-auto">
                  Creating personalized practice sentences in {dialectOptions.find(d => d.value === selectedDialect)?.label}. This usually takes about 30-60 seconds.
                </p>
              </div>
            {:else}
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

                {#if generateSuccess}
                  <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded flex items-start gap-3">
                    <div class="text-xl">✅</div>
                    <div>
                      <p class="font-bold">Success!</p>
                      <p>{generateSuccess}</p>
                    </div>
                  </div>
                {/if}

                <!-- Dialect Selection -->
                <div class="space-y-3">
                  <label class="block text-lg font-bold text-text-300">Select Dialect</label>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {#each dialectOptions as dialectOption}
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

                <!-- Difficulty Selection -->
                <div class="space-y-3">
                  <label class="block text-lg font-bold text-text-300">Difficulty Level</label>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {#each difficultyOptions as option}
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

                <!-- Learning Topics -->
                <div class="space-y-3">
                  <label class="block text-lg font-bold text-text-300">Focus Topics <span class="text-sm font-normal text-text-200 ml-2">(Optional)</span></label>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {#each learningTopicOptions as topic}
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

                <!-- Vocabulary Input -->
                <div class="space-y-3 bg-tile-400/30 p-6 rounded-xl border border-tile-500">
                  <label class="block text-lg font-bold text-text-300">Include Vocabulary <span class="text-sm font-normal text-text-200 ml-2">(Optional)</span></label>
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
              </form>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    {#if showGenerateWords}
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
        <div class="w-full max-w-3xl bg-tile-300 border-2 border-tile-600 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 z-10 flex justify-between items-center p-6 bg-tile-300 border-b border-tile-500">
            <h2 class="text-2xl font-bold text-text-300 flex items-center gap-3">
              <span class="text-3xl">📝</span> Generate Words
            </h2>
            <button 
              class="p-2 hover:bg-tile-400 rounded-lg transition-colors text-text-200 hover:text-text-300"
              onclick={() => { showGenerateWords = false; wordGenerateError = null; wordGenerateSuccess = null; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div class="p-6 sm:p-8">
            {#if isGeneratingWords}
              <div class="flex flex-col items-center justify-center py-12 text-center">
                <AlphabetCycle className="w-24 h-24 mb-6" />
                <h3 class="text-2xl font-bold text-text-300 mb-2">Generating Words...</h3>
                <p class="text-text-200 max-w-md mx-auto">
                  Curating a list of {dialectOptions.find(d => d.value === selectedDialect)?.label} words based on your preferences. Almost there!
                </p>
              </div>
            {:else}
              <form class="space-y-8" onsubmit={(e) => { e.preventDefault(); generateAndSaveWords(); }}>
                {#if wordGenerateError}
                  <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded flex items-start gap-3">
                    <div class="text-xl">⚠️</div>
                    <div>
                      <p class="font-bold">Error</p>
                      <p>{wordGenerateError}</p>
                    </div>
                  </div>
                {/if}

                {#if wordGenerateSuccess}
                  <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded flex items-start gap-3">
                    <div class="text-xl">✅</div>
                    <div>
                      <p class="font-bold">Success!</p>
                      <p>{wordGenerateSuccess}</p>
                    </div>
                  </div>
                {/if}

                <!-- Dialect Selection -->
                <div class="space-y-3">
                  <label class="block text-lg font-bold text-text-300">Select Dialect</label>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {#each dialectOptions as dialectOption}
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

                <!-- Difficulty Selection -->
                <div class="space-y-3">
                  <label class="block text-lg font-bold text-text-300">Difficulty Level</label>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {#each difficultyOptions as option}
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

                <!-- Word Types -->
                <div class="space-y-3">
                  <label class="block text-lg font-bold text-text-300">Word Categories <span class="text-sm font-normal text-text-200 ml-2">(Optional)</span></label>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {#each wordTypeOptions as wordType}
                      <button
                        type="button"
                        class="text-left p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium capitalize {selectedWordTypes.includes(wordType) ? 'bg-tile-500 border-tile-600 text-text-300 shadow-sm' : 'bg-tile-200 border-tile-400 text-text-200 hover:bg-tile-400'}"
                        onclick={() => toggleWordType(wordType)}
                      >
                        <div class="flex items-center justify-between">
                          <span>{wordType}</span>
                          {#if selectedWordTypes.includes(wordType)}
                            <span>✓</span>
                          {/if}
                        </div>
                      </button>
                    {/each}
                  </div>
                </div>

                <!-- Custom Request -->
                <div class="space-y-3 bg-tile-400/30 p-6 rounded-xl border border-tile-500">
                  <label class="block text-lg font-bold text-text-300">Custom Topic <span class="text-sm font-normal text-text-200 ml-2">(Optional)</span></label>
                  <p class="text-sm text-text-200 mb-4">Be specific! e.g., "kitchen utensils", "office slang", "terms for getting directions".</p>
                  <textarea
                    bind:value={customWordRequest}
                    rows="3"
                    class="w-full rounded-lg border-2 border-tile-500 bg-tile-200 p-3 text-text-300 focus:border-tile-600 focus:ring-0 transition-colors"
                    placeholder="Describe the words you want..."
                  ></textarea>
                </div>

                <div class="pt-4">
                  <Button type="submit" className="w-full !py-4 !text-lg !rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                    Generate Words
                  </Button>
                </div>
              </form>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Generation Result Modal -->
    {#if showGenerationModal && generationComplete}
      <Modal isOpen={showGenerationModal} handleCloseModal={closeGenerationModal} width="600px">
        <div class="p-8 text-center">
          <div class="text-7xl mb-6">🎉</div>
          <h2 class="text-3xl font-bold text-text-300 mb-4">Generation Complete!</h2>
          <p class="text-xl text-text-200 mb-8 leading-relaxed">
            Successfully added <strong class="text-text-300">{savedCount}</strong> new {generationType === 'sentences' ? 'sentence' : 'word'}{savedCount !== 1 ? 's' : ''} to your review deck.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={startReviewSession} type="button" className="!bg-green-600 !hover:bg-green-700 !text-white !text-lg !px-8 !py-3">
              Start Reviewing
            </Button>
            <Button onClick={closeGenerationModal} type="button" className="!text-lg !px-8 !py-3">
              Close
            </Button>
          </div>
        </div>
      </Modal>
    {/if}
  </div>
</div>
