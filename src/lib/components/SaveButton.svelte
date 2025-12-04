<script>
  import Button from "$lib/components/Button.svelte";
  import Checkmark from "$lib/components/Checkmark.svelte";
  import { supabase } from '$lib/supabaseClient';
  
  /**
   * @typedef {Object} Props
   * @property {any} [objectToSave]
   * @property {string} [type]
   */

  /** @type {Props} */
  let { objectToSave = {}, type = 'Word' } = $props();

  let response = $state('');
  let isLoading = $state(false);
  let error = $state('');

  const saveWord = async () => {
    isLoading = true;
    error = '';
    
    try {
      // Get current Supabase session for auth token

      const res = await fetch('/api/save-word', {
        method: 'POST',
        headers: { 
          'accept': 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          activeWordObj: objectToSave
        })
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.message || 'Something went wrong';
        response = '';
      } else if ([
        'You have already saved this', 
        'You must have an account to do that',
        'Something went wrong'
      ].includes(data.message)) {
        error = data.message;
        response = '';
      } else {
        error = '';
        response = data.message;
      }
    } catch (err) {
      error = 'Network error occurred';
      response = '';
    }
    
    isLoading = false;
    
    // Clear messages after 3 seconds
    setTimeout(() => {
      error = '';
      response = '';
    }, 3000);
  };
</script>

{#if error}
  <div class="absolute top-0 w-full py-4 bg-red-100 h-[107px] sm:h-[67px] left-0 text-center z-50">
    <p class="font-semibold text-text-300 text-xl">{error}</p>
  </div>
{/if}
<button
  onclick={!isLoading ? saveWord : undefined}
  disabled={isLoading}
  class="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg md:hover:bg-emerald-700 transition-all duration-200 shadow-sm md:hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
>
  {#if isLoading}
    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>Saving...</span>
  {:else if response && !error}
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
    </svg>
    <span>Saved!</span>
  {:else}
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
    </svg>
    <span>Save</span>
  {/if}
</button>
