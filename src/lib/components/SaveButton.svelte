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
  <div class="absolute top-0 w-full py-4 bg-red-100 h-[107px] sm:h-[67px] left-0 text-center">
    <p class="font-semibold text-text-300 text-xl">{error}</p>
  </div>
{/if}
<Button onClick={!isLoading ? saveWord : undefined} type="button">
  {#if isLoading}

  <span class="flex flex-row items-center gap-2 text-center mx-auto">
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
  <span class="flex flex-row items-center gap-2 text-center">
    <Checkmark></Checkmark>
    Saved
  </span>
  {:else}
    Save {type}
  {/if}
</Button>
