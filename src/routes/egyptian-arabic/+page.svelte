<script lang="ts">
	import DialectLanding from '$lib/components/DialectLanding.svelte';

	import type { PracticeWord } from '$lib/types/words';

	let {
		data
	}: { data: { hasPhrases: boolean; hasWords: boolean; practiceWords: PracticeWord[] } } = $props();
</script>

<DialectLanding
	dialect="egyptian-arabic"
	hasPhrases={data.hasPhrases}
	hasWords={data.hasWords}
	practiceWords={data.practiceWords}
/>
