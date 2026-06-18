<script lang="ts">
	import { blogPosts } from '$lib/constants/blog-posts';

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<section class="min-h-screen bg-tile-200">
	<div class="mx-auto max-w-3xl px-4 py-12 sm:px-8 sm:py-16">
		<header class="mb-10">
			<h1 class="mb-3 text-3xl font-bold text-text-300 sm:text-4xl">Blog</h1>
			<p class="text-base leading-relaxed text-text-200">
				Parallel Arabic blog
			</p>
		</header>

		<ul class="space-y-4">
			{#each blogPosts as post (post.slug)}
				<li>
					<a
						href={`/blog/${post.slug}`}
						class="block rounded-xl border border-tile-500 bg-tile-300 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-text-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-300 sm:p-6"
					>
						<div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-200">
							<span>{formatDate(post.date)}</span>
							<span aria-hidden="true">·</span>
							<span>{post.readingTime}</span>
						</div>
						<h2 class="mb-2 text-xl font-bold text-text-300 sm:text-2xl">{post.title}</h2>
						<p class="text-sm leading-relaxed text-text-200">{post.description}</p>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</section>
