<script lang="ts">
	import DialectLanding from '$lib/components/DialectLanding.svelte';

	let { data }: { data: { hasPhrases: boolean } } = $props();
</script>

<DialectLanding dialect="egyptian-arabic" hasPhrases={data.hasPhrases} />
