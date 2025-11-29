<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/Button.svelte';
  import AudioButton from '$lib/components/AudioButton.svelte';
  import { toast } from 'svelte-sonner';
  import cn from 'classnames';
  import type { Dialect } from '$lib/types';

  interface ReviewWord {
    id: string;
    arabic: string;
    english: string;
    transliteration: string;
    audioUrl?: string;
    dialect: string;
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    nextReviewDate: number | null;
    lastReviewDate: number | null;
    isLearning: boolean;
    masteryLevel: number;
    createdAt: number;
    status: 'learning' | 'due' | 'scheduled' | 'mastered';
    statusLabel: string;
  }

  let words = $state<ReviewWord[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let deletingIds = $state<Set<string>>(new Set());
  let filterStatus = $state<'all' | 'learning' | 'due' | 'scheduled' | 'mastered'>('all');
  let searchQuery = $state('');
  let sortBy = $state<'repetitions' | 'nextDue' | 'recentlyAdded'>('recentlyAdded');
  let sortOrder = $state<'asc' | 'desc'>('desc');

  onMount(() => {
    loadWords();
  });

  async function loadWords() {
    isLoading = true;
    error = null;
    
    try {
      const response = await fetch('/api/review-words-all');
      const result = await response.json();
      console.log('result', result);
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

      // Remove word from local state
      words = words.filter(w => w.id !== wordId);
      toast.success('Word removed successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete word');
    } finally {
      deletingIds.delete(wordId);
    }
  }

  function getStatusColor(status: ReviewWord['status']): string {
    switch (status) {
      case 'learning':
        return 'bg-blue-500/40 text-blue-100 border-blue-400';
      case 'due':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'scheduled':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'mastered':
        return 'bg-green-500/20 text-green-300 border-green-500/50';
      default:
        return 'bg-tile-600 text-text-200 border-tile-500';
    }
  }

  function formatDate(timestamp: number | null): string {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  const filteredWords = $derived.by(() => {
    let filtered = words;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(w => w.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w => 
        w.arabic.toLowerCase().includes(query) ||
        w.english.toLowerCase().includes(query) ||
        w.transliteration.toLowerCase().includes(query)
      );
    }

    // Sort the filtered words
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'repetitions':
          comparison = a.repetitions - b.repetitions;
          break;
        case 'nextDue':
          // Sort by next review date (null values go to end)
          if (a.nextReviewDate === null && b.nextReviewDate === null) {
            comparison = 0;
          } else if (a.nextReviewDate === null) {
            comparison = 1; // null goes to end
          } else if (b.nextReviewDate === null) {
            comparison = -1; // null goes to end
          } else {
            comparison = a.nextReviewDate - b.nextReviewDate;
          }
          break;
        case 'recentlyAdded':
          comparison = a.createdAt - b.createdAt;
          break;
      }
      
      // Apply sort order
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  });

  function handleSort(newSortBy: 'repetitions' | 'nextDue' | 'recentlyAdded') {
    // If clicking the same sort, toggle order; otherwise set new sort and default to desc
    if (sortBy === newSortBy) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = newSortBy;
      sortOrder = 'desc';
    }
  }

  const statusCounts = $derived.by(() => {
    return {
      all: words.length,
      learning: words.filter(w => w.status === 'learning').length,
      due: words.filter(w => w.status === 'due').length,
      scheduled: words.filter(w => w.status === 'scheduled').length,
      mastered: words.filter(w => w.status === 'mastered').length
    };
  });
</script>

<div class="min-h-screen bg-tile-200 py-8 px-4">
  <div class="max-w-7xl mx-auto">
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-text-300 mb-2">All Review Words</h1>
      <p class="text-text-200">View and manage all your words in review</p>
    </header>

    <!-- Filters and Search -->
    <div class="mb-6 flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div class="flex flex-wrap gap-2">
          <button
            onclick={() => filterStatus = 'all'}
            class={cn(
              "px-4 py-2 rounded-lg border transition-colors",
              filterStatus === 'all'
                ? "bg-tile-600 text-text-100 border-tile-500"
                : "bg-tile-300 text-text-200 border-tile-500 hover:bg-tile-400"
            )}
          >
            All ({statusCounts.all}) in review
          </button>
        </div>

        <input
          type="text"
          placeholder="Search words..."
          bind:value={searchQuery}
          class="px-4 py-2 rounded-lg border border-tile-500 bg-tile-300 text-text-100 placeholder-text-200 focus:outline-none focus:ring-2 focus:ring-tile-500"
        />
      </div>

      <!-- Sort Controls -->
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-text-200 text-sm font-medium">Sort by:</span>
        <div class="flex flex-wrap gap-2">
          <button
            onclick={() => handleSort('recentlyAdded')}
            class={cn(
              "px-3 py-1.5 rounded-lg border text-sm transition-colors",
              sortBy === 'recentlyAdded'
                ? "bg-tile-600 text-text-100 border-tile-500"
                : "bg-tile-300 text-text-200 border-tile-500 hover:bg-tile-400"
            )}
          >
            Recently Added {sortBy === 'recentlyAdded' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
          </button>
          <button
            onclick={() => handleSort('repetitions')}
            class={cn(
              "px-3 py-1.5 rounded-lg border text-sm transition-colors",
              sortBy === 'repetitions'
                ? "bg-tile-600 text-text-100 border-tile-500"
                : "bg-tile-300 text-text-200 border-tile-500 hover:bg-tile-400"
            )}
          >
            Repetitions {sortBy === 'repetitions' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
          </button>
          <button
            onclick={() => handleSort('nextDue')}
            class={cn(
              "px-3 py-1.5 rounded-lg border text-sm transition-colors",
              sortBy === 'nextDue'
                ? "bg-tile-600 text-text-100 border-tile-500"
                : "bg-tile-300 text-text-200 border-tile-500 hover:bg-tile-400"
            )}
          >
            Next Due {sortBy === 'nextDue' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    {#if isLoading}
      <div class="text-center py-12">
        <p class="text-text-200">Loading words...</p>
      </div>
    {:else if error}
      <div class="text-center py-12">
        <p class="text-red-300 mb-4">{error}</p>
        <Button onClick={loadWords} type="button">Retry</Button>
      </div>
    {:else if filteredWords.length === 0}
      <div class="text-center py-12">
        <p class="text-text-200 mb-4">
          {searchQuery || filterStatus !== 'all' 
            ? 'No words match your filters' 
            : 'No words in review yet'}
        </p>
        {#if searchQuery || filterStatus !== 'all'}
          <Button onClick={() => { searchQuery = ''; filterStatus = 'all'; }} type="button">
            Clear Filters
          </Button>
        {/if}
      </div>
    {:else}
      <!-- Words Table -->
      <div class="bg-tile-300 rounded-lg border border-tile-500 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-tile-600 border-b border-tile-500">
              <tr>
                <th class="px-4 py-3 text-left text-text-100 font-semibold">Arabic</th>
                <th class="px-4 py-3 text-left text-text-100 font-semibold">English</th>
                <th class="px-4 py-3 text-left text-text-100 font-semibold">Transliteration</th>
                <th class="px-4 py-3 text-left text-text-100 font-semibold">Dialect</th>
                <th class="px-4 py-3 text-left text-text-100 font-semibold">Status</th>
                <th 
                  class="px-4 py-3 text-left text-text-100 font-semibold cursor-pointer hover:bg-tile-500 transition-colors"
                  onclick={() => handleSort('repetitions')}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort('repetitions');
                    }
                  }}
                >
                  Repetitions {sortBy === 'repetitions' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th 
                  class="px-4 py-3 text-left text-text-100 font-semibold cursor-pointer hover:bg-tile-500 transition-colors"
                  onclick={() => handleSort('nextDue')}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort('nextDue');
                    }
                  }}
                >
                  Next Review {sortBy === 'nextDue' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th class="px-4 py-3 text-left text-text-100 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredWords as word (word.id)}
                <tr class="border-b border-tile-500 hover:bg-tile-400 transition-colors">
                  <td class="px-4 py-3 text-text-100 text-lg">
                    <div class="flex items-center gap-2">
                      {word.arabic}
                      {#if word.audioUrl}
                        <AudioButton audioUrl={word.audioUrl} text={word.arabic} dialect={word.dialect as Dialect} />
                      {/if}
                    </div>
                  </td>
                  <td class="px-4 py-3 text-text-200">{word.english}</td>
                  <td class="px-4 py-3 text-text-200">{word.transliteration}</td>
                  <td class="px-4 py-3 text-text-200 capitalize">
                    {word.dialect.replace('-', ' ')}
                  </td>
                  <td class="px-4 py-3">
                    <span class={cn(
                      "px-2 py-1 rounded text-xs font-medium border",
                      getStatusColor(word.status)
                    )}>
                      {word.statusLabel}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-text-200">{word.repetitions}</td>
                  <td class="px-4 py-3 text-text-200 text-sm">
                    {formatDate(word.nextReviewDate)}
                  </td>
                  <td class="px-4 py-3">
                    <button
                      onclick={() => deleteWord(word.id)}
                      disabled={deletingIds.has(word.id)}
                      class={cn(
                        "px-3 py-1 rounded text-sm font-medium transition-colors",
                        deletingIds.has(word.id)
                          ? "bg-tile-500 text-text-200 cursor-not-allowed"
                          : "bg-red-500/40 text-red-100 hover:bg-red-500/50 border border-red-400"
                      )}
                    >
                      {deletingIds.has(word.id) ? 'Removing...' : 'Remove'}
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 text-sm text-text-200">
        Showing {filteredWords.length} of {words.length} words
      </div>
    {/if}
  </div>
</div>

<style>
  table {
    border-collapse: collapse;
  }
  
  th, td {
    text-align: left;
  }
</style>

