<script lang="ts">
	import VocabQuizBlock from '$lib/components/dialect-shared/vocab/VocabQuizBlock.svelte';

	import type { wordObjectGroup } from '$lib/types';

	interface Props {
		next: () => void;
		wordObj: wordObjectGroup;
	}

	let { wordObj, next }: Props = $props();
</script>

<VocabQuizBlock {wordObj} {next} dialect="egyptian-arabic" />
