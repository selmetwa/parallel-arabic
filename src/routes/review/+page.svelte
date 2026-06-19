<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import ReviewCard from './components/ReviewCard.svelte';
  import GenerateWordsModal from '$lib/components/review/GenerateWordsModal.svelte';
  import GenerateSentencesModal from '$lib/components/review/GenerateSentencesModal.svelte';
  import ImportWordsModal from '$lib/components/review/ImportWordsModal.svelte';
  import type { PageData } from './$types';
  import { userXp, userLevel } from '$lib/store/xp-store';
  import { showXpToast } from '$lib/helpers/toast-helpers';
  import { LEVEL_TIERS } from '$lib/helpers/xp-levels';
  import AlphabetCycle from '$lib/components/AlphabetCycle.svelte';
  import { PUBLIC_PRICE_ID } from '$env/static/public';
  import SubscribeButton from '$lib/components/SubscribeButton.svelte';
  import { trackEvent } from '$lib/analytics';

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
  let reviewCycleXpAwarded = $state(false);

  $effect(() => {
    if (sessionComplete && !reviewCycleXpAwarded && reviewedCount > 0) {
      reviewCycleXpAwarded = true;
      trackEvent('review_session_completed', { total_reviewed: reviewedCount, forgotten_count: forgottenWords.length });
      fetch('/api/award-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'review_cycle' })
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            userXp.set(data.newTotalXp);
            if (data.leveledUp) userLevel.set(data.newLevel);
            const title = LEVEL_TIERS.find((t) => t.level === data.newLevel)?.title;
            showXpToast(data.xpAwarded, data.leveledUp, data.newLevel, title);
          }
        })
        .catch(() => {});
    }
  });
  let reviewedWordIds = $state<Set<string>>(new Set());
  let totalReviewCount = $state<number | null>(null);
  let hasActiveSubscription = $state(false);
  let remainingFreeReviews = $state<number | null>(null);
  let requiresSubscription = $state(false);
  let totalSavedWordsCount = $state(0);
  let forgottenWords = $state<ReviewWord[]>([]);
  let forgottenWordIndex = $state(0);
  let showGraduationModal = $state(false);
  
  // Generation + import modal visibility
  let showGenerateSentences = $state(false);
  let showGenerateWords = $state(false);
  let showImport = $state(false);

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
      trackEvent('review_word_answered', { word_id: word.id, difficulty, correct: difficulty >= 1, dialect: word.dialect });
      console.log({ difficulty });
      if (difficulty >= 1) {
        fetch('/api/award-xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType: 'review_correct' })
        })
          .then((r) => r.json())
          .then((xpData) => {
            if (xpData.success) {
              userXp.set(xpData.newTotalXp);
                userXp.set(xpData.newTotalXp);
              if (xpData.leveledUp) userLevel.set(xpData.newLevel);
              const title = LEVEL_TIERS.find((t) => t.level === xpData.newLevel)?.title;
              showXpToast(xpData.xpAwarded, xpData.leveledUp, xpData.newLevel, title);
              // if (xpData.leveledUp) {
              //   userLevel.set(xpData.newLevel);
              //   const title = LEVEL_TIERS.find((t) => t.level === xpData.newLevel)?.title;
              //   showXpToast(xpData.xpAwarded, xpData.leveledUp, xpData.newLevel, title);
              // } else {
              //   const title = LEVEL_TIERS.find((t) => t.level === xpData.previousLevel)?.title;
              //   showXpToast(result.xpAwarded, result.leveledUp, result.newLevel, title);
              // }
            }
          })
          .catch(() => {});
      }
      
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
    trackEvent('review_session_new_started', { previous_reviewed_count: reviewedCount });
    currentIndex = 0;
    reviewedCount = 0;
    reviewedWordIds = new Set();
    sessionComplete = false;
    forgottenWords = [];
    forgottenWordIndex = 0;
    reviewCycleXpAwarded = false;
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
        
        trackEvent('review_word_marked_forgotten', { word_id: word.id, dialect: word.dialect });
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

</script>

<div class="min-h-screen bg-tile-300 py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
    <header class="mb-12 text-left">
      <h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-2 tracking-tight">Review Words</h1>
      <p class="text-text-200 text-lg sm:text-xl leading-snug max-w-2xl mb-4 flex items-center gap-2">
        Practice your saved words with spaced repetition
        <button
          onclick={() => { showGraduationModal = true; trackEvent('review_graduation_info_opened'); }}
          class="w-5 h-5 rounded-full bg-tile-500 hover:bg-tile-600 text-text-200 hover:text-text-300 text-xs font-bold transition-colors flex items-center justify-center leading-none shrink-0"
          aria-label="How graduation works"
        >?</button>
      </p>
    </header>

    <!-- Graduation Info Modal -->
    {#if showGraduationModal}
      <div role="dialog" aria-modal="true" aria-labelledby="grad-modal-title" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button class="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default" onclick={() => (showGraduationModal = false)} aria-label="Close modal" tabindex="-1"></button>
        <div class="relative z-10 bg-tile-400 border border-tile-600 rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 id="grad-modal-title" class="text-base font-bold text-text-300">How graduation works</h2>
            <button onclick={() => (showGraduationModal = false)} class="w-8 h-8 rounded-full bg-tile-600 hover:bg-tile-500 text-text-200 hover:text-text-300 transition-colors flex items-center justify-center text-lg leading-none" aria-label="Close modal">×</button>
          </div>
          <div class="space-y-4 text-sm text-text-200">
            <div class="space-y-2">
              <div class="flex items-start gap-3">
                <span class="mt-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                <p><span class="font-semibold text-text-300">Learning</span> — words you're actively building memory for, reviewed frequently until they stick.</p>
              </div>
              <div class="flex items-start gap-3">
                <span class="mt-0.5 w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0"></span>
                <p><span class="font-semibold text-text-300">Due</span> — words ready to review today: all learning words plus any scheduled ones whose date has arrived.</p>
              </div>
            </div>
            <div class="border-t border-tile-600"></div>
            <p>A word <span class="font-semibold text-text-300">graduates out of Learning</span> once it reaches a 30-day review interval — roughly 5 "Easy" ratings in a row.</p>
            <div>
              <p class="font-semibold text-text-300 mb-2">Interval progression</p>
              <div class="bg-tile-500 rounded-lg overflow-hidden border border-tile-600">
                <table class="w-full text-xs">
                  <thead>
                    <tr class="border-b border-tile-600">
                      <th class="text-left px-3 py-2 text-text-200 font-semibold">Review</th>
                      <th class="text-left px-3 py-2 text-text-200 font-semibold">Next interval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each [
                      { label: '1st', interval: '1 day' },
                      { label: '2nd', interval: '3 days' },
                      { label: '3rd', interval: '~7 days' },
                      { label: '4th', interval: '~17 days' },
                      { label: '5th', interval: '~42 days (graduated!)' },
                    ] as row, i (row.label)}
                      <tr class={i % 2 === 0 ? 'bg-tile-500' : 'bg-tile-400'}>
                        <td class="px-3 py-2 text-text-300">{row.label}</td>
                        <td class="px-3 py-2 text-text-200">{row.interval}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="flex gap-3 text-xs">
              <div class="flex-1 bg-green-900/30 border border-green-800/50 rounded-lg p-3">
                <p class="font-semibold text-green-400 mb-1">Easy</p>
                <p>Grows the interval faster — you'll see the word less often.</p>
              </div>
              <div class="flex-1 bg-red-900/30 border border-red-800/50 rounded-lg p-3">
                <p class="font-semibold text-red-400 mb-1">Hard</p>
                <p>Resets the interval — the word comes back sooner.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if requiresSubscription}
      <div class="max-w-3xl mx-auto bg-yellow-50 border-2 border-yellow-400 rounded-xl p-8 text-center mb-12 shadow-lg">
        <div class="text-5xl mb-4">👑</div>
        <h2 class="text-2xl font-bold text-yellow-800 mb-4">Free Limit Reached</h2>
        <p class="text-lg text-yellow-700 mb-8">
          You've completed {totalReviewCount} word review{totalReviewCount !== 1 ? 's' : ''}. 
          Subscribe to continue using spaced repetition and unlock unlimited reviews!
        </p>
        <div class="flex justify-center">
          <SubscribeButton className="!bg-yellow-600 !hover:bg-yellow-700 !border-yellow-700 !text-white !text-lg !px-8 !py-3" />
        </div>
      </div>

    {:else if isLoading}
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
            onclick={() => { showGenerateWords = true; showGenerateSentences = false; trackEvent('review_generate_words_opened'); }}
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
            onclick={() => { showGenerateSentences = true; showGenerateWords = false; trackEvent('review_generate_sentences_opened'); }}
          >
            <!-- Background pattern -->
            <div class="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div class="absolute inset-0" style="background-image: repeating-linear-gradient(45deg, var(--tile6) 0, var(--tile6) 1px, transparent 0, transparent 50%); background-size: 10px 10px;"></div>
            </div>

            <div class="text-5xl mb-6 transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300 relative z-10">✍️</div>
            <h3 class="text-2xl font-bold text-text-300 mb-3 relative z-10">Generate Sentences</h3>
            <p class="text-text-200 leading-relaxed relative z-10">
              Practice with custom practice sentences focusing on specific grammar topics or vocabulary.
            </p>
          </button>

          <!-- Import Words -->
          <button
            class="group relative overflow-hidden flex flex-col items-center text-center p-8 rounded-xl border-2 border-tile-600 bg-gradient-to-br from-tile-400/50 to-tile-400/30 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
            onclick={() => { showImport = true; }}
          >
            <!-- Background pattern -->
            <div class="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
              <div class="absolute inset-0" style="background-image: repeating-linear-gradient(45deg, var(--tile6) 0, var(--tile6) 1px, transparent 0, transparent 50%); background-size: 10px 10px;"></div>
            </div>

            <div class="text-5xl mb-6 transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300 relative z-10">📥</div>
            <h3 class="text-2xl font-bold text-text-300 mb-3 relative z-10">Import Words</h3>
            <p class="text-text-200 leading-relaxed relative z-10">
              Bulk import words from our library or upload your own list.
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
            class="bg-gradient-to-r from-tile-600 to-tile-700 h-full rounded-full relative overflow-hidden"
            style="width: {((forgottenWordIndex + 1) / forgottenWords.length) * 100}%"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-white/0 to-white/20"></div>
            <div class="absolute inset-0 bg-white/20"></div>
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
              onclick={() => { showImport = true; }}
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
              <div class="absolute inset-0 bg-white/20 "></div>
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
              onclick={() => { showImport = true; }}
            >
              <span class="text-2xl">📥</span>
              <span class="font-bold text-text-300">Import Words</span>
            </button>
          </div>
        </div>
      </div>
    {/if}

    <GenerateWordsModal
      bind:open={showGenerateWords}
      user={data.user}
      onCompleted={loadWords}
      onStartReviewing={startNewSession}
    />

    <GenerateSentencesModal
      bind:open={showGenerateSentences}
      user={data.user}
      onCompleted={loadWords}
      onStartReviewing={startNewSession}
    />

    <ImportWordsModal bind:open={showImport} user={data.user} onImported={loadWords} />
  </div>
</div>
