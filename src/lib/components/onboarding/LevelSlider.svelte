<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { CEFR_LEVELS, CEFR_LEVEL_INFO, type CefrLevel } from '$lib/constants/cefr-levels';

  type Props = {
    value: CefrLevel | '';
    onSelect: (level: CefrLevel) => void;
    /** 'now' reads the current-level captions, 'goal' the target-level ones. */
    variant: 'now' | 'goal';
    /** Goal screen only: stops below this level are already reached, so they're locked. */
    minLevel?: CefrLevel | '';
    hint: string;
  };

  let { value, onSelect, variant, minLevel = '', hint }: Props = $props();

  // Dot centres sit at (i + 0.5) / 6 of the row, so the rail spans 8.33% → 91.67%.
  const RAIL_START = 100 / 12;
  const RAIL_SPAN = 100 - 2 * RAIL_START;
  const LAST_INDEX = CEFR_LEVELS.length - 1;

  let buttons: HTMLButtonElement[] = $state([]);

  let startIndex = $derived(variant === 'goal' && minLevel ? CEFR_LEVELS.indexOf(minLevel) : 0);
  let selectedIndex = $derived(value ? CEFR_LEVELS.indexOf(value) : -1);
  let focusIndex = $derived(selectedIndex >= 0 ? selectedIndex : startIndex);
  let fillLeft = $derived(RAIL_START + (startIndex / LAST_INDEX) * RAIL_SPAN);
  let fillWidth = $derived(
    selectedIndex > startIndex ? ((selectedIndex - startIndex) / LAST_INDEX) * RAIL_SPAN : 0
  );
  let caption = $derived(value ? CEFR_LEVEL_INFO[value][variant] : '');

  function pick(index: number) {
    if (index < startIndex || index > LAST_INDEX) return;
    onSelect(CEFR_LEVELS[index]);
    buttons[index]?.focus();
  }

  function handleKeydown(event: KeyboardEvent) {
    let next: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = focusIndex + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = focusIndex - 1;
    else if (event.key === 'Home') next = startIndex;
    else if (event.key === 'End') next = LAST_INDEX;

    if (next === null) return;
    event.preventDefault();
    pick(Math.min(LAST_INDEX, Math.max(startIndex, next)));
  }
</script>

<style>
  .rail {
    position: absolute;
    top: 50%;
    height: 3px;
    border-radius: 999px;
    transform: translateY(-50%);
  }

  .rail-base {
    left: 8.3333%;
    width: 83.3333%;
    background: var(--tile6);
  }

  .rail-fill {
    background: var(--brand);
    transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1), left 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .dot {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 999px;
    border: 3px solid transparent;
    background: var(--tile6);
    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.25s ease,
      border-color 0.25s ease;
  }

  .dot:not(:disabled):hover {
    transform: scale(1.2);
  }

  .dot.reached {
    background: var(--brand);
  }

  .dot.selected {
    background: var(--tile1);
    border-color: var(--brand);
    transform: scale(1.25);
  }

  .dot.locked {
    background: transparent;
    border-color: var(--tile6);
    cursor: default;
  }

  .caption {
    color: var(--brand);
    font-style: italic;
    font-weight: 600;
    line-height: 1.35;
    text-align: center;
    text-wrap: balance;
  }

  @media (prefers-reduced-motion: reduce) {
    .rail-fill,
    .dot {
      transition: none;
    }
  }
</style>

<div class="w-full max-w-2xl mx-auto">
  <p class="text-center text-sm sm:text-base text-text-200 mb-5">{hint}</p>

  <!-- Roving tabindex: the group itself is skipped, the selected stop takes the tab stop. -->
  <div
    class="relative"
    role="radiogroup"
    aria-label={hint}
    tabindex="-1"
    onkeydown={handleKeydown}
  >
    <div class="grid grid-cols-6">
      {#each CEFR_LEVELS as level, i (level)}
        <span
          class="text-center text-sm sm:text-base font-bold transition-colors duration-300
            {i === selectedIndex
            ? 'text-brand'
            : i < startIndex
              ? 'text-text-200/40'
              : 'text-text-200'}"
        >
          {level}
        </span>
      {/each}
    </div>

    <div class="relative h-12 mt-1">
      <div class="rail rail-base" aria-hidden="true"></div>
      <div
        class="rail rail-fill"
        style="left:{fillLeft}%;width:{fillWidth}%"
        aria-hidden="true"
      ></div>

      <div class="relative grid grid-cols-6 h-full items-center">
        {#each CEFR_LEVELS as level, i (level)}
          <div class="flex justify-center">
            <button
              bind:this={buttons[i]}
              type="button"
              role="radio"
              aria-checked={selectedIndex === i}
              aria-label={`${level} — ${CEFR_LEVEL_INFO[level][variant]}`}
              tabindex={focusIndex === i ? 0 : -1}
              disabled={i < startIndex}
              class="dot focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text-300
                {i < startIndex ? 'locked' : ''}
                {i >= startIndex && i <= selectedIndex ? 'reached' : ''}
                {i === selectedIndex ? 'selected' : ''}"
              onclick={() => pick(i)}
            ></button>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="mt-6 min-h-[4rem] sm:min-h-[3.5rem] flex items-start justify-center px-2">
    {#key value}
      {#if caption}
        <p class="caption text-xl sm:text-2xl" in:fly={{ y: 10, duration: 280, easing: cubicOut }}>
          {caption}
        </p>
      {/if}
    {/key}
  </div>
</div>
