<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";
  import AudioButton from "$lib/components/AudioButton.svelte";
  import SaveButton from "$lib/components/SaveButton.svelte";
  import Button from "$lib/components/Button.svelte";
  import DialectComparisonModal from './DialectComparisonModal.svelte';
  import { type Dialect } from '$lib/types/index';
  import type { DialectComparisonSchema } from '$lib/utils/gemini-schemas';
  
  type Props = {
    activeWordObj: any;
    isModalOpen: boolean;
    closeModal: () => void;
    dialect: Dialect;
  }

  let { activeWordObj = {
    english: "",
    arabic: "",
    description: "",
    isLoading: false,
  }, isModalOpen = false, closeModal, dialect }: Props = $props();

  let error = $derived("");

  // Dialect Comparison State
  let isComparisonModalOpen = $state(false);
  let comparisonData = $state<DialectComparisonSchema | null>(null);
  let isComparing = $state(false);
  let comparisonError = $state<string | null>(null);

  async function compareDialects() {
    isComparing = true;
    isComparisonModalOpen = true;
    comparisonData = null;
    comparisonError = null;

    try {
        const res = await fetch('/api/compare-dialects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              text: activeWordObj.arabic,
              currentDialect: dialect,
              transliteration: activeWordObj.transliterated || activeWordObj.transliteration
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

  function closeComparisonModal() {
    isComparisonModalOpen = false;
  }
</script>

<DialectComparisonModal
    isOpen={isComparisonModalOpen}
    closeModal={closeComparisonModal}
    originalText={activeWordObj.arabic}
    originalEnglish={activeWordObj.english}
    {comparisonData}
    isLoading={isComparing}
    error={comparisonError}
    currentDialect={dialect}
/>

{#if error}
  <div class="absolute top-0 w-full py-4 bg-red-100 h-[107px] sm:h-[67px] left-0 text-center z-50">
    <p class="font-semibold text-text-300 text-xl">{error}</p>
  </div>
{/if}
<Modal isOpen={isModalOpen} handleCloseModal={closeModal} width="max(70%, 600px)" height="fit-content">
	<div class="flex flex-col items-center p-6 min-w-[400px]">
		<!-- Arabic Word Display -->
		{#if activeWordObj.arabic}
			<div class="text-center mb-4">
				<p class="text-5xl text-text-300 font-bold mb-2">{activeWordObj.arabic}</p>
				{#if activeWordObj.english}
					<p class="text-2xl text-text-200">{activeWordObj.english}</p>
				{/if}
			</div>
		{/if}

		<!-- Definition -->
		{#if activeWordObj.description && !activeWordObj.isLoading}
			<div class="bg-tile-300 border border-tile-500 p-4 rounded mb-4 w-full">
				<h4 class="text-sm font-bold text-text-200 mb-2">Definition</h4>
				<p class="text-text-300 leading-relaxed">{activeWordObj.description}</p>
			</div>
		{/if}

		<!-- Loading State -->
		{#if activeWordObj.isLoading}
			<div role="status" class="flex flex-col items-center py-6">
				<svg aria-hidden="true" class="my-3 w-12 h-12 text-text-200 animate-spin dark:text-text-200 fill-tile-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
					<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
				</svg>
				<span class="text-text-200">Loading definition...</span>
			</div>
		{/if}

		<!-- Action Buttons -->
		{#if !activeWordObj.isLoading && activeWordObj.description && activeWordObj.arabic}
			<div class="flex gap-3 w-full">
				<!-- Audio Button -->
				<div class="flex-1">
					<AudioButton text={activeWordObj.arabic} {dialect}>
						🔊 Listen to Arabic
					</AudioButton>
				</div>
				
				<!-- Compare Button -->
				<div class="flex-1">
					<Button onClick={compareDialects} type="button">
						Compare Dialects
					</Button>
				</div>
				
				<!-- Save Button -->
				<div class="flex-1">
					<SaveButton objectToSave={activeWordObj} type="Word" />
				</div>
			</div>
		{/if}
	</div>
</Modal>