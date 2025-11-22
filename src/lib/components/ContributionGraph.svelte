<script lang="ts">
  import Tooltip from '$lib/components/Tooltip.svelte';

  interface ContributionData {
    reviewedByDate: Record<string, number>;
    savedByDate: Record<string, number>;
    totalReviewed: number;
    totalSaved: number;
    totalSentencesViewed: number;
  }

  interface DayData {
    date: Date;
    dateKey: string;
    count: number;
    intensity: number;
  }

  let contributionData = $state<ContributionData | null>(null);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let selectedMetric = $state<'all' | 'reviewed' | 'saved'>('all');
  let hoveredDay = $state<string | null>(null);

  // Helper function to format date as YYYY-MM-DD
  function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format date for display
  function formatDate(dateKey: string): string {
    const [year, month, day] = dateKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Get intensity level for a day (0-4)
  function getIntensity(dateKey: string): number {
    if (!contributionData) return 0;

    let count = 0;
    if (selectedMetric === 'all' || selectedMetric === 'reviewed') {
      count += contributionData.reviewedByDate[dateKey] || 0;
    }
    if (selectedMetric === 'all' || selectedMetric === 'saved') {
      count += contributionData.savedByDate[dateKey] || 0;
    }

    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 5) return 3;
    return 4;
  }

  // Get color based on intensity
  function getColor(intensity: number): string {
    switch (intensity) {
      case 0: return '#ebedf0';
      case 1: return '#c6e48b';
      case 2: return '#7bc96f';
      case 3: return '#239a3b';
      case 4: return '#196127';
      default: return '#ebedf0';
    }
  }

  // Get tooltip text
  function getTooltip(dateKey: string): string {
    if (!contributionData) return formatDate(dateKey);

    const reviewed = contributionData.reviewedByDate[dateKey] || 0;
    const saved = contributionData.savedByDate[dateKey] || 0;
    const total = reviewed + saved;

    if (total === 0) {
      return `${formatDate(dateKey)}: No activity`;
    }

    const parts: string[] = [];
    if (reviewed > 0) {
      parts.push(`${reviewed} word${reviewed !== 1 ? 's' : ''} reviewed`);
    }
    if (saved > 0) {
      parts.push(`${saved} word${saved !== 1 ? 's' : ''} saved`);
    }

    return `${formatDate(dateKey)}: ${parts.join(', ')}`;
  }

  // Generate array of last 365 days
  function generateDays(): DayData[] {
    const days: DayData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = formatDateKey(date);
      const intensity = getIntensity(dateKey);

      days.push({
        date,
        dateKey,
        count: (contributionData?.reviewedByDate[dateKey] || 0) + (contributionData?.savedByDate[dateKey] || 0),
        intensity
      });
    }

    return days;
  }

  // Generate weeks for display (GitHub style: each column is a week)
  function generateWeeks(): DayData[][] {
    const days = generateDays();
    const weeks: DayData[][] = [];

    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
  }

  // Get month labels for the bottom of the graph
  function getMonthLabels(): Record<number, string> {
    const days = generateDays();
    const monthLabels: Record<number, string> = {};
    let lastMonth = -1;

    // Check each week to see if it starts a new month
    for (let i = 0; i < days.length; i += 7) {
      const weekIndex = Math.floor(i / 7);
      const firstDayOfWeek = days[i];
      
      if (firstDayOfWeek) {
        const currentMonth = firstDayOfWeek.date.getMonth();
        // Show label if this is the first week of a new month, or if it's within the first 3 days of the month
        if (currentMonth !== lastMonth && firstDayOfWeek.date.getDate() <= 3) {
          monthLabels[weekIndex] = firstDayOfWeek.date.toLocaleDateString('en-US', { month: 'short' });
          lastMonth = currentMonth;
        }
      }
    }

    return monthLabels;
  }

  const weeks = $derived.by(() => {
    if (!contributionData) return [];
    return generateWeeks();
  });

  const monthLabels = $derived.by(() => {
    if (!contributionData) return {};
    return getMonthLabels();
  });

  // Fetch contribution data
  async function fetchData() {
    isLoading = true;
    error = null;

    try {
      const response = await fetch('/api/contribution-data');
      if (!response.ok) {
        throw new Error('Failed to fetch contribution data');
      }
      const data = await response.json();
      contributionData = data;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load contribution data';
      console.error('Error fetching contribution data:', err);
    } finally {
      isLoading = false;
    }
  }

  // Fetch on mount
  $effect(() => {
    fetchData();
  });
</script>

<div class="bg-tile-300 border border-tile-500 rounded-lg p-6">
  <div class="mb-4">
    <h2 class="text-xl font-semibold text-text-300 mb-2">Activity Overview</h2>
    <div class="flex flex-wrap gap-4 mb-4">
      <div class="text-sm">
        <span class="text-text-200">Reviewed:</span>
        <span class="text-text-300 font-semibold ml-1">{contributionData?.totalReviewed || 0}</span>
      </div>
      <div class="text-sm">
        <span class="text-text-200">Saved:</span>
        <span class="text-text-300 font-semibold ml-1">{contributionData?.totalSaved || 0}</span>
      </div>
      <div class="text-sm">
        <span class="text-text-200">Sentences Viewed:</span>
        <span class="text-text-300 font-semibold ml-1">{contributionData?.totalSentencesViewed || 0}</span>
      </div>
    </div>

    <div class="flex gap-2 mb-4">
      <button
        type="button"
        onclick={() => selectedMetric = 'all'}
        class="px-3 py-1 text-sm rounded border transition-colors {selectedMetric === 'all' ? 'bg-tile-500 border-tile-600 text-text-300' : 'bg-tile-400 border-tile-500 text-text-200 hover:bg-tile-500'}"
      >
        All
      </button>
      <button
        type="button"
        onclick={() => selectedMetric = 'reviewed'}
        class="px-3 py-1 text-sm rounded border transition-colors {selectedMetric === 'reviewed' ? 'bg-tile-500 border-tile-600 text-text-300' : 'bg-tile-400 border-tile-500 text-text-200 hover:bg-tile-500'}"
      >
        Reviewed
      </button>
      <button
        type="button"
        onclick={() => selectedMetric = 'saved'}
        class="px-3 py-1 text-sm rounded border transition-colors {selectedMetric === 'saved' ? 'bg-tile-500 border-tile-600 text-text-300' : 'bg-tile-400 border-tile-500 text-text-200 hover:bg-tile-500'}"
      >
        Saved
      </button>
    </div>
  </div>

  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="text-text-200">Loading activity data...</div>
    </div>
  {:else if error}
    <div class="text-red-500 text-center py-12">{error}</div>
  {:else if contributionData}
    <div class="overflow-x-auto md:overflow-x-visible">
      <div class="flex gap-0.5 min-w-max md:min-w-0 md:flex-wrap md:justify-start">
        {#each weeks as week, weekIndex}
          <div class="flex flex-col gap-0.5">
            {#each week as day}
              {@const color = getColor(day.intensity)}
              {@const tooltip = getTooltip(day.dateKey)}
              <Tooltip text={tooltip} position="top">
                <div
                  class="w-2.5 h-2.5 border rounded cursor-pointer transition-all hover:ring-2 hover:ring-green-400"
                  style="background-color: {color}; border-color: {color === '#ebedf0' ? '#d1d5da' : color};"
                  role="button"
                  tabindex="0"
                >
                  <span class="sr-only">{tooltip}</span>
                </div>
              </Tooltip>
            {/each}
          </div>
        {/each}
      </div>

      <!-- Month labels row -->
      <div class="flex gap-0.5 min-w-max md:min-w-0 md:flex-wrap md:justify-start mt-1">
        {#each weeks as week, weekIndex}
          <div class="flex flex-col gap-0.5 w-2.5">
            {#if monthLabels[weekIndex]}
              <div class="h-4 flex items-start">
                <span class="text-xs text-text-200 whitespace-nowrap -ml-0.5">{monthLabels[weekIndex]}</span>
              </div>
            {:else}
              <div class="h-4"></div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="flex items-center justify-between mt-4 text-xs text-text-200">
        <span>Less</span>
        <div class="flex gap-0.5 items-center">
          <div class="w-2.5 h-2.5 border rounded" style="background-color: #ebedf0; border-color: #d1d5da;"></div>
          <div class="w-2.5 h-2.5 border rounded" style="background-color: #c6e48b;"></div>
          <div class="w-2.5 h-2.5 border rounded" style="background-color: #7bc96f;"></div>
          <div class="w-2.5 h-2.5 border rounded" style="background-color: #239a3b;"></div>
          <div class="w-2.5 h-2.5 border rounded" style="background-color: #196127;"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  {/if}
</div>
