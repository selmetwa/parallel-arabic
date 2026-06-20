<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import Button from '$lib/components/Button.svelte';
  import { goto } from '$app/navigation';
  import { trackEvent } from '$lib/analytics';
  import { SvelteSet } from 'svelte/reactivity';

  interface GeneratedItem {
    arabic: string;
    english: string;
    transliteration: string;
  }

  interface Props {
    type: 'sentences' | 'words';
    dialect: string;
    dialectLabel: string;
    isGenerating: boolean;
    items: GeneratedItem[];
    onClose: () => void;
    /** Called after items are saved so the host can refresh its list. */
    onSaved?: (count: number) => void;
    /** Action for the "Start Reviewing" button on the success screen. */
    onStartReviewing?: () => void;
  }

  let { type, dialect, dialectLabel, isGenerating, items, onClose, onSaved, onStartReviewing }: Props = $props();

  // Track which indices the user has *deselected*. Starting empty means
  // "everything selected" by default, and avoids seeding state from the `items`
  // prop. The host wraps this component in {#key items} so a fresh generation
  // remounts it (resetting selection and the saved state).
  let deselected = new SvelteSet<number>();
  let isImporting = $state(false);
  let saved = $state(false);
  let savedCount = $state(0);
  let importError = $state<string | null>(null);

  const selectedCount = $derived(items.reduce((count, _, i) => (deselected.has(i) ? count : count + 1), 0));

  function isSelected(index: number) {
    return !deselected.has(index);
  }

  function toggleItem(index: number) {
    if (deselected.has(index)) {
      deselected.delete(index);
    } else {
      deselected.add(index);
    }
  }

  function selectAll() {
    deselected.clear();
  }

  function deselectAll() {
    items.forEach((_, i) => deselected.add(i));
  }

  async function importSelected() {
    if (selectedCount === 0) return;
    isImporting = true;
    importError = null;
    try {
      const itemsToImport = items.filter((_, index) => !deselected.has(index));

      const saveRes = await fetch('/api/save-sentences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentences: itemsToImport, dialect })
      });

      const saveResult = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saveResult.error || 'Failed to save items');
      }

      savedCount = saveResult.saved;
      saved = true;
      trackEvent('review_generated_items_saved', { type, count: saveResult.saved, dialect });
      onSaved?.(savedCount);
    } catch (error) {
      importError = error instanceof Error ? error.message : 'Failed to import selected items';
    } finally {
      isImporting = false;
    }
  }

  function startReviewing() {
    onClose();
    if (onStartReviewing) {
      onStartReviewing();
    } else {
      goto('/review');
    }
  }
</script>

{#if isGenerating}
  <!-- Loading -->
  <Modal isOpen={true} handleCloseModal={onClose} width="600px">
    <div class="p-8 text-center relative">
      <div class="absolute inset-0 bg-gradient-to-br from-tile-200 to-tile-300 opacity-50 rounded-xl"></div>
      <div class="relative z-10">
        <div class="w-24 h-24 mx-auto mb-6 relative">
          <div class="absolute inset-0 border-4 border-tile-400 rounded-full"></div>
          <div class="absolute inset-0 border-4 border-tile-600 rounded-full border-t-transparent animate-spin"></div>
          <div class="absolute inset-2 bg-tile-300 rounded-full flex items-center justify-center text-3xl">✨</div>
        </div>
        <h2 class="text-3xl font-bold text-text-300 mb-4 animate-pulse">
          Generating {type === 'sentences' ? 'Sentences' : 'Words'}...
        </h2>
        <p class="text-xl text-text-200 mb-8 leading-relaxed">
          {type === 'sentences'
            ? `Creating personalized practice sentences in ${dialectLabel}. This usually takes about 30-60 seconds.`
            : `Curating a list of ${dialectLabel} words based on your preferences. Almost there!`}
        </p>
        <div class="bg-gradient-to-br from-tile-300/50 to-tile-400/30 border border-tile-500 rounded-xl p-4 text-left shadow-inner">
          <div class="flex items-start gap-3">
            <span class="text-2xl">💡</span>
            <div>
              <p class="font-bold text-text-300 text-sm mb-1">Pro Tip</p>
              <p class="text-text-200 text-sm">
                You can close this modal and continue using the app. We'll notify you when your {type === 'sentences' ? 'sentences' : 'words'} are ready!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
{:else if saved && savedCount > 0}
  <!-- Success -->
  <Modal isOpen={true} handleCloseModal={onClose} width="600px">
    <div class="p-8 text-center">
      <div class="text-7xl mb-6">🎉</div>
      <h2 class="text-3xl font-bold text-text-300 mb-4">Import Complete!</h2>
      <p class="text-xl text-text-200 mb-8 leading-relaxed">
        Successfully added <strong class="text-text-300">{savedCount}</strong> new {type === 'sentences' ? 'sentence' : 'word'}{savedCount !== 1 ? 's' : ''} to your review deck.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={startReviewing} type="button" className="!bg-green-600 !hover:bg-green-700 !text-white !text-lg !px-8 !py-3">
          Start Reviewing
        </Button>
        <Button onClick={onClose} type="button" className="!text-lg !px-8 !py-3">
          Close
        </Button>
      </div>
    </div>
  </Modal>
{:else if items.length > 0}
  <!-- Selection -->
  <Modal isOpen={true} handleCloseModal={onClose} width="800px">
    <div class="p-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-3xl font-bold text-text-300">
          Select {type === 'sentences' ? 'Sentences' : 'Words'} to Import
        </h2>
        <button
          aria-label="Close"
          class="p-2 hover:bg-tile-400 rounded-lg transition-colors text-text-200 hover:text-text-300"
          onclick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="mb-4 flex items-center justify-between">
        <p class="text-text-200">
          {selectedCount} of {items.length} selected
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            onclick={selectAll}
            class="px-4 py-2 text-sm bg-tile-400 hover:bg-tile-500 text-text-300 rounded-lg transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onclick={deselectAll}
            class="px-4 py-2 text-sm bg-tile-400 hover:bg-tile-500 text-text-300 rounded-lg transition-colors"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div class="max-h-[500px] overflow-y-auto space-y-3 mb-6 scrollbar-thin">
        {#each items as item, index (index)}
          <div
            class="p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer transform hover:scale-[1.01] {isSelected(index) ? 'border-tile-600 bg-gradient-to-br from-tile-400/70 to-tile-400/50 shadow-md' : 'border-tile-500 bg-tile-300/30 hover:bg-tile-400/40 hover:shadow-sm'}"
            onclick={() => toggleItem(index)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleItem(index); } }}
            role="button"
            tabindex="0"
          >
            <div class="flex items-start gap-4">
              <div class="relative flex-shrink-0 mt-1 group">
                <input
                  type="checkbox"
                  checked={isSelected(index)}
                  onchange={() => toggleItem(index)}
                  class="w-6 h-6 cursor-pointer rounded-md border-2 border-tile-600 bg-tile-200 checked:bg-gradient-to-br checked:from-tile-600 checked:to-tile-700 checked:border-tile-700 transition-all duration-200 group-hover:scale-110"
                />
              </div>
              <div class="flex-1 space-y-2">
                <div class="text-2xl sm:text-3xl font-bold text-text-300 leading-tight">{item.arabic}</div>
                <div class="text-base sm:text-lg text-text-200">{item.english}</div>
                <div class="text-sm text-text-200/80 italic font-light">{item.transliteration}</div>
              </div>
            </div>
          </div>
        {/each}
      </div>

      {#if importError}
        <div class="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>{importError}</p>
        </div>
      {/if}

      <div class="flex flex-col sm:flex-row gap-4 justify-end">
        <Button onClick={onClose} type="button" className="!text-lg !px-8 !py-3">
          Cancel
        </Button>
        <Button
          onClick={importSelected}
          type="button"
          className="!bg-green-600 !hover:bg-green-700 !text-white !text-lg !px-8 !py-3"
          disabled={selectedCount === 0 || isImporting}
        >
          {#if isImporting}
            Importing...
          {:else}
            Import {selectedCount} {type === 'sentences' ? 'Sentence' : 'Word'}{selectedCount !== 1 ? 's' : ''}
          {/if}
        </Button>
      </div>
    </div>
  </Modal>
{/if}
