<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import GenerateWordsModal from '$lib/components/review/GenerateWordsModal.svelte';
  import GenerateSentencesModal from '$lib/components/review/GenerateSentencesModal.svelte';
  import ImportWordsModal from '$lib/components/review/ImportWordsModal.svelte';
  import StrengthBar from '$lib/components/review/StrengthBar.svelte';
  import { toast } from 'svelte-sonner';
  import type { Dialect } from '$lib/types';
  import type { PageData } from './$types';
  import { trackEvent } from '$lib/analytics';
  import { formatDue, masteryLevel, type ReviewWord } from '$lib/srs/fsrs';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let showGenerateWords = $state(false);
  let showGenerateSentences = $state(false);
  let showImport = $state(false);

  type Status = 'new' | 'due' | 'learning' | 'mastered';
  type SortBy = 'recentlyAdded' | 'weakest' | 'nextDue';

  interface DeckWord extends ReviewWord {
    createdAt: number;
    status: Status;
  }

  const filters: { value: 'all' | Status; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'due', label: 'Due' },
    { value: 'new', label: 'New' },
    { value: 'learning', label: 'Learning' },
    { value: 'mastered', label: 'Mastered' }
  ];

  const sorts: { value: SortBy; label: string }[] = [
    { value: 'recentlyAdded', label: 'Recently added' },
    { value: 'weakest', label: 'Weakest first' },
    { value: 'nextDue', label: 'Next due' }
  ];

  let words = $state<DeckWord[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let deletingIds = $state<Set<string>>(new Set());
  let filterStatus = $state<'all' | Status>('all');
  let searchQuery = $state('');
  let sortBy = $state<SortBy>('recentlyAdded');

  onMount(() => {
    loadWords();
  });

  async function loadWords() {
    isLoading = true;
    error = null;

    try {
      const response = await fetch('/api/review-words-all');
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load words');
      }

      words = result.words || [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load words';
      toast.error('Failed to load words');
    } finally {
      isLoading = false;
    }
  }

  async function deleteWord(wordId: string) {
    if (!confirm('Are you sure you want to remove this word from your review list?')) {
      return;
    }

    deletingIds.add(wordId);

    try {
      const response = await fetch('/api/review-word-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ saved_word_id: wordId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete word');
      }

      const deleted = words.find((w) => w.id === wordId);
      trackEvent('review_word_deleted', { word_id: wordId, status_before_delete: deleted?.status, dialect: deleted?.dialect });
      words = words.filter((w) => w.id !== wordId);
      toast.success('Word removed successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete word');
    } finally {
      deletingIds.delete(wordId);
    }
  }

  function dueLabel(word: DeckWord): string {
    if (word.status === 'new') return 'new';
    return formatDue(word.nextReviewDate);
  }

  const filteredWords = $derived.by(() => {
    let filtered = words;

    if (filterStatus !== 'all') {
      filtered = filtered.filter((w) => w.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.arabic.toLowerCase().includes(query) ||
          w.english.toLowerCase().includes(query) ||
          w.transliteration.toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'weakest':
          // New words have no strength yet; list them after the weakest reviewed ones
          return (a.stability ?? Infinity) - (b.stability ?? Infinity);
        case 'nextDue':
          return (a.nextReviewDate ?? Infinity) - (b.nextReviewDate ?? Infinity);
        default:
          return b.createdAt - a.createdAt;
      }
    });
  });

  function handleSort(next: SortBy) {
    sortBy = next;
    trackEvent('review_all_words_sorted', { sort_by: next });
  }

  const statusCounts = $derived.by(() => {
    const counts: Record<'all' | Status, number> = { all: words.length, new: 0, due: 0, learning: 0, mastered: 0 };
    for (const w of words) counts[w.status]++;
    return counts;
  });
</script>

<div class="min-h-screen bg-tile-300">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
    <header class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <a href={resolve('/review')} class="srs-label hover:!text-text-300">← Review</a>
        <h1 class="text-2xl sm:text-3xl text-text-300 font-semibold tracking-tight mt-1">My words</h1>
        <p class="text-sm text-text-200 mt-1">{statusCounts.all} words · {statusCounts.mastered} mastered</p>
      </div>
      <div class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-200">
        <button type="button" class="hover:text-text-300" onclick={() => { showGenerateWords = true; trackEvent('review_generate_words_opened', { source: 'all_words' }); }}>
          + Generate words
        </button>
        <button type="button" class="hover:text-text-300" onclick={() => { showGenerateSentences = true; trackEvent('review_generate_sentences_opened', { source: 'all_words' }); }}>
          + Sentences
        </button>
        <button type="button" class="hover:text-text-300" onclick={() => { showImport = true; trackEvent('review_import_opened', { source: 'all_words' }); }}>
          + Import
        </button>
      </div>
    </header>

    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
        {#each filters as f (f.value)}
          <button
            type="button"
            aria-pressed={filterStatus === f.value}
            onclick={() => { filterStatus = f.value; trackEvent('review_all_words_filtered', { filter_status: f.value, results_count: statusCounts[f.value] }); }}
            class="chip"
          >
            {f.label}
            <span class="tabular-nums opacity-60">{statusCounts[f.value]}</span>
          </button>
        {/each}
      </div>

      <input
        type="search"
        placeholder="Search"
        bind:value={searchQuery}
        onchange={() => searchQuery.trim() && trackEvent('review_all_words_searched', { query: searchQuery, results_count: filteredWords.length })}
        class="w-full sm:w-56 px-3.5 py-2 rounded-lg border border-tile-500 bg-tile-200 text-text-300 text-sm placeholder:text-text-200 focus:outline-none focus:border-tile-600"
      />
    </div>

    <div class="mb-3 flex items-center gap-3 text-xs">
      <span class="srs-label">Sort</span>
      {#each sorts as s (s.value)}
        <button
          type="button"
          onclick={() => handleSort(s.value)}
          class="{sortBy === s.value ? 'text-text-300 font-semibold underline underline-offset-4' : 'text-text-200 hover:text-text-300'}"
        >
          {s.label}
        </button>
      {/each}
    </div>

    {#if isLoading}
      <p class="text-center text-text-200 py-16">Loading your words…</p>
    {:else if error}
      <div class="text-center py-16">
        <p class="text-[color:var(--srs-again)] mb-4">{error}</p>
        <button type="button" class="px-4 py-2 rounded-lg bg-tile-400 border border-tile-600 text-text-300 font-semibold" onclick={loadWords}>Retry</button>
      </div>
    {:else if filteredWords.length === 0}
      <div class="text-center py-16">
        <p class="text-text-200 mb-4">
          {searchQuery || filterStatus !== 'all' ? 'No words match your filters' : 'No words in review yet'}
        </p>
        {#if searchQuery || filterStatus !== 'all'}
          <button type="button" class="text-sm text-text-300 underline underline-offset-4" onclick={() => { searchQuery = ''; filterStatus = 'all'; }}>
            Clear filters
          </button>
        {/if}
      </div>
    {:else}
      <ul class="rounded-2xl border border-tile-500 bg-tile-200 divide-y divide-tile-500 overflow-hidden">
        {#each filteredWords as word (word.id)}
          <li class="group grid grid-cols-[1fr_auto_auto] sm:grid-cols-[minmax(0,11rem)_1fr_auto_auto] items-center gap-x-4 gap-y-1 px-4 sm:px-5 py-3.5 hover:bg-tile-300 transition-colors">
            <p class="text-2xl font-semibold text-text-300 leading-snug truncate sm:text-right" dir="rtl">{word.arabic}</p>
            <div class="row-start-2 sm:row-start-auto min-w-0">
              <p class="text-text-300 truncate">{word.english}</p>
              <p class="text-xs text-text-200 truncate">
                <span class="italic">{word.transliteration}</span>
                <span class="mx-1 opacity-50">·</span>
                <span class="capitalize">{word.dialect.replace('-', ' ')}</span>
              </p>
            </div>
            <div class="row-span-2 sm:row-span-1 flex flex-col items-end gap-1 sm:w-20">
              <StrengthBar level={masteryLevel(word.state, word.stability)} />
              <span class="text-xs tabular-nums {word.status === 'due' ? 'text-[color:var(--srs-good)] font-semibold' : 'text-text-200'}">{dueLabel(word)}</span>
            </div>
            <div class="row-span-2 sm:row-span-1 flex items-center gap-1 text-text-200">
              {#if word.audioUrl}
                <AudioButton audioUrl={word.audioUrl} text={word.arabic} dialect={word.dialect as Dialect} className="!p-1.5 !rounded-full" />
              {/if}
              <button
                type="button"
                onclick={() => deleteWord(word.id)}
                disabled={deletingIds.has(word.id)}
                class="p-1.5 rounded-full opacity-60 group-hover:opacity-100 hover:text-[color:var(--srs-again)] hover:bg-tile-400 transition disabled:cursor-not-allowed"
                aria-label="Remove {word.english} from review"
                title="Remove"
              >
                <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </li>
        {/each}
      </ul>

      <p class="mt-4 text-xs text-text-200">Showing {filteredWords.length} of {words.length} words</p>
    {/if}
  </div>
</div>

<GenerateWordsModal bind:open={showGenerateWords} user={data.user} onCompleted={loadWords} />
<GenerateSentencesModal bind:open={showGenerateSentences} user={data.user} onCompleted={loadWords} />
<ImportWordsModal bind:open={showImport} user={data.user} onImported={loadWords} />

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8125rem;
    border: 1px solid var(--tile5);
    color: var(--text2);
    transition: background-color 150ms, color 150ms;
  }

  .chip:hover {
    background: var(--tile4);
    color: var(--text1);
  }

  .chip[aria-pressed='true'] {
    background: var(--text1);
    border-color: var(--text1);
    color: var(--tile2);
  }
</style>
