<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import StrengthBar from '$lib/components/review/StrengthBar.svelte';
  import {
    formatDue,
    masteryLevel,
    recallAfter,
    retrievability,
    State,
    wordToCard,
    type ReviewWord
  } from '$lib/srs/fsrs';

  interface Props {
    isOpen: boolean;
    closeModal: () => void;
    word: ReviewWord;
  }

  let { isOpen, closeModal, word }: Props = $props();

  const DAY_MS = 24 * 60 * 60 * 1000;
  const W = 320;
  const H = 120;
  const PAD = 4;

  const card = $derived(wordToCard(word));
  const isNew = $derived(word.state === State.New || !word.lastReviewDate);
  const level = $derived(masteryLevel(word.state, word.stability));
  const recallNow = $derived(isNew ? null : retrievability(card));

  // Draw the forgetting curve from the last review out to twice the scheduled interval.
  const spanDays = $derived(Math.max(7, (word.intervalDays || word.stability || 1) * 2));
  const todayDays = $derived(word.lastReviewDate ? (Date.now() - word.lastReviewDate) / DAY_MS : 0);

  const x = (days: number) => PAD + (Math.min(days, spanDays) / spanDays) * (W - PAD * 2);
  const y = (r: number) => PAD + (1 - r) * (H - PAD * 2);

  const curve = $derived.by(() => {
    if (isNew) return '';
    const points: string[] = [];
    for (let i = 0; i <= 48; i++) {
      const d = (i / 48) * spanDays;
      points.push(`${x(d).toFixed(1)},${y(recallAfter(card, d)).toFixed(1)}`);
    }
    return `M${points.join(' L')}`;
  });

  function formatDate(timestamp: number | null): string {
    if (timestamp === null) return '—';
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
</script>

<Modal {isOpen} handleCloseModal={closeModal} width="460px">
  <div class="p-6 pt-10">
    <div class="mb-6 text-center">
      <p class="text-4xl font-bold text-text-300 leading-snug" dir="rtl">{word.arabic}</p>
      <p class="text-sm text-text-200 mt-1">{word.english}</p>
    </div>

    <div class="rounded-xl bg-tile-200 border border-tile-500 p-4 mb-4">
      <div class="flex items-baseline justify-between mb-2">
        <span class="srs-label">Memory curve</span>
        {#if recallNow !== null}
          <span class="text-xs text-text-200">recall now <span class="font-semibold text-text-300 tabular-nums">{Math.round(recallNow * 100)}%</span></span>
        {/if}
      </div>
      {#if isNew}
        <p class="text-sm text-text-200 py-8 text-center">Review this word once to start its memory curve.</p>
      {:else}
        <svg viewBox="0 0 {W} {H}" class="w-full h-auto overflow-visible" role="img" aria-label="Chance of remembering this word over time">
          <line x1={PAD} x2={W - PAD} y1={y(0.9)} y2={y(0.9)} stroke="var(--tile6)" stroke-dasharray="3 4" />
          <text x={W - PAD} y={y(0.9) - 4} text-anchor="end" class="fill-current text-text-200" font-size="9">90%</text>
          <path d="{curve} L{x(spanDays)},{H - PAD} L{x(0)},{H - PAD} Z" fill="color-mix(in srgb, var(--srs-good) 12%, transparent)" />
          <path d={curve} fill="none" stroke="var(--srs-good)" stroke-width="2" stroke-linecap="round" />
          {#if todayDays <= spanDays}
            <line x1={x(todayDays)} x2={x(todayDays)} y1={PAD} y2={H - PAD} stroke="var(--text2)" stroke-width="1" />
            <circle cx={x(todayDays)} cy={y(recallNow ?? 0)} r="3.5" fill="var(--tile2)" stroke="var(--text1)" stroke-width="1.5" />
            <text x={x(todayDays) + 5} y={H - PAD - 4} class="fill-current text-text-200" font-size="9">today</text>
          {/if}
        </svg>
        <div class="flex justify-between srs-label !text-[10px] mt-1">
          <span>last review</span>
          <span>+{Math.round(spanDays)}d</span>
        </div>
      {/if}
    </div>

    <dl class="grid grid-cols-2 sm:grid-cols-3 gap-px rounded-xl overflow-hidden bg-tile-500 border border-tile-500">
      <div class="bg-tile-300 p-3">
        <dt class="srs-label">Strength</dt>
        <dd class="mt-1.5 flex items-center gap-2 text-sm font-semibold text-text-300">
          <StrengthBar {level} />
          {#if word.stability}{Math.round(word.stability)}d{/if}
        </dd>
      </div>
      <div class="bg-tile-300 p-3">
        <dt class="srs-label">Difficulty</dt>
        <dd class="mt-2 flex gap-[2px]" aria-label="{word.difficulty ? word.difficulty.toFixed(1) : 'unknown'} out of 10">
          {#each Array.from({ length: 10 }, (_, i) => i + 1) as tick (tick)}
            <span
              class="h-3 flex-1 rounded-[1px]"
              style="background: {word.difficulty && tick <= Math.round(word.difficulty)
                ? 'var(--srs-hard)'
                : 'color-mix(in srgb, var(--tile6) 60%, transparent)'};"
            ></span>
          {/each}
        </dd>
      </div>
      <div class="bg-tile-300 p-3">
        <dt class="srs-label">Next due</dt>
        <dd class="mt-1 text-sm font-semibold text-text-300">{isNew ? 'Now' : formatDue(word.nextReviewDate)}</dd>
      </div>
      <div class="bg-tile-300 p-3">
        <dt class="srs-label">Reviews</dt>
        <dd class="mt-1 text-sm font-semibold text-text-300 tabular-nums">{word.reps}</dd>
      </div>
      <div class="bg-tile-300 p-3">
        <dt class="srs-label">Lapses</dt>
        <dd class="mt-1 text-sm font-semibold text-text-300 tabular-nums">{word.lapses}</dd>
      </div>
      <div class="bg-tile-300 p-3">
        <dt class="srs-label">Last seen</dt>
        <dd class="mt-1 text-sm font-semibold text-text-300">{formatDate(word.lastReviewDate)}</dd>
      </div>
    </dl>
  </div>
</Modal>
