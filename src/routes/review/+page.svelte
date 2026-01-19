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
  import { getDefaultDialect } from '$lib/helpers/get-default-dialect';
  import { fetchUserReviewWords } from '$lib/helpers/fetch-review-words';

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
  let totalSavedWordsCount = $state(0);
  let forgottenWords = $state<ReviewWord[]>([]);
  let forgottenWordIndex = $state(0);
  
  // Sentence generation state
  let showGenerateSentences = $state(false);
  let isGeneratingSentences = $state(false);
  let selectedDialect = $state(getDefaultDialect(data.user));
  let difficultyOption = $state('a1');
  let selectedLearningTopics = $state<string[]>([]);
  let vocabularyWords = $state('');
  let vocabularyInputMode = $state('text');
  let vocabularyFile = $state<File | null>(null);
  let fileError = $state('');
  let generateError = $state<string | null>(null);
  let generateSuccess = $state<string | null>(null);
  
  // Review words only mode
  let useReviewWordsOnly = $state(false);
  let reviewWordsSource = $state<'all' | 'due-for-review'>('all');
  let reviewWords = $state<Array<{ arabic: string; english: string; transliteration: string }>>([]);
  let isLoadingReviewWords = $state(false);
  let reviewWordsError = $state('');
  
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
  
  // Generated items for selection
  let generatedItems = $state<Array<{ arabic: string; english: string; transliteration: string }>>([]);
  let selectedItems = $state<Set<number>>(new Set());
  let isImportingSelected = $state(false);
  
  function toggleItemSelection(index: number) {
    if (selectedItems.has(index)) {
      selectedItems.delete(index);
    } else {
      selectedItems.add(index);
    }
    selectedItems = new Set(selectedItems); // Trigger reactivity
  }
  
  function selectAllItems() {
    selectedItems = new Set(generatedItems.map((_, i) => i));
  }
  
  function deselectAllItems() {
    selectedItems = new Set();
  }
  
  async function importSelectedItems() {
    if (selectedItems.size === 0) return;
    
    isImportingSelected = true;
    try {
      const itemsToImport = Array.from(selectedItems).map(index => generatedItems[index]);
      
      const saveRes = await fetch('/api/save-sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentences: itemsToImport,
          dialect: selectedDialect
        })
      });

      const saveResult = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saveResult.error || 'Failed to save items');
      }

      savedCount = saveResult.saved;
      generationComplete = true;
      
      // Clear selections and close modal
      selectedItems = new Set();
      generatedItems = [];
      
      // Reload words to show new additions
      await loadWords();
    } catch (error) {
      generateError = error instanceof Error ? error.message : 'Failed to import selected items';
    } finally {
      isImportingSelected = false;
    }
  }

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
        forgottenWords = progress.forgottenWords || [];
        forgottenWordIndex = progress.forgottenWordIndex || 0;
        
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
        forgottenWords,
        forgottenWordIndex,
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
    // Clear localStorage if user changed (check stored user ID)
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('review-user-id');
      const currentUserId = data.user?.id;
      
      if (storedUserId && storedUserId !== currentUserId) {
        // User changed - clear all localStorage data
        clearProgress();
      }
      
      // Store current user ID
      if (currentUserId) {
        localStorage.setItem('review-user-id', currentUserId);
      }
    }
    
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
      totalSavedWordsCount = result.totalSavedWordsCount || 0;

      const loadedWords = result.words || [];
      const loadedForgottenWords = result.forgottenWords || [];
      
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
      
      // Use forgotten words from database, filtered to exclude words already in regular list
      forgottenWords = loadedForgottenWords.filter((forgottenWord: ReviewWord) => 
        !filteredWords.some((w: ReviewWord) => w.id === forgottenWord.id)
      );
      
      // Adjust currentIndex if it's beyond the filtered words length
      if (currentIndex >= words.length && words.length > 0 && forgottenWords.length === 0) {
        currentIndex = 0;
      }
      
      // If we have forgotten words and finished regular words, switch to forgotten
      if (currentIndex >= words.length && words.length > 0 && forgottenWords.length > 0) {
        forgottenWordIndex = 0;
      }
      
      // If all words were already reviewed in this batch and no forgotten words, mark session as complete
      if (words.length === 0 && loadedWords.length > 0 && forgottenWords.length === 0) {
        sessionComplete = true;
      } else if (words.length === 0 && forgottenWords.length === 0) {
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
    // Determine which word we're reviewing
    const isReviewingForgotten = currentIndex >= words.length;
    const word = isReviewingForgotten 
      ? forgottenWords[forgottenWordIndex] 
      : words[currentIndex];

    if (!word) return;

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
      
      // If reviewing forgotten word, remove it from forgotten words array
      if (isReviewingForgotten) {
        forgottenWords = forgottenWords.filter((_, i) => i !== forgottenWordIndex);
        // Adjust index if needed
        if (forgottenWordIndex >= forgottenWords.length && forgottenWords.length > 0) {
          forgottenWordIndex = forgottenWords.length - 1;
        }
      }
      
      // Update total review count if returned
      if (result.reviewCount !== undefined) {
        totalReviewCount = result.reviewCount;
        remainingFreeReviews = hasActiveSubscription ? null : Math.max(0, 5 - (totalReviewCount || 0));
      }
      
      // Save progress after each review
      saveProgress();
      
      if (isReviewingForgotten) {
        // We're reviewing forgotten words
        if (forgottenWords.length === 0) {
          // All forgotten words reviewed - session complete
          sessionComplete = true;
        } else if (forgottenWordIndex < forgottenWords.length) {
          // More forgotten words to review
          // Index already adjusted above if needed
        } else {
          // Shouldn't happen, but handle edge case
          forgottenWordIndex = 0;
        }
      } else {
        // We're reviewing regular words
        if (currentIndex < words.length - 1) {
          currentIndex++;
        } else {
          // Regular words done, check if we have forgotten words to review
          if (forgottenWords.length > 0) {
            // Switch to reviewing forgotten words
            currentIndex = words.length; // Set to beyond regular words
            forgottenWordIndex = 0;
          } else {
            // No forgotten words - session complete
            sessionComplete = true;
          }
        }
      }
      
      // Save progress again after moving
      saveProgress();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to record review';
    }
  }

  async function startNewSession() {
    currentIndex = 0;
    reviewedCount = 0;
    reviewedWordIds = new Set();
    sessionComplete = false;
    forgottenWords = [];
    forgottenWordIndex = 0;
    clearProgress();
    
    // Clear forgotten words in database
    try {
      await fetch('/api/clear-forgotten-words', { method: 'POST' });
    } catch (error) {
      console.error('Error clearing forgotten words:', error);
    }
    
    await loadWords();
  }

  async function handleForgot() {
    if (currentIndex >= words.length) {
      // We're reviewing forgotten words - mark current forgotten word as forgotten again
      const word = forgottenWords[forgottenWordIndex];
      if (word && !reviewedWordIds.has(word.id)) {
        // Remove from current position and add to end
        forgottenWords = forgottenWords.filter((_, i) => i !== forgottenWordIndex);
        forgottenWords.push(word);
        // Stay at the same index (which now points to the next word)
        // If we were at the last position, move back one
        if (forgottenWordIndex >= forgottenWords.length) {
          forgottenWordIndex = Math.max(0, forgottenWords.length - 1);
        }
        saveProgress();
      }
    } else {
      // We're reviewing regular words - add to forgotten words
      const word = words[currentIndex];
      if (word && !reviewedWordIds.has(word.id)) {
        // Mark as forgotten in database
        try {
          await fetch('/api/mark-word-forgotten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ saved_word_id: word.id })
          });
        } catch (error) {
          console.error('Error marking word as forgotten:', error);
        }
        
        forgottenWords.push({ ...word });
        reviewedWordIds.add(word.id);
        reviewedCount++;
        
        // Move to next word
        if (currentIndex < words.length - 1) {
          currentIndex++;
        } else {
          // Regular words done, switch to forgotten words if any
          if (forgottenWords.length > 0) {
            currentIndex = words.length;
            forgottenWordIndex = 0;
          } else {
            sessionComplete = true;
          }
        }
        saveProgress();
      }
    }
  }

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
    if (useReviewWordsOnly && showGenerateSentences && data.user?.id) {
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
    // Validate review words mode
    if (useReviewWordsOnly && reviewWords.length === 0) {
      generateError = `You don't have any ${reviewWordsSource === 'all' ? 'saved words' : 'words due for review'} yet. Add words to your review deck first.`;
      return;
    }

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
    
    if (!useReviewWordsOnly && vocabularyInputMode === 'file' && vocabularyFile) {
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
        throw new Error('Failed to parse generated sentences');
      }
      
      const newSentences = filterValidSentences(_sentences.sentences || []);
      
      if (newSentences.length === 0) {
        throw new Error('No valid sentences were generated. Please try again.');
      }

      // Store generated sentences for user selection instead of auto-saving
      generatedItems = newSentences;
      selectedItems = new Set(newSentences.map((_, i) => i)); // Select all by default
      generationComplete = true;
      isGeneratingSentences = false;
      
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
    generatedItems = [];
    selectedItems = new Set();
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

      // Store generated words for user selection instead of auto-saving
      generatedItems = newWords;
      selectedItems = new Set(newWords.map((_, i) => i)); // Select all by default
      generationComplete = true;
      isGeneratingWords = false;
      showGenerationModal = true; // Show selection modal
      
      // Reset form
      selectedWordTypes = [];
      customWordRequest = '';
      
      // Reload words to include new ones
      await loadWords();
      
    } catch (error) {
      console.error('Error generating words:', error);
      wordGenerateError = error instanceof Error ? error.message : 'An unexpected error occurred while generating words. Please try again.';
      generationComplete = false;
      showGenerationModal = false; // Close loading modal on error
      showGenerateWords = true; // Reopen form modal to show error
    } finally {
      isGeneratingWords = false;
    }
  }
</script>

<div class="min-h-screen bg-tile-300 py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
    <header class="mb-12 text-left">
      <h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-2 tracking-tight">Review Words</h1>
      <p class="text-text-200 text-lg sm:text-xl leading-snug max-w-2xl mb-4">
        Practice your saved words with spaced repetition
      </p>
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
    {:else if sessionComplete || (words.length === 0 && forgottenWords.length === 0)}
      <div class="max-w-5xl mx-auto space-y-12">
        {#if totalSavedWordsCount === 0}
          <!-- No words at all - first time user -->
          <div class="bg-tile-400/50 border-2 border-tile-600 rounded-xl p-8 sm:p-12 text-center shadow-lg transform transition-all duration-300 hover:shadow-xl">
            <div class="text-6xl mb-6 animate-bounce-subtle">📚</div>
            <h2 class="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-text-300 to-text-200 bg-clip-text" style="-webkit-background-clip: text; -webkit-text-fill-color: transparent;">
              Build Your Review Deck
            </h2>
            <p class="text-xl text-text-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              You don't have any words in your review deck yet. Start building your vocabulary by importing words or generating custom content below.
            </p>
          </div>
        {:else}
          <!-- Session complete - user has words but reviewed them all -->
          <div class="bg-tile-400/50 border-2 border-tile-600 rounded-xl p-8 sm:p-12 text-center shadow-lg transform transition-all duration-300 hover:shadow-xl">
            <div class="text-6xl mb-6 animate-bounce-subtle">🎉</div>
            <h2 class="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-text-300 to-text-200 bg-clip-text" style="-webkit-background-clip: text; -webkit-text-fill-color: transparent;">
              Session Complete!
            </h2>
            <p class="text-xl text-text-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Great job! You've reviewed all your scheduled words for now. Want to add more content to your deck?
            </p>
            <Button onClick={startNewSession} type="button" className="!text-lg !px-8 !py-3">
              Review More
            </Button>
          </div>
        {/if}

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">


          <!-- Generate Words -->
          <button
            class="group relative overflow-hidden flex flex-col items-center text-center p-8 rounded-xl border-2 border-tile-600 bg-gradient-to-br from-tile-400/50 to-tile-400/30 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
            onclick={() => { showGenerateWords = true; showGenerateSentences = false; }}
          >
            <!-- Background pattern -->
            <div class="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div class="absolute inset-0" style="background-image: repeating-linear-gradient(45deg, var(--tile6) 0, var(--tile6) 1px, transparent 0, transparent 50%); background-size: 10px 10px;"></div>
            </div>

            <div class="text-5xl mb-6 transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300 relative z-10">📝</div>
            <h3 class="text-2xl font-bold text-text-300 mb-3 relative z-10">Generate Words</h3>
            <p class="text-text-200 leading-relaxed relative z-10">
              Create custom vocabulary lists tailored to your level and interests. Perfect for beginners.
            </p>
          </button>

          <!-- Generate Sentences -->
          <button
            class="group relative overflow-hidden flex flex-col items-center text-center p-8 rounded-xl border-2 border-tile-600 bg-gradient-to-br from-tile-400/50 to-tile-400/30 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
            onclick={() => { showGenerateSentences = true; showGenerateWords = false; }}
          >
            <!-- Background pattern -->
            <div class="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div class="absolute inset-0" style="background-image: repeating-linear-gradient(45deg, var(--tile6) 0, var(--tile6) 1px, transparent 0, transparent 50%); background-size: 10px 10px;"></div>
            </div>

            <div class="text-5xl mb-6 transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300 relative z-10">✍️</div>
            <h3 class="text-2xl font-bold text-text-300 mb-3 relative z-10">Generate Sentences</h3>
            <p class="text-text-200 leading-relaxed relative z-10">
              Practice with AI-generated sentences focusing on specific grammar topics or vocabulary.
            </p>
          </button>

          <!-- Import Words -->
          <button
            class="group relative overflow-hidden flex flex-col items-center text-center p-8 rounded-xl border-2 border-tile-600 bg-gradient-to-br from-tile-400/50 to-tile-400/30 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
            onclick={() => goto('/review/import')}
          >
            <!-- Background pattern -->
            <div class="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div class="absolute inset-0" style="background-image: repeating-linear-gradient(45deg, var(--tile6) 0, var(--tile6) 1px, transparent 0, transparent 50%); background-size: 10px 10px;"></div>
            </div>

            <div class="text-5xl mb-6 transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300 relative z-10">📥</div>
            <h3 class="text-2xl font-bold text-text-300 mb-3 relative z-10">Import Words</h3>
            <p class="text-text-200 leading-relaxed relative z-10">
              Bulk import words from our library of over 20,000 terms or upload your own list.
            </p>
          </button>
        </div>
      </div>
    {:else if words.length === 0 && forgottenWords.length > 0}
      <div class="max-w-3xl mx-auto">
        <div class="mb-6 flex justify-between items-end px-2">
          <div class="text-text-300 font-medium text-lg">
            <span class="text-orange-400">Reviewing Forgotten</span> - Word <span class="text-2xl font-bold">{forgottenWordIndex + 1}</span><span class="text-text-200">/{forgottenWords.length}</span>
          </div>
          <div class="text-text-200 bg-tile-400/50 px-3 py-1 rounded-lg border border-tile-500">
            Reviewed: <span class="font-bold text-text-300">{reviewedCount}</span>
            <span class="ml-2 text-orange-400">• {forgottenWords.length} forgotten</span>
          </div>
        </div>
        
        <div class="w-full bg-tile-400/60 rounded-full h-4 mb-8 shadow-inner border border-tile-500">
          <div
            class="bg-gradient-to-r from-tile-600 to-tile-700 h-full rounded-full relative transition-all duration-500 ease-out overflow-hidden"
            style="width: {((forgottenWordIndex + 1) / forgottenWords.length) * 100}%"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-white/0 to-white/20"></div>
            <div class="absolute inset-0 bg-white/20 animate-shimmer"></div>
            <div class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white/90">
              {Math.round(((forgottenWordIndex + 1) / forgottenWords.length) * 100)}%
            </div>
          </div>
        </div>

        <div class="mb-12">
          <ReviewCard 
            word={forgottenWords[forgottenWordIndex]} 
            onReview={handleReview}
            onForgot={handleForgot}
          />
        </div>
        
        <!-- Mini Generation Options -->
        <div class="border-t border-tile-500 pt-8">
          <h3 class="text-xl font-bold text-text-300 text-center mb-6">Want to add more practice material?</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

            <button
              class="flex items-center justify-center gap-3 p-5 sm:p-4 rounded-xl border-2 border-tile-600 bg-tile-400/30 hover:bg-tile-400/60 active:scale-95 transition-all duration-200 min-h-[64px]"
              onclick={() => showGenerateWords = true}
            >
              <span class="text-2xl">📝</span>
              <span class="font-bold text-text-300">Generate Words</span>
            </button>
            <button
              class="flex items-center justify-center gap-3 p-5 sm:p-4 rounded-xl border-2 border-tile-600 bg-tile-400/30 hover:bg-tile-400/60 active:scale-95 transition-all duration-200 min-h-[64px]"
              onclick={() => showGenerateSentences = true}
            >
              <span class="text-2xl">✍️</span>
              <span class="font-bold text-text-300">Generate Sentences</span>
            </button>
            <button
              class="flex items-center justify-center gap-3 p-5 sm:p-4 rounded-xl border-2 border-tile-600 bg-tile-400/30 hover:bg-tile-400/60 active:scale-95 transition-all duration-200 min-h-[64px]"
              onclick={() => goto('/review/import')}
            >
              <span class="text-2xl">📥</span>
              <span class="font-bold text-text-300">Import Words</span>
            </button>
          </div>
        </div>
      </div>
    {:else}
      <div class="max-w-3xl mx-auto">
        <div class="mb-6 flex justify-between items-end px-2">
          <div class="text-text-300 font-medium text-lg">
            {#if currentIndex >= words.length}
              <span class="text-orange-400">Reviewing Forgotten</span> - Word <span class="text-2xl font-bold">{forgottenWordIndex + 1}</span><span class="text-text-200">/{forgottenWords.length}</span>
            {:else}
              Word <span class="text-2xl font-bold">{currentIndex + 1}</span><span class="text-text-200">/{words.length}</span>
            {/if}
          </div>
          <div class="text-text-200 bg-tile-400/50 px-3 py-1 rounded-lg border border-tile-500">
            Reviewed: <span class="font-bold text-text-300">{reviewedCount}</span>
            {#if forgottenWords.length > 0}
              <span class="ml-2 text-orange-400">• {forgottenWords.length} forgotten</span>
            {/if}
          </div>
        </div>
        
        <div class="w-full bg-tile-400/60 rounded-full h-4 mb-8 shadow-inner border border-tile-500">
          {#if true}
            {@const totalWords = words.length + forgottenWords.length}
            {@const currentPosition = currentIndex >= words.length ? words.length + forgottenWordIndex + 1 : currentIndex + 1}
            <div
              class="bg-gradient-to-r from-tile-600 to-tile-700 h-full rounded-full relative transition-all duration-500 ease-out overflow-hidden"
              style="width: {(currentPosition / totalWords) * 100}%"
            >
              <div class="absolute inset-0 bg-gradient-to-t from-white/0 to-white/20"></div>
              <div class="absolute inset-0 bg-white/20 animate-shimmer"></div>
              <div class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white/90">
                {Math.round((currentPosition / totalWords) * 100)}%
              </div>
            </div>
          {/if}
        </div>

        <div class="mb-12">
          <ReviewCard 
            word={currentIndex >= words.length ? forgottenWords[forgottenWordIndex] : words[currentIndex]} 
            onReview={handleReview}
            onForgot={handleForgot}
          />
        </div>
        
        <!-- Mini Generation Options -->
        <div class="border-t border-tile-500 pt-8">
          <h3 class="text-xl font-bold text-text-300 text-center mb-6">Want to add more practice material?</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <button
              class="flex items-center justify-center gap-3 p-5 sm:p-4 rounded-xl border-2 border-tile-600 bg-tile-400/30 hover:bg-tile-400/60 active:scale-95 transition-all duration-200 min-h-[64px]"
              onclick={() => showGenerateWords = true}
            >
              <span class="text-2xl">📝</span>
              <span class="font-bold text-text-300">Generate Words</span>
            </button>
            <button
              class="flex items-center justify-center gap-3 p-5 sm:p-4 rounded-xl border-2 border-tile-600 bg-tile-400/30 hover:bg-tile-400/60 active:scale-95 transition-all duration-200 min-h-[64px]"
              onclick={() => showGenerateSentences = true}
            >
              <span class="text-2xl">✍️</span>
              <span class="font-bold text-text-300">Generate Sentences</span>
            </button>
            <button
              class="flex items-center justify-center gap-3 p-5 sm:p-4 rounded-xl border-2 border-tile-600 bg-tile-400/30 hover:bg-tile-400/60 active:scale-95 transition-all duration-200 min-h-[64px]"
              onclick={() => goto('/review/import')}
            >
              <span class="text-2xl">📥</span>
              <span class="font-bold text-text-300">Import Words</span>
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
                        class="peer w-5 h-5 cursor-pointer appearance-none rounded border border-tile-600 bg-tile-200 checked:bg-tile-600 checked:border-tile-600 focus:ring-offset-0 focus:ring-1 focus:ring-tile-500 transition-all"
                      />
                      <svg class="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1 top-1 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                  </div>
                </div>

                {#if useReviewWordsOnly}
                  <!-- Review Words Only Mode -->
                  <div class="flex flex-col gap-4 bg-tile-400/30 p-4 rounded-xl border border-tile-500/50">
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
                          {reviewWords.length} word{reviewWords.length !== 1 ? 's' : ''} will be used in your sentences
                        </p>
                      </div>
                    {/if}

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
                {/if}
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

    <!-- Generation Loading Modal -->
    {#if showGenerationModal && !generationComplete}
      <Modal isOpen={showGenerationModal} handleCloseModal={() => { showGenerationModal = false; }} width="600px">
        <div class="p-8 text-center relative">
          <!-- Animated background -->
          <div class="absolute inset-0 bg-gradient-to-br from-tile-200 to-tile-300 opacity-50 rounded-xl"></div>

          <div class="relative z-10">
            <!-- Enhanced spinner -->
            <div class="w-24 h-24 mx-auto mb-6 relative">
              <div class="absolute inset-0 border-4 border-tile-400 rounded-full"></div>
              <div class="absolute inset-0 border-4 border-tile-600 rounded-full border-t-transparent animate-spin"></div>
              <div class="absolute inset-2 bg-tile-300 rounded-full flex items-center justify-center text-3xl">✨</div>
            </div>

            <h2 class="text-3xl font-bold text-text-300 mb-4 animate-pulse">
              Generating {generationType === 'sentences' ? 'Sentences' : 'Words'}...
            </h2>
            <p class="text-xl text-text-200 mb-8 leading-relaxed">
              {generationType === 'sentences'
                ? `Creating personalized practice sentences in ${dialectOptions.find(d => d.value === selectedDialect)?.label}. This usually takes about 30-60 seconds.`
                : `Curating a list of ${dialectOptions.find(d => d.value === selectedDialect)?.label} words based on your preferences. Almost there!`}
            </p>
            <div class="bg-gradient-to-br from-tile-300/50 to-tile-400/30 border border-tile-500 rounded-xl p-4 text-left shadow-inner">
              <div class="flex items-start gap-3">
                <span class="text-2xl">💡</span>
                <div>
                  <p class="font-bold text-text-300 text-sm mb-1">Pro Tip</p>
                  <p class="text-text-200 text-sm">
                    You can close this modal and continue using the app. We'll notify you when your {generationType === 'sentences' ? 'sentences' : 'words'} are ready!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    {/if}

    <!-- Generation Selection Modal -->
    {#if showGenerationModal && generationComplete && generatedItems.length > 0}
      <Modal isOpen={showGenerationModal} handleCloseModal={closeGenerationModal} width="800px">
        <div class="p-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-3xl font-bold text-text-300">
              Select {generationType === 'sentences' ? 'Sentences' : 'Words'} to Import
            </h2>
            <button 
              class="p-2 hover:bg-tile-400 rounded-lg transition-colors text-text-200 hover:text-text-300"
              onclick={closeGenerationModal}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <div class="mb-4 flex items-center justify-between">
            <p class="text-text-200">
              {selectedItems.size} of {generatedItems.length} selected
            </p>
            <div class="flex gap-2">
              <button
                type="button"
                onclick={selectAllItems}
                class="px-4 py-2 text-sm bg-tile-400 hover:bg-tile-500 text-text-300 rounded-lg transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onclick={deselectAllItems}
                class="px-4 py-2 text-sm bg-tile-400 hover:bg-tile-500 text-text-300 rounded-lg transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>
          
          <div class="max-h-[500px] overflow-y-auto space-y-3 mb-6 scrollbar-thin">
            {#each generatedItems as item, index}
              <div
                class="p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer transform hover:scale-[1.01] {selectedItems.has(index) ? 'border-tile-600 bg-gradient-to-br from-tile-400/70 to-tile-400/50 shadow-md' : 'border-tile-500 bg-tile-300/30 hover:bg-tile-400/40 hover:shadow-sm'}"
                onclick={() => toggleItemSelection(index)}
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleItemSelection(index); } }}
                role="button"
                tabindex="0"
              >
                <div class="flex items-start gap-4">
                  <div class="relative flex-shrink-0 mt-1 group">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(index)}
                      onchange={() => toggleItemSelection(index)}
                      class="w-6 h-6 cursor-pointer rounded-md border-2 border-tile-600 bg-tile-200 checked:bg-gradient-to-br checked:from-tile-600 checked:to-tile-700 checked:border-tile-700 transition-all duration-200 group-hover:scale-110"
                    />
                  </div>
                  <div class="flex-1 space-y-2">
                    <div class="text-2xl sm:text-3xl font-bold text-text-300 leading-tight">{item.arabic}</div>
                    <div class="text-base sm:text-lg text-text-200">{item.english}</div>
                    <div class="text-sm text-text-200/80 italic font-light">{item.transliteration}</div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
          
          {#if generateError}
            <div class="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
              <p>{generateError}</p>
            </div>
          {/if}
          
          <div class="flex flex-col sm:flex-row gap-4 justify-end">
            <Button 
              onClick={closeGenerationModal} 
              type="button" 
              className="!text-lg !px-8 !py-3"
            >
              Cancel
            </Button>
            <Button 
              onClick={importSelectedItems} 
              type="button" 
              className="!bg-green-600 !hover:bg-green-700 !text-white !text-lg !px-8 !py-3"
              disabled={selectedItems.size === 0 || isImportingSelected}
            >
              {#if isImportingSelected}
                Importing...
              {:else}
                Import {selectedItems.size} {generationType === 'sentences' ? 'Sentence' : 'Word'}{selectedItems.size !== 1 ? 's' : ''}
              {/if}
            </Button>
          </div>
        </div>
      </Modal>
    {/if}
    
    <!-- Import Success Modal -->
    {#if showGenerationModal && generationComplete && generatedItems.length === 0 && savedCount > 0}
      <Modal isOpen={showGenerationModal} handleCloseModal={closeGenerationModal} width="600px">
        <div class="p-8 text-center">
          <div class="text-7xl mb-6">🎉</div>
          <h2 class="text-3xl font-bold text-text-300 mb-4">Import Complete!</h2>
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
