<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import TrialOffer from '$lib/components/TrialOffer.svelte';

	const DIALECT_NAMES: Record<string, string> = {
		'egyptian-arabic': 'Egyptian Arabic',
		levantine: 'Levantine Arabic',
		darija: 'Moroccan Arabic',
		fusha: 'Modern Standard Arabic'
	};

	let dialectName = $derived(DIALECT_NAMES[page.data.targetDialect ?? ''] ?? '');

	async function logout() {
		try {
			await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
		} finally {
			await invalidateAll();
			await goto(resolve('/'), { invalidateAll: true });
		}
	}
</script>

<!-- Covers the app chrome: every link in it would only redirect back here. -->
<div class="paywall-bg fixed inset-0 z-50 overflow-y-auto">
	<div class="flex min-h-full justify-center px-4 py-8 sm:px-8">
		<div class="my-auto w-full max-w-4xl">
			<TrialOffer {dialectName} onLogout={logout} />
		</div>
	</div>
</div>

<style>
	/* Same backdrop as the onboarding modal the user just came from. */
	.paywall-bg {
		background:
			radial-gradient(90% 70% at 15% 0%, hsl(var(--brand-hue) 45% 55% / 0.16), transparent 60%),
			radial-gradient(80% 60% at 100% 100%, hsl(145 45% 50% / 0.12), transparent 55%),
			var(--tile2);
	}
</style>
