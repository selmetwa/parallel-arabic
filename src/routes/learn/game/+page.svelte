<script lang="ts">
  import { goto } from '$app/navigation';
  import SectionHeader from '$lib/components/SectionHeader.svelte';
  import AuthModal from '$lib/components/AuthModal.svelte';
  import type { Dialect } from '$lib/types/index';
  import { fetchUserReviewWords } from '$lib/helpers/fetch-review-words';

  let { data } = $props();

  // Auth modal state
  let showAuthModal = $state(false);

  // In-progress games
  let inProgressGames = $state(data.inProgressGames || []);
  let deletingGameId = $state<string | null>(null);

  function formatLastPlayed(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  function getDialectEmoji(dialect: string): string {
    const emojis: { [key: string]: string } = {
      'egyptian-arabic': '🇪🇬',
      'levantine': '🇱🇧',
      'darija': '🇲🇦',
      'fusha': '📖'
    };
    return emojis[dialect] || '🌍';
  }

  function getCategoryName(dialect: string, category: string): string {
    return data.categoryNameLookup?.[dialect]?.[category] || category;
  }

  function continueGame(game: typeof inProgressGames[0]) {
    const params = new URLSearchParams();
    params.set('dialect', game.dialect);
    params.set('mode', game.game_mode);
    params.set('category', game.category);
    params.set('resumeId', game.id);

    // Store the game state in sessionStorage for resuming
    sessionStorage.setItem('resumeGame', JSON.stringify({
      id: game.id,
      currentIndex: game.current_index,
      score: game.score,
      wordsToReview: game.words_to_review,
      questionOrder: game.question_order,
      totalQuestions: game.total_questions
    }));

    goto(`/learn/game/play?${params.toString()}`);
  }

  async function deleteGame(gameId: string) {
    deletingGameId = gameId;
    try {
      const response = await fetch('/api/game-progress', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gameId })
      });

      if (response.ok) {
        inProgressGames = inProgressGames.filter(g => g.id !== gameId);
      }
    } catch (error) {
      console.error('Error deleting game:', error);
    } finally {
      deletingGameId = null;
    }
  }

  // Game setup state
  let selectedDialect = $state<Dialect>('egyptian-arabic');
  let selectedCategory = $state('verbs');
  let selectedMode = $state<'multiple-choice' | 'listening' | 'speaking'>('multiple-choice');
  let useCustomWords = $state(false);
  let customTopic = $state('');
  let difficulty = $state('a1');
  let questionCount = $state(10);
  let contentType = $state<'words' | 'sentences'>('sentences'); // Default to sentences for better context learning

  // Learning topics for sentences (multiselect)
  const learningTopics = [
    { id: 'verb-conjugation', label: 'Verb Conjugation', icon: '🔄' },
    { id: 'noun-plurals', label: 'Noun Plurals', icon: '📝' },
    { id: 'past-tense', label: 'Past Tense', icon: '⏪' },
    { id: 'present-tense', label: 'Present Tense', icon: '▶️' },
    { id: 'future-tense', label: 'Future Tense', icon: '⏩' },
    { id: 'numbers', label: 'Numbers', icon: '🔢' },
    { id: 'possessives', label: 'Possessive Suffixes', icon: '👤' },
    { id: 'questions', label: 'Questions', icon: '❓' }
  ];
  let selectedLearningTopics = $state<string[]>([]);

  // Review words seeding
  let useReviewWords = $state(false);
  let reviewWordsSource = $state<'all' | 'due-for-review'>('all');
  let reviewWords = $state<Array<{ arabic: string; english: string; transliteration: string }>>([]);
  let isLoadingReviewWords = $state(false);
  let reviewWordsError = $state('');

  function toggleLearningTopic(topicId: string) {
    if (selectedLearningTopics.includes(topicId)) {
      selectedLearningTopics = selectedLearningTopics.filter(t => t !== topicId);
    } else {
      selectedLearningTopics = [...selectedLearningTopics, topicId];
    }
  }

  async function loadReviewWords() {
    if (!data.user?.id) return;

    isLoadingReviewWords = true;
    reviewWordsError = '';

    try {
      const words = await fetchUserReviewWords(data.user.id, reviewWordsSource);
      reviewWords = words;

      if (words.length === 0) {
        reviewWordsError = `You don't have any ${reviewWordsSource === 'all' ? 'saved words' : 'words due for review'} yet.`;
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
    if (useReviewWords && data.user?.id && contentType === 'sentences') {
      loadReviewWords();
    } else {
      reviewWords = [];
      reviewWordsError = '';
    }
  });

  // Get available categories based on selected dialect
  let availableCategories = $derived.by(() => {
    return data.categories[selectedDialect as keyof typeof data.categories] || [];
  });

  // Reset category when dialect changes
  let previousDialect = $state<Dialect | undefined>(undefined);
  $effect(() => {
    if (previousDialect !== undefined && selectedDialect !== previousDialect) {
      const cats = data.categories[selectedDialect as keyof typeof data.categories] || [];
      if (cats.length > 0) {
        selectedCategory = cats[0].path;
      }
    }
    previousDialect = selectedDialect;
  });

  function getDialectLabel(dialect: string): string {
    const labels: { [key: string]: string } = {
      'egyptian-arabic': 'Egyptian Arabic',
      'levantine': 'Levantine Arabic',
      'darija': 'Moroccan Darija',
      'fusha': 'Modern Standard Arabic (Fusha)'
    };
    return labels[dialect] || dialect;
  }

  function getModeIcon(mode: string): string {
    switch (mode) {
      case 'multiple-choice': return '?';
      case 'listening': return '=';
      case 'speaking': return '?';
      default: return '?';
    }
  }

  function getModeDescription(mode: string): string {
    switch (mode) {
      case 'multiple-choice': return 'See a word and select the correct translation from multiple options';
      case 'listening': return 'Listen to audio and select the correct word or meaning';
      case 'speaking': return 'See a word and practice pronouncing it correctly';
      default: return '';
    }
  }

  function startGame() {
    // Show auth modal for logged out users
    if (!data.user) {
      showAuthModal = true;
      return;
    }

    const params = new URLSearchParams();
    params.set('dialect', selectedDialect);
    params.set('mode', selectedMode);
    params.set('difficulty', difficulty);
    params.set('contentType', contentType);

    if (useCustomWords) {
      params.set('custom', 'true');
      params.set('count', questionCount.toString());
      if (customTopic) {
        params.set('topic', customTopic);
      }
      // For sentences, include learning topics
      if (contentType === 'sentences' && selectedLearningTopics.length > 0) {
        params.set('learningTopics', selectedLearningTopics.join(','));
      }
      // If using review words for sentences
      if (contentType === 'sentences' && useReviewWords && reviewWords.length > 0) {
        params.set('useReviewWords', 'true');
        // Store review words in sessionStorage since they can be large
        sessionStorage.setItem('gameReviewWords', JSON.stringify(reviewWords));
      }
    } else {
      // For category mode, we use all words from the category
      params.set('category', selectedCategory);
    }

    goto(`/learn/game/play?${params.toString()}`);
  }
</script>

<svelte:head>
  <title>Vocabulary Game - Practice Arabic</title>
  <meta name="description" content="Play interactive games to practice Arabic vocabulary. Choose from multiple choice, listening, and speaking modes." />
</svelte:head>

<section class="px-3 py-6 sm:px-8 max-w-4xl mx-auto">
  <SectionHeader title="Vocabulary Game" />

  <p class="text-text-200 text-lg mb-8">
    Practice your Arabic vocabulary through interactive games. Choose your dialect, category, and game mode to get started.
  </p>

  <!-- In-Progress Games -->
  {#if inProgressGames.length > 0}
    <div class="mb-8 bg-gradient-to-br from-sky-500/10 to-blue-500/10 border-2 border-sky-500/30 rounded-xl p-6">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-2xl">🎮</span>
        <h2 class="text-xl font-bold text-text-300">Continue Playing</h2>
      </div>
      <div class="space-y-3">
        {#each inProgressGames as game}
          <div class="bg-tile-400 border-2 border-tile-600 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <span class="text-2xl">{getDialectEmoji(game.dialect)}</span>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-text-300 truncate">
                  {getCategoryName(game.dialect, game.category)}
                </p>
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-200">
                  <span>{getDialectLabel(game.dialect)}</span>
                  <span class="text-text-100">•</span>
                  <span class="capitalize">{game.game_mode.replace('-', ' ')}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-4 sm:gap-6">
              <!-- Progress -->
              <div class="text-center">
                <p class="text-lg font-bold text-text-300">{game.current_index}/{game.total_questions}</p>
                <p class="text-xs text-text-100">Progress</p>
              </div>

              <!-- Score -->
              <div class="text-center">
                <p class="text-lg font-bold text-emerald-600">{game.score}</p>
                <p class="text-xs text-text-100">Score</p>
              </div>

              <!-- Last Played -->
              <div class="text-center hidden sm:block">
                <p class="text-sm font-medium text-text-200">{formatLastPlayed(game.last_played_at)}</p>
                <p class="text-xs text-text-100">Last played</p>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button
                  onclick={() => continueGame(game)}
                  class="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-all active:scale-95"
                >
                  Continue
                </button>
                <button
                  onclick={() => deleteGame(game.id)}
                  disabled={deletingGameId === game.id}
                  class="p-2 text-text-100 hover:text-rose-400 hover:bg-tile-500 rounded-lg transition-all disabled:opacity-50"
                  title="Delete game"
                >
                  {#if deletingGameId === game.id}
                    <div class="w-5 h-5 border-2 border-text-100 border-t-transparent rounded-full animate-spin"></div>
                  {:else}
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  {/if}
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="space-y-8">
    <!-- Dialect Selection -->
    <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-6">
      <h2 class="text-xl font-bold text-text-300 mb-4">1. Select Dialect</h2>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {#each data.dialects as dialect}
          <button
            onclick={() => selectedDialect = dialect as Dialect}
            class="px-4 py-3 rounded-lg font-semibold transition-all text-sm {selectedDialect === dialect
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-tile-300 text-text-200 md:hover:bg-tile-500 border-2 border-tile-600'}"
          >
            {getDialectLabel(dialect)}
          </button>
        {/each}
      </div>
    </div>

    <!-- Word Source Selection -->
    <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-6">
      <h2 class="text-xl font-bold text-text-300 mb-4">2. Word Source</h2>

      <div class="flex gap-4 mb-4">
        <button
          onclick={() => useCustomWords = false}
          class="flex-1 px-4 py-3 rounded-lg font-semibold transition-all {!useCustomWords
            ? 'bg-blue-500 text-white shadow-lg'
            : 'bg-tile-300 text-text-200 md:hover:bg-tile-500 border-2 border-tile-600'}"
        >
          Use Category
        </button>
        <button
          onclick={() => useCustomWords = true}
          class="flex-1 px-4 py-3 rounded-lg font-semibold transition-all {useCustomWords
            ? 'bg-blue-500 text-white shadow-lg'
            : 'bg-tile-300 text-text-200 md:hover:bg-tile-500 border-2 border-tile-600'}"
        >
          Generate Custom Words
        </button>
      </div>

      {#if !useCustomWords}
        <div>
          <label for="category" class="block text-sm font-semibold text-text-300 mb-2">
            Category
          </label>
          <select
            id="category"
            bind:value={selectedCategory}
            class="w-full px-4 py-3 bg-tile-300 border-2 border-tile-600 text-text-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            {#each availableCategories as category}
              <option value={category.path}>{category.name} ({category.count} words)</option>
            {/each}
          </select>
          <p class="text-text-100 text-sm mt-1">You'll practice all words in this category</p>
        </div>
      {:else}
        <div class="space-y-4">
          <!-- Content Type: Words or Sentences -->
          <div>
            <label class="block text-sm font-semibold text-text-300 mb-2">
              Content Type
            </label>
            <div class="flex gap-3">
              <button
                onclick={() => contentType = 'words'}
                class="flex-1 px-4 py-3 rounded-lg font-semibold transition-all {contentType === 'words'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-tile-300 text-text-200 md:hover:bg-tile-500 border-2 border-tile-600'}"
              >
                Words
              </button>
              <button
                onclick={() => contentType = 'sentences'}
                class="flex-1 px-4 py-3 rounded-lg font-semibold transition-all {contentType === 'sentences'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-tile-300 text-text-200 md:hover:bg-tile-500 border-2 border-tile-600'}"
              >
                Sentences (Recommended)
              </button>
            </div>
            {#if contentType === 'sentences'}
              <div class="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p class="text-text-300 text-sm">
                  Sentences help with context-based learning - you'll understand how words are used in real conversations!
                </p>
              </div>
            {:else}
              <p class="text-text-100 text-sm mt-1">Practice individual vocabulary words</p>
            {/if}
          </div>

          {#if contentType === 'sentences'}
            <!-- Review Words Seeding Option -->
            {#if data.user}
              <div class="p-4 bg-tile-300 border-2 border-tile-600 rounded-lg">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="font-semibold text-text-300">Use Your Review Words</p>
                    <p class="text-sm text-text-200">Generate sentences using words from your saved vocabulary</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" bind:checked={useReviewWords} class="sr-only peer" />
                    <div class="w-12 h-7 bg-tile-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {#if useReviewWords}
                  <div class="mt-4 space-y-3">
                    <div class="flex gap-2">
                      <button
                        onclick={() => reviewWordsSource = 'all'}
                        class="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all {reviewWordsSource === 'all'
                          ? 'bg-blue-500 text-white'
                          : 'bg-tile-400 text-text-200 md:hover:bg-tile-500 border border-tile-600'}"
                      >
                        All Saved Words
                      </button>
                      <button
                        onclick={() => reviewWordsSource = 'due-for-review'}
                        class="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all {reviewWordsSource === 'due-for-review'
                          ? 'bg-blue-500 text-white'
                          : 'bg-tile-400 text-text-200 md:hover:bg-tile-500 border border-tile-600'}"
                      >
                        Due for Review
                      </button>
                    </div>

                    {#if isLoadingReviewWords}
                      <div class="flex items-center gap-2 text-text-200">
                        <div class="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        <span class="text-sm">Loading words...</span>
                      </div>
                    {:else if reviewWordsError}
                      <p class="text-rose-400 text-sm">{reviewWordsError}</p>
                    {:else if reviewWords.length > 0}
                      <p class="text-emerald-600 text-sm font-medium">
                        {reviewWords.length} word{reviewWords.length !== 1 ? 's' : ''} ready to use
                      </p>
                    {/if}
                  </div>
                {/if}
              </div>
            {:else}
              <div class="p-3 bg-tile-300 border-2 border-tile-600 rounded-lg">
                <p class="text-text-200 text-sm">
                  <a href="/login" class="text-blue-400 hover:text-blue-300">Log in</a> to use your saved vocabulary words in sentences
                </p>
              </div>
            {/if}

            <!-- Learning Topics (Multiselect) -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-semibold text-text-300">
                  Focus Topics (optional)
                </label>
                {#if selectedLearningTopics.length > 0}
                  <button
                    onclick={() => selectedLearningTopics = []}
                    class="text-xs text-text-100 hover:text-text-200"
                  >
                    Clear all
                  </button>
                {/if}
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {#each learningTopics as topic}
                  <button
                    onclick={() => toggleLearningTopic(topic.id)}
                    class="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 {selectedLearningTopics.includes(topic.id)
                      ? 'bg-sky-600 text-white shadow'
                      : 'bg-tile-300 text-text-200 md:hover:bg-tile-500 border border-tile-600'}"
                  >
                    <span>{topic.icon}</span>
                    <span class="truncate">{topic.label}</span>
                  </button>
                {/each}
              </div>
              <p class="text-text-100 text-xs mt-1">Select specific grammar topics to practice</p>
            </div>
          {/if}

          <div>
            <label for="customTopic" class="block text-sm font-semibold text-text-300 mb-2">
              Topic or Theme (optional)
            </label>
            <input
              id="customTopic"
              type="text"
              bind:value={customTopic}
              placeholder={contentType === 'words' ? "e.g., cooking, travel, emotions..." : "e.g., greetings, shopping, at the restaurant..."}
              class="w-full px-4 py-3 bg-tile-300 border-2 border-tile-600 text-text-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <p class="text-text-100 text-sm mt-1">Leave empty for random {contentType}</p>
          </div>

          <div>
            <label for="difficulty" class="block text-sm font-semibold text-text-300 mb-2">
              Difficulty Level
            </label>
            <select
              id="difficulty"
              bind:value={difficulty}
              class="w-full px-4 py-3 bg-tile-300 border-2 border-tile-600 text-text-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="a1">A1 - Beginner</option>
              <option value="a2">A2 - Elementary</option>
              <option value="b1">B1 - Intermediate</option>
              <option value="b2">B2 - Upper Intermediate</option>
              <option value="c1">C1 - Advanced</option>
              <option value="c2">C2 - Proficient</option>
            </select>
          </div>

          <!-- Number of items (only for custom generation) -->
          <div>
            <label class="block text-sm font-semibold text-text-300 mb-2">
              Number of {contentType === 'words' ? 'Words' : 'Sentences'} to Generate
            </label>
            <div class="flex gap-3 flex-wrap">
              {#each [5, 10, 15, 20] as count}
                <button
                  onclick={() => questionCount = count}
                  class="px-6 py-3 rounded-lg font-semibold transition-all {questionCount === count
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-tile-300 text-text-200 md:hover:bg-tile-500 border-2 border-tile-600'}"
                >
                  {count}
                </button>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Game Mode Selection -->
    <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-6">
      <h2 class="text-xl font-bold text-text-300 mb-4">3. Game Mode</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {#each ['multiple-choice', 'listening', 'speaking'] as mode}
          <button
            onclick={() => selectedMode = mode as typeof selectedMode}
            class="flex flex-col items-center gap-3 p-6 rounded-xl transition-all {selectedMode === mode
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-tile-300 text-text-200 md:hover:bg-tile-500 border-2 border-tile-600'}"
          >
            <span class="text-4xl">{getModeIcon(mode)}</span>
            <span class="font-bold text-lg capitalize">{mode.replace('-', ' ')}</span>
            <span class="text-sm text-center opacity-80">{getModeDescription(mode)}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Start Game Button -->
    <button
      onclick={startGame}
      class="w-full py-4 px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xl font-bold rounded-xl md:hover:from-emerald-600 md:hover:to-emerald-700 transition-all shadow-lg md:hover:shadow-xl active:scale-[0.98]"
    >
      Start Game
    </button>
  </div>
</section>

<!-- Auth Modal for logged out users -->
<AuthModal isOpen={showAuthModal} handleCloseModal={() => showAuthModal = false} />
