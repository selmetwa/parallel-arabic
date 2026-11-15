<script lang="ts">
  import { wordDragSelect } from '$lib/actions/word-drag-select';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import DefinitionModal from '$lib/components/dialect-shared/sentences/DefinitionModal.svelte';
  import DialectComparisonModal from '$lib/components/dialect-shared/sentences/DialectComparisonModal.svelte';
  import WordStatsModal from './WordStatsModal.svelte';
  import type { Dialect } from '$lib/types';
  import type { DialectComparisonSchema } from '$lib/utils/gemini-schemas';
  import { filterArabicCharacters } from '$lib/utils/arabic-normalization';
  import { trackEvent } from '$lib/analytics';
  import { formatInterval, retrievability, State, wordToCard, type Rating, type ReviewWord } from '$lib/srs/fsrs';

  interface Props {
    word: ReviewWord;
    /** Days until next review for each rating. */
    previews: Record<Rating, number>;
    /** True when this word was missed earlier in the session and is back for practice. */
    isPractice?: boolean;
    /** No connection: audio, definitions and dialect comparison need the network, so they're hidden. */
    offline?: boolean;
    revealed: boolean;
    onReveal: () => void;
    onRate: (rating: Rating) => void;
  }

  let { word, previews, isPractice = false, offline = false, revealed, onReveal, onRate }: Props = $props();

  let showHint = $state(false);
  let audioWrap = $state<HTMLSpanElement | null>(null);

  // Drag-to-highlight state (English words)
  let selectedWords = $state<string[]>([]);
  let selectionStartIndex = $state(-1);
  let selectionEndIndex = $state(-1);

  // Drag-to-highlight state (Arabic words)
  let selectedArabicWords = $state<string[]>([]);
  let selectionStartIndexArabic = $state(-1);
  let selectionEndIndexArabic = $state(-1);
  let isDefinitionModalOpen = $state(false);
  let isLoadingDefinition = $state(false);
  let definition = $state('');
  let targetWord = $state('');
  let targetArabicWord = $state('');
  let isStatsModalOpen = $state(false);

  // Dialect Comparison State
  let isComparisonModalOpen = $state(false);
  let comparisonData = $state<DialectComparisonSchema | null>(null);
  let isComparing = $state(false);
  let comparisonError = $state<string | null>(null);

  const recall = $derived(word.state === State.New ? null : retrievability(wordToCard(word)));

  const ratings: { value: Rating; label: string; color: string }[] = [
    { value: 1, label: 'Again', color: 'var(--srs-again)' },
    { value: 2, label: 'Hard', color: 'var(--srs-hard)' },
    { value: 3, label: 'Good', color: 'var(--srs-good)' },
    { value: 4, label: 'Easy', color: 'var(--srs-easy)' }
  ];

  const dialectName: Record<string, string> = {
    fusha: 'Modern Standard Arabic',
    levantine: 'Levantine Arabic',
    darija: 'Moroccan Darija',
    'egyptian-arabic': 'Egyptian Arabic',
    iraqi: 'Iraqi Arabic',
    khaleeji: 'Khaleeji Arabic',
    saudi: 'Saudi Arabic (Hijazi)'
  };

  /** Replays the word's audio; used by the page's R shortcut. */
  export function playAudio() {
    audioWrap?.querySelector('button')?.click();
  }

  function reveal() {
    trackEvent('review_card_flipped', { word_id: word.id, revealed: true });
    onReveal();
  }

  async function compareDialects() {
    trackEvent('review_card_dialect_comparison_requested', { word_id: word.id, dialect: word.dialect });
    isComparing = true;
    isComparisonModalOpen = true;
    comparisonData = null;
    comparisonError = null;

    try {
      const res = await fetch('/api/compare-dialects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: word.arabic,
          currentDialect: word.dialect,
          transliteration: word.transliteration
        })
      });

      if (res.ok) {
        comparisonData = await res.json();
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Failed to compare dialects' }));
        comparisonError = errorData.message || 'Failed to compare dialects. Please try again.';
      }
    } catch (e) {
      comparisonError = e instanceof Error ? e.message : 'An unexpected error occurred. Please try again.';
    } finally {
      isComparing = false;
    }
  }

  // Word selection for drag-to-highlight
  function handleWordMouseDown(index: number) {
    selectionStartIndex = index;
    selectionEndIndex = index;
    updateSelectedWords();
  }

  function handleWordMouseEnter(index: number) {
    selectionEndIndex = index;
    updateSelectedWords();
  }

  function updateSelectedWords() {
    const words = word.english.split(' ');
    const start = Math.min(selectionStartIndex, selectionEndIndex);
    const end = Math.max(selectionStartIndex, selectionEndIndex);
    selectedWords = words.slice(start, end + 1);
  }

  function clearSelection() {
    selectedWords = [];
    selectionStartIndex = -1;
    selectionEndIndex = -1;
  }

  function handleArabicWordMouseDown(index: number) {
    selectionStartIndexArabic = index;
    selectionEndIndexArabic = index;
    updateSelectedArabicWords();
  }

  function handleArabicWordMouseEnter(index: number) {
    selectionEndIndexArabic = index;
    updateSelectedArabicWords();
  }

  function updateSelectedArabicWords() {
    const arabicWords = word.arabic.split(' ');
    const start = Math.min(selectionStartIndexArabic, selectionEndIndexArabic);
    const end = Math.max(selectionStartIndexArabic, selectionEndIndexArabic);
    selectedArabicWords = arabicWords.slice(start, end + 1);
  }

  function clearArabicSelection() {
    selectedArabicWords = [];
    selectionStartIndexArabic = -1;
    selectionEndIndexArabic = -1;
  }

  function isArabicWordSelected(index: number): boolean {
    const start = Math.min(selectionStartIndexArabic, selectionEndIndexArabic);
    const end = Math.max(selectionStartIndexArabic, selectionEndIndexArabic);
    return selectedArabicWords.length > 0 && index >= start && index <= end;
  }

  function isWordSelected(index: number): boolean {
    const start = Math.min(selectionStartIndex, selectionEndIndex);
    const end = Math.max(selectionStartIndex, selectionEndIndex);
    return selectedWords.length > 0 && index >= start && index <= end;
  }

  // Map selected English words to the Arabic words at the same positions
  function mapEnglishToArabic(englishWords: string[]): string {
    const allEnglishWords = word.english.split(' ');
    const allArabicWords = word.arabic.split(' ');
    const selectedIndices: number[] = [];

    for (const englishWord of englishWords) {
      const index = allEnglishWords.findIndex(
        (w, i) => w.toLowerCase() === englishWord.toLowerCase() && !selectedIndices.includes(i)
      );
      if (index !== -1) selectedIndices.push(index);
    }

    const correspondingArabicWords = selectedIndices
      .sort((a, b) => a - b)
      .map((index) => allArabicWords[index])
      .filter((w) => w);

    if (correspondingArabicWords.length > 0) {
      return filterArabicCharacters(correspondingArabicWords.join(' '));
    }
    return filterArabicCharacters(word.arabic);
  }

  function countTokens(text: string) {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  async function askChatGTP(words: string | string[]) {
    if (offline) return;
    const wordsArray = Array.isArray(words) ? words : [words];
    const wordsText = wordsArray.join(' ');
    const hasArabicChars = /[؀-ۿ]/.test(wordsText);

    if (hasArabicChars) {
      targetArabicWord = wordsText;
      targetWord = '';
    } else {
      targetWord = wordsText;
      targetArabicWord = mapEnglishToArabic(wordsArray);
    }
    const isSingleWordDefinition = wordsArray.length === 1 && countTokens(targetArabicWord) === 1;

    isLoadingDefinition = true;
    isDefinitionModalOpen = true;
    trackEvent('review_card_definition_requested', { word_id: word.id, selected_text: wordsText, single_word: isSingleWordDefinition });

    const wordText = wordsArray.length === 1 ? wordsArray[0] : `the phrase "${wordsText}"`;
    const question = `What does ${wordText} mean in ${dialectName[word.dialect] || word.dialect}? Considering the following sentences:
		Arabic: "${word.arabic}"
		English: "${word.english}"
		Transliteration: "${word.transliteration}"

		Please provide a definition based on the context.`;

    try {
      const res = await fetch('/api/definition-sentence', {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: JSON.stringify({ question, isSingleWordDefinition })
      });
      const data = await res.json();

      try {
        let content = data.message?.content || '';
        if (content.includes('```')) {
          content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        }
        definition = JSON.stringify(JSON.parse(content));
      } catch {
        definition = data.message?.content || 'No definition available';
      }
    } catch (error) {
      console.error('Error fetching definition:', error);
      definition = 'Error loading definition. Please try again.';
    } finally {
      isLoadingDefinition = false;
    }
  }

  function closeDefinitionModal() {
    isDefinitionModalOpen = false;
    definition = '';
    targetWord = '';
    targetArabicWord = '';
    clearSelection();
    clearArabicSelection();
  }
</script>

<WordStatsModal isOpen={isStatsModalOpen} closeModal={() => (isStatsModalOpen = false)} {word} />

<DefinitionModal
  activeWordObj={{
    english: targetWord,
    arabic: targetArabicWord,
    isLoading: isLoadingDefinition,
    description: definition
  }}
  isModalOpen={isDefinitionModalOpen}
  closeModal={closeDefinitionModal}
  dialect={word.dialect as Dialect}
/>

<DialectComparisonModal
  isOpen={isComparisonModalOpen}
  closeModal={() => (isComparisonModalOpen = false)}
  originalText={word.arabic}
  originalEnglish={word.english}
  {comparisonData}
  isLoading={isComparing}
  error={comparisonError}
  currentDialect={word.dialect as Dialect}
/>

<article class="srs-paper relative rounded-2xl border border-tile-500 overflow-hidden">
  <!-- Meta row -->
  <header class="flex items-center justify-between px-5 sm:px-8 pt-5">
    <span class="srs-label">{dialectName[word.dialect] || word.dialect}</span>
    {#if isPractice}
      <span class="srs-label !text-[color:var(--srs-again)]">Again · practice</span>
    {:else if word.state === State.New}
      <span class="srs-label !text-[color:var(--srs-good)]">New word</span>
    {:else if recall !== null}
      <span class="srs-label inline-flex items-center gap-1.5" title="Chance you remember this word right now">
        <span
          class="w-1.5 h-1.5 rounded-full"
          style="background: {recall >= 0.85 ? 'var(--srs-easy)' : recall >= 0.7 ? 'var(--srs-hard)' : 'var(--srs-again)'}"
        ></span>
        {Math.round(recall * 100)}% recall
      </span>
    {/if}
  </header>

  <!-- The word -->
  <div class="px-5 sm:px-8 pt-8 sm:pt-12 pb-6 flex flex-col items-center text-center">
    {#if selectedArabicWords.length > 0}
      <div class="flex gap-3 mb-3 text-sm">
        <button type="button" class="underline underline-offset-4 text-text-300" onclick={() => askChatGTP(selectedArabicWords.join(' '))}>
          Define “{selectedArabicWords.join(' ')}”
        </button>
        <button type="button" class="text-text-200 hover:text-text-300" onclick={clearArabicSelection}>Clear</button>
      </div>
    {/if}

    <div
      class="flex flex-wrap justify-center gap-x-3 select-none word"
      use:wordDragSelect={{ onStart: handleArabicWordMouseDown, onExtend: handleArabicWordMouseEnter, onEnd: () => {} }}
      aria-label="Arabic word. Tap a word for its definition."
      role="application"
      dir="rtl"
    >
      {#each word.arabic.split(' ') as arabicWord, index (index)}
        <button
          type="button"
          data-word-zone
          data-word-index={index}
          onclick={() => askChatGTP(arabicWord)}
          aria-label={`Get definition for: ${arabicWord}`}
          class="font-bold text-text-300 leading-[1.5] rounded-lg px-1 transition-colors {isArabicWordSelected(index)
            ? 'bg-[color:color-mix(in_srgb,var(--srs-good)_18%,transparent)]'
            : 'hover:bg-[color:color-mix(in_srgb,var(--tile6)_35%,transparent)]'}"
          dir="rtl"
        >{arabicWord}</button>
      {/each}
    </div>

    <p class="h-7 mt-1 text-lg text-text-200 italic transition-opacity {showHint || revealed ? 'opacity-100' : 'opacity-0'}" aria-hidden={!(showHint || revealed)}>
      {word.transliteration}
    </p>

    <!-- Quiet tools -->
    <div class="mt-4 flex items-center gap-1 text-text-200">
      {#if !offline}
        <span bind:this={audioWrap} class="inline-flex">
          <AudioButton text={word.arabic} dialect={word.dialect as Dialect} audioUrl={word.audioUrl} className="!p-2 !rounded-full" />
        </span>
      {/if}
      {#if !revealed}
        <button
          type="button"
          class="tool"
          aria-pressed={showHint}
          onclick={() => { showHint = !showHint; trackEvent('review_card_hint_toggled', { word_id: word.id, visible: showHint }); }}
        >
          <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7.5 15.5h5M8 18h4M10 2.5a5.5 5.5 0 0 0-3.2 10c.5.4.7.9.7 1.5v.5h5V14c0-.6.3-1.1.7-1.5A5.5 5.5 0 0 0 10 2.5Z" stroke-linejoin="round"/></svg>
          {showHint ? 'Hide hint' : 'Hint'}
        </button>
      {/if}
      <button
        type="button"
        class="tool"
        onclick={() => { isStatsModalOpen = true; trackEvent('review_card_stats_opened', { word_id: word.id }); }}
      >
        <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2.5 15c3-8 6-10 15-11" stroke-linecap="round"/><path d="M2.5 17.5h15" stroke-linecap="round"/></svg>
        Memory
      </button>
    </div>
  </div>

  {#if !revealed}
    <div class="px-5 sm:px-8 pb-6">
      <button
        type="button"
        onclick={reveal}
        class="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-tile-400 hover:bg-tile-500 border border-tile-600 text-text-300 font-semibold transition-colors"
      >
        Show answer
        <kbd class="key">Space</kbd>
      </button>
    </div>
  {:else}
    <div class="answer px-5 sm:px-8 pb-6">
      <div class="divider mx-auto mb-5"></div>

      {#if selectedWords.length > 0}
        <div class="flex justify-center gap-3 mb-2 text-sm">
          <button type="button" class="underline underline-offset-4 text-text-300" onclick={() => askChatGTP(selectedWords)}>
            Define “{selectedWords.join(' ')}”
          </button>
          <button type="button" class="text-text-200 hover:text-text-300" onclick={clearSelection}>Clear</button>
        </div>
      {/if}

      <div
        class="rise flex flex-wrap justify-center text-2xl sm:text-3xl font-semibold text-text-300 select-none"
        use:wordDragSelect={{ onStart: handleWordMouseDown, onExtend: handleWordMouseEnter, onEnd: () => {} }}
        aria-label="English meaning. Tap a word for its definition."
        role="application"
      >
        {#each word.english.split(' ') as englishWord, index (index)}
          <button
            type="button"
            data-word-zone
            data-word-index={index}
            onclick={() => askChatGTP(englishWord)}
            aria-label={`Get definition for: ${englishWord}`}
            class="px-1 rounded-md transition-colors {isWordSelected(index)
              ? 'bg-[color:color-mix(in_srgb,var(--srs-good)_18%,transparent)]'
              : 'hover:bg-[color:color-mix(in_srgb,var(--tile6)_35%,transparent)]'}"
          >{englishWord}</button>
        {/each}
      </div>

      <div class="rise text-center mt-2" class:hidden={offline} style="animation-delay: 60ms">
        <button type="button" onclick={compareDialects} class="text-sm text-text-200 underline decoration-tile-600 underline-offset-4 hover:text-text-300">
          Compare across dialects
        </button>
      </div>

      <div class="rise grid grid-cols-4 gap-2 mt-6" style="animation-delay: 120ms" role="group" aria-label="How well did you remember it?">
        {#each ratings as r (r.value)}
          <button type="button" class="rate" style="--accent: {r.color}" onclick={() => onRate(r.value)}>
            <span class="font-semibold text-sm sm:text-base">{r.label}</span>
            <span class="text-xs tabular-nums text-text-200">
              {#if isPractice}{r.value === 1 ? 'soon' : 'done'}{:else}{formatInterval(previews[r.value])}{/if}
            </span>
            <kbd class="key absolute top-1.5 right-1.5">{r.value}</kbd>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</article>

<style>
  .word button {
    font-size: clamp(2.25rem, 8vw, 4.25rem);
  }

  .tool {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8125rem;
    transition: background-color 150ms, color 150ms;
  }

  .tool:hover,
  .tool[aria-pressed='true'] {
    background: color-mix(in srgb, var(--tile6) 35%, transparent);
    color: var(--text1);
  }

  .key {
    display: none;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.625rem;
    line-height: 1;
    padding: 0.2rem 0.35rem;
    border-radius: 0.25rem;
    border: 1px solid var(--tile6);
    color: var(--text3);
  }

  @media (hover: hover) {
    .key {
      display: inline-block;
    }
  }

  .divider {
    height: 1px;
    width: 4rem;
    background: var(--tile6);
    transform-origin: center;
    animation: draw 400ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }

  .rise {
    animation: rise 360ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }

  .rate {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.125rem;
    min-height: 3.75rem;
    padding: 0.5rem 0.25rem;
    border-radius: 0.75rem;
    border: 1px solid var(--tile5);
    border-top: 3px solid var(--accent);
    background: var(--tile3);
    color: var(--text1);
    transition: background-color 150ms, transform 100ms;
  }

  .rate:hover {
    background: color-mix(in srgb, var(--accent) 16%, var(--tile3));
  }

  .rate:active {
    transform: translateY(1px);
    background: color-mix(in srgb, var(--accent) 28%, var(--tile3));
  }

  .rate:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  @keyframes draw {
    from {
      transform: scaleX(0);
    }
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .divider,
    .rise {
      animation: none;
    }
  }
</style>
