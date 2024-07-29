<script lang="ts">
	import type { KeyWord } from '../types';

	export let word = '';
	export let keyWords: KeyWord[] = [];
	export let assignActiveWord = (event: Event) => {};
	export let type = '';
</script>

<button class="text-4xl text-text-300 px-1 rounded-sm transitional-all duration-300 hover:bg-tile-500" value={word} on:click={assignActiveWord}>
  {word}
</button>
