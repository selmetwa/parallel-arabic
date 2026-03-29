<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let activeTag = $state('all');

  const allTags = $derived(
    ['all', ...new Set(data.posts.flatMap((p) => p.tags))]
  );

  const filteredPosts = $derived(
    activeTag === 'all'
      ? data.posts
      : data.posts.filter((p) => p.tags.includes(activeTag))
  );

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
</script>


<div class="max-w-5xl mx-auto px-4 sm:px-8 py-12">
  <header class="mb-10">
    <h1 class="text-3xl sm:text-4xl font-bold text-text-300 mb-2 tracking-tight">
      Arabic Learning Blog
    </h1>
    <p class="text-text-200 text-lg">Grammar guides, vocabulary deep-dives, and dialect tips.</p>
  </header>

  <div class="flex flex-wrap gap-2 mb-8">
    {#each allTags as tag (tag)}
      <button
        type="button"
        onclick={() => (activeTag = tag)}
        class="px-3 py-1.5 text-sm font-medium rounded-full border-2 transition-colors {activeTag ===
        tag
          ? 'bg-tile-600 border-tile-600 text-text-100'
          : 'bg-tile-300 border-tile-500 text-text-200 hover:bg-tile-400'}"
      >
        {tag}
      </button>
    {/each}
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    {#each filteredPosts as post (post.slug)}
      <a
        href="/blog/{post.slug}"
        class="group flex flex-col gap-2 px-5 py-5 border-2 border-tile-600 bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-text-200 uppercase tracking-wide">
            {post.dialect.replace(/-/g, ' ')}
          </span>
          <span class="text-xs text-text-200">{formatDate(post.publishedAt)}</span>
        </div>
        <h2
          class="text-xl font-bold text-text-300 group-hover:text-text-200 transition-colors leading-snug"
        >
          {post.title}
        </h2>
        <p class="text-text-200 text-sm leading-relaxed">{post.description}</p>
        <div class="flex flex-wrap gap-1.5 mt-2">
          {#each post.tags as tag (tag)}
            <span class="px-2 py-0.5 text-xs rounded bg-tile-600 text-text-200">{tag}</span>
          {/each}
        </div>
        <span class="text-sm font-medium text-text-300 mt-1 group-hover:underline">Read more →</span>
      </a>
    {/each}
  </div>

  {#if filteredPosts.length === 0}
    <p class="text-text-200 text-center py-16">No posts found for this tag.</p>
  {/if}
</div>
