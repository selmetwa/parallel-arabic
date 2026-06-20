<script lang="ts">
  import type { ConversationMessage, WordAlignment } from '$lib/types';

  interface Props {
    message: ConversationMessage;
    /** Global defaults; each message can locally override these. */
    showEnglish?: boolean;
    showTransliteration?: boolean;
    showHint?: boolean;
    playingMessageId?: string | null;
    onWordClick: (
      word: string,
      type: 'arabic' | 'english' | 'transliteration',
      message: ConversationMessage
    ) => void;
    onToggleFeedback?: (messageId: string) => void;
  }

  let {
    message,
    showEnglish = false,
    showTransliteration = false,
    showHint = false,
    playingMessageId = null,
    onWordClick,
    onToggleFeedback
  }: Props = $props();

  // Per-message overrides. null = follow the global toggle for that field.
  let localEnglish = $state<boolean | null>(null);
  let localTransliteration = $state<boolean | null>(null);
  let localHint = $state<boolean | null>(null);

  let showEng = $derived(localEnglish ?? showEnglish);
  let showTr = $derived(localTransliteration ?? showTransliteration);
  let showHnt = $derived(localHint ?? showHint);

  // Use word alignments when available, otherwise fall back to splitting the raw Arabic.
  let words = $derived<WordAlignment[]>(
    message.wordAlignments?.length
      ? message.wordAlignments
      : (message.arabic || '')
          .split(' ')
          .filter(Boolean)
          .map((w) => ({ arabic: w, english: '', transliteration: '' }))
  );

  let hasFeedback = $derived(!!message.feedback && message.feedback.trim() !== '');
</script>

{#snippet toggleGroup()}
  <div
    class="flex border border-tile-600 rounded overflow-hidden text-[10px] font-semibold"
    role="group"
    aria-label="Show or hide translation lines"
  >
    <button
      type="button"
      onclick={() => (localEnglish = !showEng)}
      aria-pressed={showEng}
      class="px-1.5 py-0.5 transition-colors {showEng ? 'bg-tile-600 text-text-300' : 'bg-tile-300 text-text-200 hover:bg-tile-400'}"
    >EN</button>
    <button
      type="button"
      onclick={() => (localTransliteration = !showTr)}
      aria-pressed={showTr}
      class="px-1.5 py-0.5 transition-colors {showTr ? 'bg-tile-600 text-text-300' : 'bg-tile-300 text-text-200 hover:bg-tile-400'}"
    >TR</button>
    <button
      type="button"
      onclick={() => (localHint = !showHnt)}
      aria-pressed={showHnt}
      class="px-1.5 py-0.5 transition-colors {showHnt ? 'bg-tile-600 text-text-300' : 'bg-tile-300 text-text-200 hover:bg-tile-400'}"
    >Hint</button>
  </div>
{/snippet}

{#snippet wordDisplay()}
  {#if words.length}
    <div class="flex flex-wrap gap-1.5 sm:gap-2 justify-center" dir="rtl">
      {#each words as wordAlign, i (i)}
        <button
          onclick={() => onWordClick(wordAlign.arabic, 'arabic', message)}
          aria-label={`Define ${wordAlign.arabic}`}
          class="flex flex-col items-center px-2 py-1.5 rounded-lg hover:bg-tile-500 hover:shadow-sm transition-all duration-200 cursor-pointer border border-transparent hover:border-tile-600"
        >
          {#if showEng && wordAlign.english}
            <span class="text-[10px] text-text-200 mb-0.5 opacity-90">{wordAlign.english}</span>
          {/if}
          <span class="text-base sm:text-lg font-semibold text-text-300">{wordAlign.arabic}</span>
        </button>
      {/each}
    </div>
  {/if}
{/snippet}

{#if message.type === 'tutor'}
  <div
    data-mid={message.id}
    class="scroll-mt-28 mr-auto w-full sm:max-w-[92%] bg-tile-300 border border-tile-500 rounded-xl p-3"
  >
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-1.5">
        <span class="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-xs">🎓</span>
        <span class="text-xs font-semibold text-text-300">Tutor</span>
        {#if playingMessageId === message.id}
          <span class="text-xs animate-pulse" aria-label="Playing audio">🔊</span>
        {/if}
      </div>
      {@render toggleGroup()}
    </div>

    {#if showHnt && message.english}
      <p class="text-xs text-text-200 text-center mb-1">{message.english}</p>
    {/if}
    {#if showTr && message.transliteration}
      <p class="text-xs text-text-200 italic text-center mb-2">{message.transliteration}</p>
    {/if}
    {@render wordDisplay()}
  </div>
{:else}
  <div
    data-mid={message.id}
    class="scroll-mt-28 ml-auto max-w-[95%] sm:max-w-[85%] bg-sky-500/10 border-2 border-sky-500/30 rounded-xl p-3 sm:p-4"
  >
    <div class="flex items-center justify-between gap-2 mb-2">
      <div class="flex gap-1.5 flex-wrap">
        {#if hasFeedback}
          <button
            onclick={() => onToggleFeedback?.(message.id)}
            class="text-xs px-2 py-1 rounded-md font-medium transition-colors {message.showFeedback !== false ? 'bg-amber-600 text-white' : 'bg-tile-500 text-text-300 hover:bg-tile-600'}"
            aria-pressed={message.showFeedback !== false}
          >
            💡 Tips
          </button>
        {/if}
      </div>
      {@render toggleGroup()}
    </div>

    {#if showHnt && message.english}
      <p class="text-xs sm:text-sm text-text-200 text-center mb-1">{message.english}</p>
    {/if}
    {#if showTr && message.transliteration}
      <p class="text-xs sm:text-sm text-text-200 italic text-center mb-2">{message.transliteration}</p>
    {/if}
    {@render wordDisplay()}

    {#if hasFeedback && message.showFeedback !== false}
      <div class="mt-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <p class="text-sm font-bold text-amber-300 mb-2 flex items-center gap-2">
          <span>💡</span> Grammar Feedback
        </p>
        <p class="text-text-300 whitespace-pre-wrap leading-relaxed">{message.feedback}</p>
        {#if message.suggestedSentence}
          <div class="mt-3 pt-3 border-t border-amber-500/20">
            <p class="text-xs text-amber-400 font-semibold mb-1">Try saying</p>
            <p class="text-text-100 font-medium">{message.suggestedSentence.arabic}</p>
            <p class="text-text-300 text-sm mt-0.5">{message.suggestedSentence.transliteration}</p>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}
