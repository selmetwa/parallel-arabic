<script lang="ts">
	import DialectLanding from '$lib/components/DialectLanding.svelte';

	let { data }: { data: { hasPhrases: boolean; hasWords: boolean } } = $props();
</script>

<DialectLanding dialect="fusha" hasPhrases={data.hasPhrases} hasWords={data.hasWords} />
