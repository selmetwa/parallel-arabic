<script lang="ts">
	import type { KeyWord } from '../types';
	import Button from '../../../../components/Button.svelte';

	export let showBlock = true;
  let response = '';

	export let activeWordObj: KeyWord = {
		english: '',
		arabic: '',
		transliterated: ''
	};

	const saveWord = async () => {
		const res = await fetch(`${window.location.origin}/api/save-word`, {
			method: 'POST',
			headers: { accept: 'application/json' },
			body: JSON.stringify({
				activeWordObj
			})
		});

    const data = await res.json();
    response = data.message;
    setTimeout(() => {
      response = '';
    }, 3000);
	};
</script>

{#if showBlock}
	<div class="flex flex-1 flex-col items-center justify-center bg-tile-300 px-4 py-10 text-left">
		{#if activeWordObj.arabic}
			<div class="flex flex-col items-center p-4">
				<p class="text-4xl text-text-300">{activeWordObj.arabic}</p>
        <div class="flex flex-row items-center gap-2">
          <p class="text-xl text-text-200">{activeWordObj.english}</p>
          <p class="text-xl text-text-200">/</p>
				  <p class="text-xl text-text-200">{activeWordObj.transliterated}</p>
        </div>
        <div class="mt-2">
          <Button
            type="button"
            onClick={saveWord}
          >
            Save Word
          </Button>
          {#if response}
            <p class="text-md text-text-300">{response}</p>
          {/if}
        </div>
			</div>
		{:else}
			<div>
				<p class="m-auto w-fit text-xl font-semibold text-text-300">No active word</p>
				<p class="text-text-200">Click on an arabic word</p>
			</div>
		{/if}
	</div>
{/if}
