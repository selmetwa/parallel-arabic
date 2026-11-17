<script lang="ts">
	import VarietyLanding from '$lib/components/VarietyLanding.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<VarietyLanding variety={data.variety} faqs={data.faqs} />
