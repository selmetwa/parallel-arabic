<script lang="ts">
  import { formatDialectName } from '$lib/utils/seo';
  import type { PhraseIndexEntry } from '$lib/types/phrases';

  let { data }: { data: { dialect: string; phrases: PhraseIndexEntry[] } } = $props();

  const dialectName = $derived(formatDialectName(data.dialect));
  let searchQuery = $state('');

  const filtered = $derived.by(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data.phrases;
    return data.phrases.filter(
      (p) =>
        p.english.toLowerCase().includes(query) ||
        p.transliteration.toLowerCase().includes(query) ||
        p.arabic.includes(query)
    );
  });
</script>

<div class="mx-auto max-w-5xl px-4 py-8">
  <h1 class="mb-2 text-3xl font-bold text-text-300">{dialectName} Phrases</h1>
  <p class="mb-6 text-text-200">
    How to say the everyday things in {dialectName}, with the Arabic script, the tashkeel,
    a plain-ASCII transliteration, and the forms you need for a man, a woman, or a group.
  </p>

  <input
    type="text"
    placeholder="Search phrases..."
    bind:value={searchQuery}
    class="mb-6 w-full rounded-lg border border-tile-500 bg-tile-300 px-4 py-2 text-text-300 placeholder:text-text-200 focus:border-tile-600 focus:outline-none"
  />

  {#if data.phrases.length === 0}
    <div class="rounded-xl border border-tile-500 bg-tile-300 py-12 text-center">
      <p class="mb-3 text-2xl">💬</p>
      <p class="mb-2 font-semibold text-text-300">Phrase data not yet generated</p>
      <p class="text-sm text-text-200">
        Run <code class="rounded bg-tile-500 px-1">npm run generate:phrases</code> to build the
        phrasebook.
      </p>
    </div>
  {:else if filtered.length === 0}
    <p class="py-8 text-center text-text-200">No phrases match your search.</p>
  {:else}
    <p class="mb-4 text-sm text-text-200">
      {filtered.length} phrase{filtered.length !== 1 ? 's' : ''}
    </p>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each filtered as phrase (phrase.slug)}
        <a
          href="/{data.dialect}/phrases/{phrase.slug}"
          class="block rounded-xl border border-tile-500 bg-tile-300 p-5 transition-all hover:border-tile-600 hover:bg-tile-400"
        >
          <p class="mb-2 text-center text-3xl font-bold text-text-300" dir="rtl">{phrase.arabic}</p>
          <p class="mb-1 text-center text-sm text-text-200">{phrase.transliteration}</p>
          <p class="text-center text-base font-semibold text-text-300">{phrase.english}</p>
        </a>
      {/each}
    </div>
  {/if}

  <nav class="mt-10 border-t border-tile-600 pt-6 text-sm text-text-200">
    <a class="underline hover:text-text-300" href="/{data.dialect}">
      Learn {dialectName}
    </a>
    <span class="mx-2">·</span>
    <a class="underline hover:text-text-300" href="/vocabulary?dialect={data.dialect}">
      {dialectName} vocabulary
    </a>
    <span class="mx-2">·</span>
    <a class="underline hover:text-text-300" href="/tutor">Practise with the tutor</a>
  </nav>
</div>
