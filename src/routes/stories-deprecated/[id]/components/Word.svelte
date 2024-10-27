<script lang="ts">
	import type { KeyWord } from '../types';

	interface Props {
		word?: string;
		keyWords?: KeyWord[];
		assignActiveWord?: any;
		type?: string;
	}

	let {
		word = '',
		keyWords = [],
		assignActiveWord = (event: Event) => {},
		type = ''
	}: Props = $props();
</script>

<button class="text-4xl text-text-300 px-1 rounded-sm transitional-all duration-300 hover:bg-tile-500" value={word} onclick={assignActiveWord}>
  {word}
</button>
