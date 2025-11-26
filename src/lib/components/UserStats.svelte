<script lang="ts">
  interface Props {
    user: {
      current_streak?: number | null;
      longest_streak?: number | null;
      reviews_this_week?: number | null;
      sentences_viewed_this_week?: number | null;
      stories_viewed_this_week?: number | null;
      lessons_viewed_this_week?: number | null;
      saved_words_this_week?: number | null;
      total_reviews?: number | null;
      total_sentences_viewed?: number | null;
      total_stories_viewed?: number | null;
      total_lessons_viewed?: number | null;
      total_saved_words?: number | null;
    } | null;
  }

  let { user }: Props = $props();

  // Show stats only if user is logged in
  const showStats = $derived(user !== null && user !== undefined);
  const currentStreak = $derived(user?.current_streak ?? 0);
  const longestStreak = $derived(user?.longest_streak ?? 0);

  // Weekly stats
  const weeklyStats = $derived({
    reviews: user?.reviews_this_week ?? 0,
    sentences: user?.sentences_viewed_this_week ?? 0,
    stories: user?.stories_viewed_this_week ?? 0,
    lessons: user?.lessons_viewed_this_week ?? 0,
    savedWords: user?.saved_words_this_week ?? 0
  });

  // Overall stats
  const overallStats = $derived({
    reviews: user?.total_reviews ?? 0,
    sentences: user?.total_sentences_viewed ?? 0,
    stories: user?.total_stories_viewed ?? 0,
    lessons: user?.total_lessons_viewed ?? 0,
    savedWords: user?.total_saved_words ?? 0
  });
</script>

{#if showStats}
  <div class="bg-tile-400 border-2 border-tile-600 rounded-xl p-6 sm:p-8 shadow-lg">
    <!-- Streak Section -->
    <div class="flex items-center justify-between mb-6 pb-6 border-b border-tile-500">
      <div class="flex items-center gap-4">
        <div class="text-5xl">🔥</div>
        <div>
          <div class="text-sm text-text-200 mb-1">Current Streak</div>
          <div class="text-4xl sm:text-5xl font-bold text-text-300">
            {currentStreak}
            <span class="text-xl text-text-200 ml-2">days</span>
          </div>
        </div>
      </div>
      {#if longestStreak > currentStreak}
        <div class="text-right">
          <div class="text-sm text-text-200 mb-1">Best</div>
          <div class="text-2xl font-bold text-text-300">
            {longestStreak}
            <span class="text-sm text-text-200 ml-1">days</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Weekly Stats -->
    <div class="mb-6">
      <h3 class="text-lg font-bold text-text-300 mb-4">This Week</h3>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div class="text-center">
          <div class="text-2xl mb-1">📚</div>
          <div class="text-xl font-bold text-text-300">{weeklyStats.reviews}</div>
          <div class="text-xs text-text-200">Reviews</div>
        </div>
        <div class="text-center">
          <div class="text-2xl mb-1">📝</div>
          <div class="text-xl font-bold text-text-300">{weeklyStats.sentences}</div>
          <div class="text-xs text-text-200">Sentences</div>
        </div>
        <div class="text-center">
          <div class="text-2xl mb-1">📖</div>
          <div class="text-xl font-bold text-text-300">{weeklyStats.stories}</div>
          <div class="text-xs text-text-200">Stories</div>
        </div>
        <div class="text-center">
          <div class="text-2xl mb-1">🎓</div>
          <div class="text-xl font-bold text-text-300">{weeklyStats.lessons}</div>
          <div class="text-xs text-text-200">Lessons</div>
        </div>
        <div class="text-center">
          <div class="text-2xl mb-1">💾</div>
          <div class="text-xl font-bold text-text-300">{weeklyStats.savedWords}</div>
          <div class="text-xs text-text-200">Saved</div>
        </div>
      </div>
    </div>

    <!-- Overall Stats (Collapsible) -->
    <details class="border-t border-tile-500 pt-4">
      <summary class="cursor-pointer text-sm font-semibold text-text-200 hover:text-text-300 transition-colors">
        View All-Time Stats
      </summary>
      <div class="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div class="text-center">
          <div class="text-xl mb-1">📚</div>
          <div class="text-lg font-bold text-text-300">{overallStats.reviews}</div>
          <div class="text-xs text-text-200">Total Reviews</div>
        </div>
        <div class="text-center">
          <div class="text-xl mb-1">📝</div>
          <div class="text-lg font-bold text-text-300">{overallStats.sentences}</div>
          <div class="text-xs text-text-200">Sentences</div>
        </div>
        <div class="text-center">
          <div class="text-xl mb-1">📖</div>
          <div class="text-lg font-bold text-text-300">{overallStats.stories}</div>
          <div class="text-xs text-text-200">Stories</div>
        </div>
        <div class="text-center">
          <div class="text-xl mb-1">🎓</div>
          <div class="text-lg font-bold text-text-300">{overallStats.lessons}</div>
          <div class="text-xs text-text-200">Lessons</div>
        </div>
        <div class="text-center">
          <div class="text-xl mb-1">💾</div>
          <div class="text-lg font-bold text-text-300">{overallStats.savedWords}</div>
          <div class="text-xs text-text-200">Saved Words</div>
        </div>
      </div>
    </details>
  </div>
{:else}
  <!-- Fallback welcome message for non-logged-in users -->
  <div class="text-left mb-12">
    <h1 class="text-4xl sm:text-5xl text-text-300 font-bold mb-4 tracking-tight">
      Welcome to Parallel Arabic
    </h1>
    <p class="text-text-200 text-lg sm:text-xl leading-relaxed opacity-90 max-w-3xl">
      Your comprehensive practice environment. Master Arabic dialects and Modern Standard Arabic through stories, conversations, and interactive tools.
    </p>
  </div>
{/if}

