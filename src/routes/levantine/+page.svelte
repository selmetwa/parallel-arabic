<script lang="ts">
	import DialectLanding from '$lib/components/DialectLanding.svelte';

	let { data }: { data: { hasPhrases: boolean; hasWords: boolean } } = $props();
</script>

<DialectLanding dialect="levantine" hasPhrases={data.hasPhrases} hasWords={data.hasWords} />
