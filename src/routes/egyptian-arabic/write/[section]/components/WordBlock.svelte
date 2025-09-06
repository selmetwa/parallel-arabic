<script lang="ts">
	import WriteWordBlock from '$lib/components/dialect-shared/vocab/WriteWordBlock.svelte';

	type Word = {
		english: string;
		arabic: string;
		transliteration: string;
		audioUrl?: string;
	};

	interface Props {
		word: Word;
		mode: string;
		switchMode: () => void;
	}

	let { word, mode, switchMode }: Props = $props();
</script>

<WriteWordBlock {word} {mode} {switchMode} dialect="egyptian-arabic" />
