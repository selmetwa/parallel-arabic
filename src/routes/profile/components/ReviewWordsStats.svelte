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
    'egyptian-arabic': 'Egyptian Arabic',
    'fusha': 'Modern Standard Arabic',
    'levantine': 'Levantine Arabic',
    'darija': 'Moroccan Darija'
  };

  const dialectEmojis: Record<string, string> = {
    'egyptian-arabic': '🇪🇬',
    'fusha': '📚',
    'levantine': '🌍',
    'darija': '🇲🇦'
  };

  const dialectEntries = Object.entries(wordStats.byDialect).sort((a, b) => b[1].total - a[1].total);
</script>

<div class="bg-gradient-to-br from-tile-400/50 to-tile-500/30 border-2 border-tile-600 rounded-xl p-6 shadow-lg">
  <div class="flex items-center gap-3 mb-6">
    <div class="text-4xl">📊</div>
    <div>
      <h2 class="text-2xl font-bold text-text-300">Review Deck Status</h2>
      <p class="text-text-200 text-sm">Your vocabulary learning progress</p>
    </div>
  </div>

  <!-- Overall Stats -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <div class="bg-tile-300/80 border border-tile-500 rounded-lg p-4 text-center">
      <div class="text-3xl font-bold text-text-300 mb-1">{wordStats.total}</div>
      <div class="text-sm text-text-200">Total Words</div>
    </div>
    <div class="bg-tile-300/80 border border-tile-500 rounded-lg p-4 text-center">
      <div class="text-3xl font-bold text-blue-500 mb-1">{wordStats.dueForReview}</div>
      <div class="text-sm text-text-200">Due for Review</div>
    </div>
    <div class="bg-tile-300/80 border border-tile-500 rounded-lg p-4 text-center">
      <div class="text-3xl font-bold text-green-500 mb-1">{wordStats.learning}</div>
      <div class="text-sm text-text-200">Learning</div>
    </div>
  </div>

  <!-- By Dialect -->
  {#if dialectEntries.length > 0}
    <div class="border-t border-tile-500 pt-6">
      <h3 class="text-lg font-semibold text-text-300 mb-4">Words by Dialect</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {#each dialectEntries as [dialect, stats]}
          <div class="bg-tile-300/60 border border-tile-500 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">{dialectEmojis[dialect] || '📝'}</span>
              <h4 class="font-semibold text-text-300">{dialectLabels[dialect] || dialect}</h4>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm text-text-200">Total:</span>
                <span class="font-medium text-text-300">{stats.total}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-text-200">Due:</span>
                <span class="font-medium text-blue-500">{stats.dueForReview}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-text-200">Learning:</span>
                <span class="font-medium text-green-500">{stats.learning}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="border-t border-tile-500 pt-6 text-center py-8">
      <p class="text-text-200 mb-4">No words in your review deck yet.</p>
      <a href="/review" class="text-blue-500 hover:text-blue-400 underline font-medium">
        Start adding words to your review deck →
      </a>
    </div>
  {/if}

  <!-- Quick Actions -->
  {#if wordStats.total > 0}
    <div class="border-t border-tile-500 pt-6 mt-6">
      <div class="flex flex-wrap gap-3">
        <a 
          href="/review" 
          class="px-4 py-2 bg-tile-500 hover:bg-tile-600 text-text-300 rounded-lg font-medium transition-colors text-sm"
        >
          Start Review
        </a>
        <a 
          href="/review/all-words" 
          class="px-4 py-2 bg-tile-400 hover:bg-tile-500 text-text-300 rounded-lg font-medium transition-colors text-sm"
        >
          View All Words
        </a>
        {#if wordStats.dueForReview > 0}
          <a 
            href="/review" 
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
          >
            Review {wordStats.dueForReview} Due
          </a>
        {/if}
      </div>
    </div>
  {/if}
</div>

