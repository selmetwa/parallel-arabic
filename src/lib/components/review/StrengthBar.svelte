<script lang="ts">
  interface Props {
    /** Memory strength 0 (new) to 5, from masteryLevel(). */
    level: number;
    size?: 'sm' | 'md';
  }

  let { level, size = 'sm' }: Props = $props();

  const labels = ['New', 'Fragile', 'Forming', 'Steady', 'Strong', 'Lasting'];
</script>

<span
  class="inline-flex items-end gap-[3px]"
  role="img"
  aria-label="Memory strength: {labels[level]}"
  title={labels[level]}
>
  {#each [1, 2, 3, 4, 5] as segment (segment)}
    <span
      class="rounded-[1px] transition-colors {size === 'sm' ? 'w-[5px]' : 'w-2'}"
      style="height: {(size === 'sm' ? 6 : 9) + segment * (size === 'sm' ? 2 : 3)}px; background: {segment <= level
        ? 'var(--srs-good)'
        : 'color-mix(in srgb, var(--tile6) 70%, transparent)'};"
    ></span>
  {/each}
</span>
