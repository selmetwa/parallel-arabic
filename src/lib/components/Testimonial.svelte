<script lang="ts">
  type Segment = { t: string; b?: boolean };

  let {
    segments,
    class: className = ''
  }: { segments: Segment[]; class?: string } = $props();
</script>

<figure
  class="relative overflow-hidden rounded-xl border border-tile-500 bg-gradient-to-br from-tile-300/80 to-tile-400/40 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md {className}"
>
  <span
    class="pointer-events-none absolute -right-1 -top-4 select-none font-serif text-7xl leading-none text-tile-500/50"
    aria-hidden="true">”</span>
  <div class="mb-2 flex gap-0.5" aria-label="Rated 5 out of 5 stars">
    {#each [0, 1, 2, 3, 4] as i (i)}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" aria-hidden="true">
        <path d="M12 2l2.9 6.26L21.5 9.27l-4.75 4.64L17.9 21 12 17.27 6.1 21l1.15-7.09L2.5 9.27l6.6-1.01z" />
      </svg>
    {/each}
  </div>
  <blockquote class="relative text-sm leading-relaxed text-text-200">
    {#each segments as seg, i (i)}{#if seg.b}<strong class="text-text-300">{seg.t}</strong>{:else}{seg.t}{/if}{/each}
  </blockquote>
</figure>
