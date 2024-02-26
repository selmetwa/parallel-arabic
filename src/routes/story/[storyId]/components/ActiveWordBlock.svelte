<script lang="ts">
	import type { KeyWord } from '../types';

	export let showBlock = true;
	export let activeWordObj: KeyWord = {
		english: '',
		arabic: '',
		transliterated: ''
	};
</script>

{#if showBlock}
	<div class="px-4 py-10 items-center flex flex-col text-left flex-1  bg-blue-300">
		{#if activeWordObj.arabic}
			<p class="text-4xl">{activeWordObj.arabic}</p>
			<p class="text-4xl">{activeWordObj.english}</p>
			<p class="text-4xl">{activeWordObj.transliterated}</p>
		{:else}
			<p class="m-auto w-fit">No active word</p>
      <p>Click on an arabic word</p>
		{/if}
	</div>
{/if}
