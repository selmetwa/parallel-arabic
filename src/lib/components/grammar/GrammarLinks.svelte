<script lang="ts">
	import { getGrammarTopic, hasGrammar } from '$lib/data/grammar/topics';

	// Links into the grammar reference from pages that touch the same rules.
	// Renders nothing for dialects without a grammar guide yet.
	interface Props {
		dialect: string;
		slugs: string[];
		heading?: string;
	}

	let { dialect, slugs, heading = 'The grammar behind it' }: Props = $props();

	const topics = $derived(slugs.map((slug) => getGrammarTopic(slug)).filter((t) => t !== undefined));
</script>

{#if hasGrammar(dialect) && topics.length}
	<section class="mt-10">
		<h2 class="mb-3 text-xl font-bold text-text-300">{heading}</h2>
		<div class="grid gap-3 sm:grid-cols-2">
			{#each topics as topic (topic.slug)}
				<a
					href="/grammar/{dialect}/{topic.slug}"
					class="block rounded-xl border border-tile-500 bg-tile-300 p-4 transition-colors hover:border-tile-600 hover:bg-tile-400"
				>
					<p class="font-semibold text-text-300">{topic.title}</p>
					<p class="mt-1 text-sm text-text-200">{topic.summary}</p>
				</a>
			{/each}
		</div>
		<p class="mt-3 text-sm">
			<a class="font-semibold text-text-200 underline hover:text-text-300" href="/grammar/{dialect}">All grammar topics →</a>
		</p>
	</section>
{/if}
