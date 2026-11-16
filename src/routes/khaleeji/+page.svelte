<script lang="ts">
	import DialectLanding from '$lib/components/DialectLanding.svelte';

	import type { PracticeWord } from '$lib/types/words';

	let {
		data
	}: {
		data: { hasPhrases: boolean; hasWords: boolean; practiceWords: (PracticeWord & { slug: string })[]; learners: number };
	} = $props();
</script>

<DialectLanding
	dialect="khaleeji"
	hasPhrases={data.hasPhrases}
	hasWords={data.hasWords}
	practiceWords={data.practiceWords}
	learners={data.learners}
/>
