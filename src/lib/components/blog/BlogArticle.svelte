<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import type { BlogPost } from '$lib/constants/blog-posts';

	/**
	 * The frame for blog posts that embed games. Prose styles apply to the
	 * article's direct children only, so they don't reach into a game's markup.
	 */
	interface Props {
		post: BlogPost;
		subtitle: string;
		children: Snippet;
	}

	let { post, subtitle, children }: Props = $props();

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<section class="min-h-screen bg-tile-200">
	<article class="mx-auto max-w-2xl px-4 py-12 sm:px-8 sm:py-16">
		<a
			href={resolve('/blog')}
			class="mb-8 inline-flex items-center gap-2 text-sm text-text-200 transition-colors hover:text-text-300"
		>
			<span aria-hidden="true">←</span>
			<span>All posts</span>
		</a>

		<header class="mb-8">
			<h1 class="mb-3 text-3xl font-bold leading-tight text-text-300 sm:text-4xl">{post.title}</h1>
			<p class="mb-4 text-lg text-text-200">{subtitle}</p>
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-200">
				<span>{formatDate(post.date)}</span>
				<span aria-hidden="true">·</span>
				<span>{post.readingTime}</span>
			</div>
		</header>

		<div class="body">
			{@render children()}
		</div>
	</article>
</section>

<style>
	.body {
		font-size: 1rem;
		line-height: 1.7;
		color: var(--text2);
	}

	.body > :global(* + *) {
		margin-top: 1rem;
	}

	.body > :global(h2) {
		margin-top: 2.5rem;
		margin-bottom: 0.75rem;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text1);
	}

	.body > :global(h3) {
		margin-top: 2rem;
		margin-bottom: 0.5rem;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text1);
	}

	.body > :global(ul) {
		list-style: disc;
		padding-left: 1.25rem;
	}

	.body > :global(ol) {
		list-style: decimal;
		padding-left: 1.25rem;
	}

	.body > :global(ul) > :global(li + li),
	.body > :global(ol) > :global(li + li) {
		margin-top: 0.4rem;
	}

	.body > :global(:not(.blog-game)) :global(strong) {
		color: var(--text1);
	}

	.body > :global(:not(.blog-game)) :global(a) {
		color: var(--text1);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.body :global(.ar-text) {
		font-size: 1.15em;
		color: var(--text1);
	}

	.body > :global(.table-wrap) {
		overflow-x: auto;
	}

	.body > :global(.table-wrap) :global(table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.92rem;
	}

	.body > :global(.table-wrap) :global(th),
	.body > :global(.table-wrap) :global(td) {
		border-bottom: 1px solid var(--tile5);
		padding: 0.5rem 0.6rem;
		text-align: left;
		vertical-align: top;
	}

	.body > :global(.table-wrap) :global(th) {
		font-weight: 600;
		color: var(--text1);
	}
</style>
