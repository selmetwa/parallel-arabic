<script lang="ts">
  interface Props {
    /** Reviews due on each of the next 7 days; index 0 is tomorrow. */
    forecast: number[];
  }

  let { forecast }: Props = $props();

  const max = $derived(Math.max(1, ...forecast));

  const dayLabels = $derived(
    forecast.map((_, i) => {
      if (i === 0) return 'Tmr';
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      return d.toLocaleDateString(undefined, { weekday: 'short' });
    })
  );
</script>

<div class="w-full" role="img" aria-label="Reviews due over the next 7 days: {forecast.join(', ')}">
  <div class="flex items-end gap-2 h-20">
    {#each forecast as count, i (i)}
      <div class="flex-1 flex flex-col items-center justify-end h-full gap-1">
        <span class="text-[11px] tabular-nums text-text-200 {count === 0 ? 'opacity-0' : ''}">{count}</span>
        <div
          class="w-full rounded-t-[3px] forecast-bar"
          style="height: {Math.max(2, (count / max) * 56)}px; animation-delay: {i * 50}ms; background: {count === 0
            ? 'color-mix(in srgb, var(--tile6) 60%, transparent)'
            : i === 0
              ? 'var(--srs-good)'
              : 'color-mix(in srgb, var(--srs-good) 55%, var(--tile4))'};"
        ></div>
      </div>
    {/each}
  </div>
  <div class="flex gap-2 mt-1.5 border-t border-tile-500 pt-1.5">
    {#each dayLabels as label, i (i)}
      <span class="flex-1 text-center srs-label !text-[10px] !tracking-[0.08em]">{label}</span>
    {/each}
  </div>
</div>

<style>
  .forecast-bar {
    transform-origin: bottom;
    animation: grow 500ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }

  @keyframes grow {
    from {
      transform: scaleY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .forecast-bar {
      animation: none;
    }
  }
</style>
