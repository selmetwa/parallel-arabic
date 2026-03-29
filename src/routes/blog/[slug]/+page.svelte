<script lang="ts">
  import type { PageData } from './$types';
  import AudioButton from '$lib/components/AudioButton.svelte';

  let { data }: { data: PageData } = $props();

  const post = $derived(data.post);

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
</script>

<svelte:head>
  <meta property="article:published_time" content={post.publishedAt} />
  {#if post.updatedAt}<meta property="article:modified_time" content={post.updatedAt} />{/if}
  {#each post.tags as tag}<meta property="article:tag" content={tag} />{/each}
</svelte:head>

<article class="max-w-3xl mx-auto px-4 sm:px-8 py-12">
  <a
    href="/blog"
    class="inline-flex items-center gap-1 text-sm text-text-200 hover:text-text-300 mb-8 transition-colors"
  >
    ← Back to Blog
  </a>

  <header class="mb-10">
    <div class="flex flex-wrap items-center gap-2 mb-3 text-sm text-text-200">
      <span class="capitalize">{post.dialect.replace(/-/g, ' ')}</span>
      <span>·</span>
      <span class="capitalize">{post.difficulty}</span>
      <span>·</span>
      <time datetime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
    </div>
    <h1 class="text-3xl sm:text-4xl font-bold text-text-300 mb-4 leading-tight">{post.title}</h1>
    <p class="text-text-200 text-lg leading-relaxed">{post.description}</p>
    <div class="flex flex-wrap gap-2 mt-4">
      {#each post.tags as tag (tag)}
        <span class="px-2 py-1 text-xs rounded bg-tile-500 border border-tile-600 text-text-200"
          >{tag}</span
        >
      {/each}
    </div>
  </header>

  <div class="space-y-8">
    {#each post.content as block (block)}
      {#if block.type === 'section-header'}
        {#if (block.level ?? 2) === 2}
          <h2 class="text-2xl font-bold text-text-300 pt-4 border-t-2 border-tile-500">
            {block.text}
          </h2>
        {:else}
          <h3 class="text-xl font-semibold text-text-300">{block.text}</h3>
        {/if}
      {:else if block.type === 'paragraph'}
        <p class="text-text-200 text-base leading-relaxed">{block.text}</p>
      {:else if block.type === 'callout'}
        <aside class="bg-tile-400 border-l-4 border-tile-600 rounded-r-xl px-5 py-4">
          {#if block.title}
            <p class="font-semibold text-text-300 mb-2 whitespace-pre-line">{block.title}</p>
          {/if}
          <p class="text-text-200 text-sm leading-relaxed whitespace-pre-line">{block.text}</p>
        </aside>
      {:else if block.type === 'example'}
        <div class="space-y-3">
          {#if block.caption}
            <p class="text-sm font-semibold text-text-300">{block.caption}</p>
          {/if}
          {#each block.items as item}
            <div
              class="bg-tile-300 border border-tile-600 rounded-xl px-5 py-3 grid grid-cols-1 gap-1"
            >
              <div class="flex items-start justify-end gap-2">
                <p class="text-xl text-text-300 font-medium text-right leading-relaxed flex-1" dir="rtl">
                  {item.arabic}
                </p>
                <AudioButton text={item.arabic} dialect="egyptian-arabic" className="mt-1 shrink-0" />
              </div>
              <p class="text-sm text-text-200 italic">{item.transliteration}</p>
              <p class="text-sm text-text-200">{item.english}</p>
            </div>
          {/each}
        </div>
      {:else if block.type === 'vocab-table'}
        <div class="overflow-x-auto">
          {#if block.caption}
            <p class="text-sm text-text-200 mb-2 italic">{block.caption}</p>
          {/if}
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="bg-tile-500 text-text-300">
                <th class="px-3 py-2 text-left border border-tile-600">Verb</th>
                <th class="px-3 py-2 text-left border border-tile-600">Masc.</th>
                <th class="px-3 py-2 text-left border border-tile-600">Fem.</th>
                <th class="px-3 py-2 text-left border border-tile-600">Plural</th>
                <th class="px-3 py-2 text-left border border-tile-600">Translit.</th>
                <th class="px-3 py-2 text-left border border-tile-600">English</th>
              </tr>
            </thead>
            <tbody>
              {#each block.rows as row, i}
                <tr
                  class="{i % 2 === 0
                    ? 'bg-tile-300'
                    : 'bg-tile-400'} hover:bg-tile-500 transition-colors"
                >
                  <td class="px-3 py-2 border border-tile-600 text-text-300 font-medium">
                    <div class="flex items-center gap-1">
                      <AudioButton text={row.arabic} dialect="egyptian-arabic" />
                      <span dir="rtl">{row.arabic}</span>
                    </div>
                  </td>
                  <td class="px-3 py-2 border border-tile-600 text-text-200" dir="rtl"
                    >{row.masculine}</td
                  >
                  <td class="px-3 py-2 border border-tile-600 text-text-200" dir="rtl"
                    >{row.feminine}</td
                  >
                  <td class="px-3 py-2 border border-tile-600 text-text-200" dir="rtl"
                    >{row.plural}</td
                  >
                  <td class="px-3 py-2 border border-tile-600 text-text-200 italic"
                    >{row.transliteration}</td
                  >
                  <td class="px-3 py-2 border border-tile-600 text-text-200">{row.english}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if block.type === 'dialogue'}
        <div class="space-y-3">
          {#if block.title}
            <p class="text-sm font-semibold text-text-300 mb-2">{block.title}</p>
          {/if}
          {#each block.exchanges as line}
            <div class="flex items-start gap-3">
              {#if line.speaker}
                <span
                  class="text-xs font-bold text-text-300 bg-tile-500 border border-tile-600 rounded-full px-2 py-1 mt-2 shrink-0 min-w-[2rem] text-center"
                  >{line.speaker}</span
                >
              {/if}
              <div class="flex-1 bg-tile-300 border border-tile-600 rounded-xl px-4 py-3">
                <div class="flex items-start justify-end gap-2">
                  <p class="text-lg text-text-300 text-right leading-relaxed flex-1" dir="rtl">
                    {line.arabic}
                  </p>
                  <AudioButton text={line.arabic} dialect="egyptian-arabic" className="mt-1 shrink-0" />
                </div>
                <p class="text-xs text-text-200 italic mt-1">{line.transliteration}</p>
                <p class="text-xs text-text-200 mt-0.5">{line.english}</p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/each}
  </div>

  {#if post.relatedLinks && post.relatedLinks.length > 0}
    <aside class="mt-16 border-t-2 border-tile-500 pt-8">
      <h2 class="text-lg font-semibold text-text-300 mb-4">Keep Learning</h2>
      <ul class="space-y-2">
        {#each post.relatedLinks as link}
          <li>
            <a
              href={link.href}
              class="text-text-200 hover:text-text-300 hover:underline transition-colors"
            >
              → {link.label}
            </a>
          </li>
        {/each}
      </ul>
    </aside>
  {/if}
</article>
