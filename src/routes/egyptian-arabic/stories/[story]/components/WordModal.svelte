<script>
  import Modal from "$lib/components/Modal.svelte";
  import Button from "$lib/components/Button.svelte";
  import Checkmark from "$lib/components/Checkmark.svelte";
  import { getWordObjectToSave } from '$lib/helpers/get-word-object-to-save';
  import AudioButton from "$lib/components/AudioButton.svelte";
  import DialectComparisonModal from "$lib/components/dialect-shared/sentences/DialectComparisonModal.svelte";

  /**
   * @typedef {Object} Props
   * @property {any} [activeWordObj]
   * @property {boolean} [isModalOpen]
   * @property {any} closeModal
   */

  /** @type {Props} */
  let { activeWordObj = {
    english: "",
    arabic: "",
    transliterated: "",
    description: "",
    isLoading: false,
    type: "",
  }, isModalOpen = false, closeModal } = $props();

  let response = $state("");
  
  let error = $state("");
  
  let isLoading = $state(false);
  
  // Dialect Comparison State
  let isComparisonModalOpen = $state(false);
  let comparisonData = $state(null);
  let isComparing = $state(false);
  let comparisonError = $state(null);

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
          currentDialect: 'egyptian-arabic',
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

  const saveWord = async () => {
    isLoading = true;
    const wordToSave = activeWordObj.arabic;
    const type = activeWordObj.type;

    const result = await getWordObjectToSave(wordToSave, type);
    
    if (result.error) {
      error = result.error;
      response = '';
      isLoading = false;

      setTimeout(() => {
        error = '';
        response = '';
      }, 3000);

      return;
    }

    if (!result.success || !result.data) {
      error = 'Failed to get word data';
      response = '';
      isLoading = false;
      setTimeout(() => {
        error = '';
      }, 3000);
      return;
    }

    const _activeWordObj = result.data;
  
		const res = await fetch('/api/save-word', {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				activeWordObj: _activeWordObj
			})
		});

    isLoading = false;
		const data = await res.json();

    if ([
      'You have already saved this', 
      'You must have an account do that',
      'Something went wrong'
    ].includes(data.message)) {
      error = data.message;
      response = '';
    } else {
      error = '';
      response = data.message;
    }

		setTimeout(() => {
      error = '';
			response = '';
		}, 3000);
	};
</script>

<DialectComparisonModal
  isOpen={isComparisonModalOpen}
  closeModal={closeComparisonModal}
  originalText={activeWordObj.arabic}
  originalEnglish={activeWordObj.english}
  {comparisonData}
  isLoading={isComparing}
  error={comparisonError}
  currentDialect="egyptian-arabic"
/>

{#if error}
  <div class="absolute top-0 w-full py-4 bg-red-100 h-[107px] sm:h-[67px] left-0 text-center z-50">
    <p class="font-semibold text-text-300 text-xl">{error}</p>
  </div>
{/if}
<Modal isOpen={isModalOpen} handleCloseModal={closeModal} width="max(70%, 600px)" height="fit-content">
	<div class="flex flex-col items-center p-4">
		<p class="text-4xl text-text-300">{activeWordObj.arabic}</p>
    <p class="my-2 text-text-200">{activeWordObj.description}</p>

    {#if activeWordObj.isLoading}
      <div role="status">
        <svg aria-hidden="true" class="my-3 w-12 h-12 text-text-200 animate-spin dark:text-text-200 fill-tile-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
        </svg>
        <span class="sr-only">Loading...</span>
      </div>
    {/if}
		<div class="mt-2 flex w-full flex-col gap-2">
      <div class="flex flex-row gap-2">
        <div class="flex flex-1">
			<Button type="button" onClick={saveWord}>
        {#if isLoading}
        <span class="flex flex-row items-center gap-2 text-center mx-auto w-fit">
          <div role="status">
            <svg
              aria-hidden="true"
              class="h-[24px] w-[24px] animate-spin fill-tile-300 text-text-200 dark:text-text-200"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span class="sr-only">Loading...</span>
          </div>
          Saving
        </span>
        {:else if response && !error}
        <span class="flex flex-row items-center gap-2 text-center mx-auto w-fit">
          <Checkmark></Checkmark>
          Saved
        </span>
        {:else}
          Save Word
        {/if}
      </Button>
    </div>
    <div class="flex flex-1">
      <AudioButton text={activeWordObj.arabic} dialect="egyptian-arabic">
        Audio
      </AudioButton>
    </div>
      </div>
      <div class="flex w-full">
        <Button type="button" onClick={compareDialects}>
          Compare Dialects
        </Button>
      </div>
		</div>
	</div>
</Modal>