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

  let showModal = $state(false);

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

  const overviewTiles = $derived([
    { value: wordStats.total, label: 'Total', accent: 'var(--text1)' },
    { value: wordStats.dueForReview, label: 'Due', accent: '#2563eb' },
    { value: wordStats.learning, label: 'Learning', accent: '#d97706' }
  ]);
</script>

<div class="bg-tile-400 border-2 border-tile-600 rounded-2xl shadow-lg overflow-hidden">
  <!-- Header -->
  <div class="p-4 sm:p-6 border-b border-tile-600 bg-tile-500/30">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-lg font-bold text-text-300 flex items-center gap-2">
        <span>🗂️</span>
        Vocabulary Progress
        <button
          onclick={() => (showModal = true)}
          class="ml-1 w-5 h-5 rounded-full bg-tile-600 hover:bg-tile-500 text-text-200 hover:text-text-300 text-xs font-bold transition-colors flex items-center justify-center leading-none"
          aria-label="How graduation works"
        >
          ?
        </button>
      </h3>
      {#if wordStats.dueForReview > 0}
        <a
          href="/review"
          class="shrink-0 text-sm font-medium bg-brand hover:opacity-90 text-white px-3.5 py-1.5 rounded-lg transition-opacity"
        >
          Review {wordStats.dueForReview} due →
        </a>
      {/if}
    </div>
  </div>

  <div class="p-4 sm:p-6">
    <!-- Overall Stats Row -->
    <div class="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
      {#each overviewTiles as tile (tile.label)}
        <div class="relative overflow-hidden bg-tile-300 rounded-xl p-4 text-center border border-tile-600">
          <div class="absolute inset-x-0 top-0 h-1" style="background: {tile.accent};"></div>
          <div class="text-2xl sm:text-3xl font-bold tabular-nums" style="color: {tile.accent};">{tile.value}</div>
          <div class="text-xs text-text-200 uppercase tracking-wide mt-1">{tile.label}</div>
        </div>
      {/each}
    </div>

    <!-- Mastery Progress Bar -->
    {#if wordStats.total > 0}
      <div class="mb-6">
        <div class="flex items-center justify-between text-sm mb-2">
          <span class="text-text-200">Mastery Progress</span>
          <span class="text-text-300 font-semibold tabular-nums">{masteryProgress}%</span>
        </div>
        <div class="h-3 bg-tile-600 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
            style="width: {masteryProgress}%"
          ></div>
        </div>
        <p class="text-xs text-text-200 mt-1.5 opacity-80">
          {wordStats.total - wordStats.learning} mastered • {wordStats.learning} still learning
        </p>
      </div>
    {/if}

    <!-- By Dialect -->
    {#if dialectEntries.length > 0}
      <div>
        <h4 class="text-xs font-semibold text-text-200 mb-3 uppercase tracking-[0.15em]">By Dialect</h4>
        <div class="grid grid-cols-2 gap-3">
          {#each dialectEntries as [dialect, stats] (dialect)}
            <div class="bg-tile-300 rounded-xl p-3 border border-tile-600 hover:border-brand transition-colors">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-lg">{dialectEmojis[dialect] || '📝'}</span>
                <span class="font-medium text-text-300 text-sm">{dialectLabels[dialect] || dialect}</span>
              </div>
              <div class="flex items-baseline gap-3">
                <span class="text-xl font-bold text-text-300 tabular-nums">{stats.total}</span>
                {#if stats.dueForReview > 0}
                  <span class="text-xs font-medium" style="color: #2563eb;">{stats.dueForReview} due</span>
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
        <a href="/vocabulary" class="text-sm text-brand underline font-medium">
          Start adding vocabulary →
        </a>
      </div>
    {/if}
  </div>
</div>

<!-- Graduation Info Modal -->
{#if showModal}
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="graduation-modal-title"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <!-- Backdrop -->
    <button
      class="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
      onclick={() => (showModal = false)}
      aria-label="Close modal"
      tabindex="-1"
    ></button>

    <!-- Modal panel -->
    <div class="relative z-10 bg-tile-400 border-2 border-tile-600 rounded-2xl shadow-2xl w-full max-w-md p-6">
      <div class="flex items-center justify-between mb-5">
        <h2 id="graduation-modal-title" class="text-base font-bold text-text-300">
          How graduation works
        </h2>
        <button
          onclick={() => (showModal = false)}
          class="w-8 h-8 rounded-full bg-tile-600 hover:bg-tile-500 text-text-200 hover:text-text-300 transition-colors flex items-center justify-center text-lg leading-none"
          aria-label="Close modal"
        >
          ×
        </button>
      </div>

      <div class="space-y-4 text-sm text-text-200">
        <!-- Learning vs Due -->
        <div class="space-y-2">
          <div class="flex items-start gap-3">
            <span class="mt-1 w-2.5 h-2.5 rounded-full shrink-0" style="background: #d97706;"></span>
            <p>
              <span class="font-semibold text-text-300">Learning</span> — words you're actively building memory for. These are reviewed frequently until they stick.
            </p>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-1 w-2.5 h-2.5 rounded-full shrink-0" style="background: #2563eb;"></span>
            <p>
              <span class="font-semibold text-text-300">Due</span> — words ready to be reviewed today. This includes all learning words plus any scheduled words whose review date has arrived.
            </p>
          </div>
        </div>

        <div class="border-t border-tile-600"></div>

        <!-- Graduation threshold -->
        <p>
          A word <span class="font-semibold text-text-300">graduates out of Learning</span> once it reaches a 30-day review interval — roughly 5 "Easy" ratings in a row.
        </p>

        <!-- Interval table -->
        <div>
          <p class="font-semibold text-text-300 mb-2">Interval progression</p>
          <div class="bg-tile-300 rounded-lg overflow-hidden border border-tile-600">
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
                  <tr class={i % 2 === 0 ? 'bg-tile-300' : 'bg-tile-400'}>
                    <td class="px-3 py-2 text-text-300">{row.label}</td>
                    <td class="px-3 py-2 text-text-200">{row.interval}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Rating explanation -->
        <div class="flex gap-3 text-xs">
          <div class="flex-1 rounded-lg p-3 border border-green-600/40" style="background: color-mix(in srgb, var(--green1) 50%, var(--tile4));">
            <p class="font-semibold mb-1" style="color: #16a34a;">Easy</p>
            <p class="text-text-200">Grows the interval faster — you'll see the word less often.</p>
          </div>
          <div class="flex-1 rounded-lg p-3 border border-red-600/40" style="background: color-mix(in srgb, var(--red1) 50%, var(--tile4));">
            <p class="font-semibold mb-1" style="color: #dc2626;">Hard</p>
            <p class="text-text-200">Resets the interval — the word comes back sooner.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
