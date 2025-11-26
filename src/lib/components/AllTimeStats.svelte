<script lang="ts">
  interface Props {
    user: {
      current_streak?: number | null;
      longest_streak?: number | null;
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
  
  // All-time stats
  const totalReviews = $derived(user?.total_reviews ?? 0);
  const totalSentences = $derived(user?.total_sentences_viewed ?? 0);
  const totalStories = $derived(user?.total_stories_viewed ?? 0);
  const totalLessons = $derived(user?.total_lessons_viewed ?? 0);
  const totalWords = $derived(user?.total_saved_words ?? 0);
</script>

{#if showStats}
  <div class="flex items-center gap-6 sm:gap-8 flex-wrap">
    <!-- Streak -->
    <div class="flex items-center gap-3">
      <div class="text-3xl sm:text-4xl">🔥</div>
      <div>
        <div class="text-xs text-text-200 mb-0.5">Current Streak</div>
        <div class="text-2xl sm:text-3xl font-bold text-text-300">
          {currentStreak}
          {#if longestStreak > currentStreak}
            <span class="text-sm text-text-200 ml-1">/ {longestStreak}</span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Total Reviews -->
    {#if totalReviews > 0}
      <div class="flex items-center gap-3">
        <div class="text-2xl sm:text-3xl">📚</div>
        <div>
          <div class="text-xs text-text-200 mb-0.5">Total vocabulary reviews</div>
          <div class="text-xl sm:text-2xl font-bold text-text-300">{totalReviews}</div>
        </div>
      </div>
    {/if}

    <!-- Total Sentences -->
    {#if totalSentences > 0}
      <div class="flex items-center gap-3">
        <div class="text-2xl sm:text-3xl">📝</div>
        <div>
          <div class="text-xs text-text-200 mb-0.5">Total sentences viewed</div>
          <div class="text-xl sm:text-2xl font-bold text-text-300">{totalSentences}</div>
        </div>
      </div>
    {/if}

    <!-- Total Stories -->
    {#if totalStories > 0}
      <div class="flex items-center gap-3">
        <div class="text-2xl sm:text-3xl">📖</div>
        <div>
          <div class="text-xs text-text-200 mb-0.5">Total stories viewed</div>
          <div class="text-xl sm:text-2xl font-bold text-text-300">{totalStories}</div>
        </div>
      </div>
    {/if}

    <!-- Total Lessons -->
    {#if totalLessons > 0}
      <div class="flex items-center gap-3">
        <div class="text-2xl sm:text-3xl">🎓</div>
        <div>
          <div class="text-xs text-text-200 mb-0.5">Total lessons viewed</div>
          <div class="text-xl sm:text-2xl font-bold text-text-300">{totalLessons}</div>
        </div>
      </div>
    {/if}

    <!-- Total Words -->
    {#if totalWords > 0}
      <div class="flex items-center gap-3">
        <div class="text-2xl sm:text-3xl">💾</div>
        <div>
          <div class="text-xs text-text-200 mb-0.5">Total words saved</div>
          <div class="text-xl sm:text-2xl font-bold text-text-300">{totalWords}</div>
        </div>
      </div>
    {/if}
  </div>
{/if}

