<script lang="ts">
  import { resolve } from '$app/paths';
  import DueForecast from '$lib/components/review/DueForecast.svelte';
  import StrengthBar from '$lib/components/review/StrengthBar.svelte';

  interface Props {
    wordStats: {
      total: number;
      byDialect: Record<string, { total: number; dueForReview: number; learning: number }>;
      dueForReview: number;
      newWords: number;
      todaySession: number;
      learning: number;
      mastered: number;
      strength: number[];
      forecast: number[];
    };
  }

  let { wordStats }: Props = $props();

  const dialectLabels: Record<string, string> = {
    'egyptian-arabic': 'Egyptian',
    'fusha': 'MSA',
    'levantine': 'Levantine',
    'darija': 'Darija',
    'iraqi': 'Iraqi',
    'khaleeji': 'Khaleeji',
    'saudi': 'Saudi'
  };

  const strengthLabels = ['New', 'Fragile', 'Forming', 'Steady', 'Strong', 'Lasting'];

  const dialectEntries = $derived(
    Object.entries(wordStats.byDialect).sort((a, b) => b[1].total - a[1].total)
  );

  const overviewTiles = $derived([
    { value: wordStats.total, label: 'Words' },
    { value: wordStats.dueForReview, label: 'Due now' },
    { value: wordStats.learning, label: 'Learning' },
    { value: wordStats.mastered, label: 'Mastered' }
  ]);

  const hasForecast = $derived(wordStats.forecast.some((n) => n > 0));
</script>

<div class="rounded-2xl border border-tile-600 bg-tile-300 overflow-hidden">
  <div class="flex items-center justify-between gap-3 px-4 sm:px-6 pt-5">
    <div>
      <p class="srs-label">Spaced repetition</p>
      <h3 class="text-lg font-semibold text-text-300">Vocabulary</h3>
    </div>
    {#if wordStats.todaySession > 0}
      <a
        href={resolve('/review')}
        class="shrink-0 text-sm font-semibold px-3.5 py-1.5 rounded-lg border border-tile-600 bg-tile-400 hover:bg-tile-500 text-text-300 transition-colors"
      >
        Review {wordStats.todaySession} →
      </a>
    {/if}
  </div>

  <div class="px-4 sm:px-6 py-5">
    <dl class="grid grid-cols-4 border-y border-tile-500 divide-x divide-tile-500 mb-6">
      {#each overviewTiles as tile (tile.label)}
        <div class="py-3 text-center">
          <dd class="text-xl sm:text-2xl font-semibold text-text-300 tabular-nums">{tile.value}</dd>
          <dt class="srs-label !text-[10px] mt-0.5">{tile.label}</dt>
        </div>
      {/each}
    </dl>

    {#if wordStats.total > 0}
      <div class="mb-6">
        <p class="srs-label mb-2">Memory strength</p>
        <div class="flex h-2.5 rounded-full overflow-hidden bg-tile-500" role="img" aria-label="Words by memory strength">
          {#each wordStats.strength as count, level (level)}
            {#if count > 0}
              <div
                class="h-full"
                style="width: {(count / wordStats.total) * 100}%; background: {level === 0
                  ? 'var(--tile6)'
                  : `color-mix(in srgb, var(--srs-good) ${20 + level * 16}%, var(--tile4))`};"
                title="{strengthLabels[level]}: {count}"
              ></div>
            {/if}
          {/each}
        </div>
        <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {#each wordStats.strength as count, level (level)}
            {#if count > 0}
              <span class="inline-flex items-center gap-1.5 text-xs text-text-200">
                <StrengthBar {level} />
                {strengthLabels[level]} <span class="tabular-nums text-text-300">{count}</span>
              </span>
            {/if}
          {/each}
        </div>
      </div>

      {#if hasForecast}
        <div class="mb-6">
          <p class="srs-label mb-3">Coming up this week</p>
          <DueForecast forecast={wordStats.forecast} />
        </div>
      {/if}
    {/if}

    {#if dialectEntries.length > 0}
      <div>
        <p class="srs-label mb-2">By dialect</p>
        <ul class="divide-y divide-tile-500 border-y border-tile-500">
          {#each dialectEntries as [dialect, stats] (dialect)}
            <li class="flex items-baseline justify-between py-2 text-sm">
              <span class="text-text-300">{dialectLabels[dialect] || dialect}</span>
              <span class="tabular-nums text-text-200">
                {#if stats.dueForReview > 0}
                  <span class="text-[color:var(--srs-good)] font-semibold mr-3">{stats.dueForReview} due</span>
                {/if}
                {stats.total}
              </span>
            </li>
          {/each}
        </ul>
      </div>
    {:else}
      <div class="text-center py-6">
        <p class="text-text-200 text-sm mb-3">No words in your review deck yet</p>
        <a href={resolve('/vocabulary')} class="text-sm text-text-300 underline underline-offset-4 font-medium">
          Start adding vocabulary →
        </a>
      </div>
    {/if}
  </div>
</div>
