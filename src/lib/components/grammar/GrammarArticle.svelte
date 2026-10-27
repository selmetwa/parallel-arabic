<script lang="ts">
	// A rendered grammar article. The HTML comes from repo-authored Markdown
	// via $lib/data/grammar/render.ts, never from user input.
	interface Props {
		html: string;
		class?: string;
	}

	let { html, class: className = '' }: Props = $props();
</script>

<article class="grammar {className}">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html html}
</article>

<style>
	.grammar {
		color: var(--text2);
		line-height: 1.7;
		min-width: 0;
	}
	.grammar :global(h2) {
		margin: 1.75rem 0 0.6rem;
		font-size: 1.3rem;
		font-weight: 700;
		color: var(--text1);
	}
	.grammar :global(h3) {
		margin: 1.25rem 0 0.4rem;
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text1);
	}
	.grammar :global(p) {
		margin: 0.6rem 0;
	}
	.grammar :global(strong) {
		color: var(--text1);
	}
	.grammar :global(a) {
		color: var(--text1);
		font-weight: 600;
		text-decoration: underline;
	}
	.grammar :global(ul:not(.examples)) {
		margin: 0.6rem 0;
		padding-left: 1.25rem;
		list-style: disc;
	}
	.grammar :global(.ar) {
		font-size: 1.15em;
		color: var(--text1);
	}
	.grammar :global(.examples) {
		display: grid;
		gap: 0.5rem;
		margin: 0.9rem 0;
	}
	.grammar :global(.ex) {
		display: grid;
		gap: 0.1rem;
		padding: 0.7rem 0.9rem;
		border: 1px solid var(--tile5);
		border-radius: 0.75rem;
		background: var(--tile3);
	}
	.grammar :global(.ex-ar) {
		font-size: 1.35rem;
		font-weight: 600;
		color: var(--text1);
		text-align: right;
	}
	.grammar :global(.ex-tr) {
		font-style: italic;
		font-size: 0.9rem;
	}
	.grammar :global(.ex-en) {
		font-size: 0.95rem;
		color: var(--text1);
	}
	.grammar :global(.table-wrap) {
		overflow-x: auto;
		margin: 0.9rem 0;
	}
	.grammar :global(table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.92rem;
	}
	.grammar :global(th),
	.grammar :global(td) {
		padding: 0.45rem 0.6rem;
		border-bottom: 1px solid var(--tile5);
		text-align: left;
		vertical-align: top;
	}
	.grammar :global(th) {
		color: var(--text1);
		font-weight: 700;
	}
	.grammar :global(.tip) {
		margin: 1rem 0;
		padding: 0.75rem 1rem;
		border-left: 3px solid var(--brand, var(--tile6));
		border-radius: 0 0.75rem 0.75rem 0;
		background: var(--tile3);
		color: var(--text1);
	}
</style>
