<script lang="ts">
  interface Props {
    wordStats: {
      total: number;
      byDialect: Record<string, { total: number; dueForReview: number; learning: number }>;
      dueForReview: number;
      learning: number;
    };
  }

  let { wordStats }: Props = $props();

  const dialectLabels: Record<string, string> = {
    'egyptian-arabic': 'Egyptian',
    'fusha': 'MSA',
    'levantine': 'Levantine',
    'darija': 'Darija'
  };

  const dialectEmojis: Record<string, string> = {
    'egyptian-arabic': '🇪🇬',
    'fusha': '📚',
    'levantine': '🇱🇧',
    'darija': '🇲🇦'
  };

  const dialectEntries = $derived(
    Object.entries(wordStats.byDialect).sort((a, b) => b[1].total - a[1].total)
  );
  
  // Calculate progress percentage for visual bar
  const masteryProgress = $derived(
    wordStats.total > 0 
      ? Math.round(((wordStats.total - wordStats.learning) / wordStats.total) * 100)
      : 0
  );
</script>

<div class="bg-tile-400 border-2 border-tile-600 rounded-xl shadow-lg overflow-hidden">
  <!-- Header -->
  <div class="p-4 sm:p-6 border-b border-tile-500 bg-tile-500/30">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
        <span>🗂️</span>
        Review Deck
      </h3>
      {#if wordStats.dueForReview > 0}
        <a 
          href="/review" 
          class="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Review {wordStats.dueForReview} Due →
        </a>
      {/if}
    </div>
  </div>

  <div class="p-4 sm:p-6">
    <!-- Overall Stats Row -->
    <div class="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
      <div class="bg-tile-500 rounded-xl p-4 text-center border border-tile-600">
        <div class="text-2xl sm:text-3xl font-bold text-text-300">{wordStats.total}</div>
        <div class="text-xs text-text-200 uppercase tracking-wide mt-1">Total</div>
      </div>
      <div class="bg-blue-900/30 rounded-xl p-4 text-center border border-blue-800/50">
        <div class="text-2xl sm:text-3xl font-bold text-blue-400">{wordStats.dueForReview}</div>
        <div class="text-xs text-blue-300/80 uppercase tracking-wide mt-1">Due</div>
      </div>
      <div class="bg-amber-900/30 rounded-xl p-4 text-center border border-amber-800/50">
        <div class="text-2xl sm:text-3xl font-bold text-amber-400">{wordStats.learning}</div>
        <div class="text-xs text-amber-300/80 uppercase tracking-wide mt-1">Learning</div>
      </div>
    </div>

    <!-- Mastery Progress Bar -->
    {#if wordStats.total > 0}
      <div class="mb-6">
        <div class="flex items-center justify-between text-sm mb-2">
          <span class="text-text-200">Mastery Progress</span>
          <span class="text-text-300 font-medium">{masteryProgress}%</span>
        </div>
        <div class="h-3 bg-tile-600 rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
            style="width: {masteryProgress}%"
          ></div>
        </div>
        <p class="text-xs text-text-200 mt-1.5 opacity-80">
          {wordStats.total - wordStats.learning} words mastered • {wordStats.learning} still learning
        </p>
      </div>
    {/if}

    <!-- By Dialect -->
    {#if dialectEntries.length > 0}
      <div>
        <h4 class="text-sm font-semibold text-text-300 mb-3 uppercase tracking-wide">By Dialect</h4>
        <div class="grid grid-cols-2 gap-3">
          {#each dialectEntries as [dialect, stats]}
            <div class="bg-tile-500 rounded-lg p-3 border border-tile-600 hover:border-tile-500 transition-colors">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-lg">{dialectEmojis[dialect] || '📝'}</span>
                <span class="font-medium text-text-300 text-sm">{dialectLabels[dialect] || dialect}</span>
              </div>
              <div class="flex items-baseline gap-3">
                <span class="text-xl font-bold text-text-300">{stats.total}</span>
                {#if stats.dueForReview > 0}
                  <span class="text-xs text-blue-400">{stats.dueForReview} due</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="text-center py-6">
        <div class="text-4xl mb-3 opacity-50">📚</div>
        <p class="text-text-200 text-sm mb-3">No words in your review deck yet</p>
        <a href="/vocabulary" class="text-sm text-blue-400 hover:text-blue-300 underline font-medium">
          Start adding vocabulary →
        </a>
      </div>
    {/if}
  </div>
</div>
