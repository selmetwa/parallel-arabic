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

  const showStats = $derived(user !== null && user !== undefined);
  const currentStreak = $derived(user?.current_streak ?? 0);
  const longestStreak = $derived(user?.longest_streak ?? 0);
  
  // Key stats - just show a few important ones
  const weeklyReviews = $derived(user?.reviews_this_week ?? 0);
  const weeklyLessons = $derived(user?.lessons_viewed_this_week ?? 0);
  const totalWords = $derived(user?.total_saved_words ?? 0);
</script>

{#if showStats}
  <div class="flex items-center gap-6 sm:gap-8 flex-wrap">
    <!-- Streak -->
    <div class="flex items-center gap-3">
      <div class="text-3xl sm:text-4xl">🔥</div>
      <div>
        <div class="text-xs text-text-200 mb-0.5">Streak</div>
        <div class="text-2xl sm:text-3xl font-bold text-text-300">
          {currentStreak}
          {#if longestStreak > currentStreak}
            <span class="text-sm text-text-200 ml-1">/ {longestStreak}</span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Weekly Reviews -->
    {#if weeklyReviews > 0}
      <div class="flex items-center gap-3">
        <div class="text-2xl sm:text-3xl">📚</div>
        <div>
          <div class="text-xs text-text-200 mb-0.5">Weekly vocabulary reviews</div>
          <div class="text-xl sm:text-2xl font-bold text-text-300">{weeklyReviews}</div>
        </div>
      </div>
    {/if}

    <!-- Weekly Lessons -->
    {#if weeklyLessons > 0}
      <div class="flex items-center gap-3">
        <div class="text-2xl sm:text-3xl">🎓</div>
        <div>
          <div class="text-xs text-text-200 mb-0.5">Lessons this week</div>
          <div class="text-xl sm:text-2xl font-bold text-text-300">{weeklyLessons}</div>
        </div>
      </div>
    {/if}

    <!-- Total Words -->
    {#if totalWords > 0}
      <div class="flex items-center gap-3">
        <div class="text-2xl sm:text-3xl">💾</div>
        <div>
          <div class="text-xs text-text-200 mb-0.5">Total Words Saved</div>
          <div class="text-xl sm:text-2xl font-bold text-text-300">{totalWords}</div>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <!-- Minimal welcome for non-logged-in users -->
  <div>
    <h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-2 tracking-tight">
      Welcome to Parallel Arabic
    </h1>
    <p class="text-text-200 text-base sm:text-lg leading-relaxed opacity-90">
      Master Arabic dialects through stories, lessons, and interactive practice.
    </p>
  </div>
{/if}

