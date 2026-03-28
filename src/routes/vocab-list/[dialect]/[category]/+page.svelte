<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const words = $derived(data.words);
  const dialect = $derived(data.dialect);
  const dialectName = $derived(data.dialectName);
  const category = $derived(data.category);
  const categoryName = $derived(data.categoryName);

  const pageUrl = $derived(
    `https://www.parallel-arabic.com/vocab-list/${dialect}/${category}`
  );
  const pageTitle = $derived(
    `${categoryName} in ${dialectName} - ${words.length} Words | Parallel Arabic`
  );
  const pageDescription = $derived(
    `Learn ${words.length} ${categoryName} words in ${dialectName}. Browse Arabic script, English translations, and transliterations.`
  );

  const jsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${categoryName} in ${dialectName}`,
      description: pageDescription,
      numberOfItems: words.length,
      itemListElement: words.map((word, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: word.english_word,
        description: word.arabic_word
      }))
    })
  );
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <link rel="canonical" href={pageUrl} />

  <!-- Open Graph -->
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={pageUrl} />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={pageDescription} />

  <!-- JSON-LD structured data -->
  {@html `<script type="application/ld+json">${jsonLd}<\/script>`}
</svelte:head>

<div class="max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
  <h1 class="text-3xl sm:text-4xl font-bold text-text-300 mb-4 tracking-tight">
    {dialectName}
    {categoryName} — {words.length} Words
  </h1>

  <p class="text-text-200 text-base sm:text-lg mb-10 leading-relaxed max-w-2xl">
    This page lists {words.length}
    {categoryName.toLowerCase()} in {dialectName}, one of the most widely spoken varieties of Arabic.
    Each entry includes the Arabic script, an English translation, and a phonetic transliteration to
    help you pronounce each word correctly. Whether you are a beginner or building on existing
    knowledge, this word list is a practical starting point for learning Arabic.
  </p>

  {#if words.length > 0}
    <div class="overflow-x-auto rounded-lg border-2 border-tile-600 shadow-lg mb-12">
      <table class="w-full text-sm">
        <thead class="bg-tile-500 border-b-2 border-tile-600">
          <tr>
            <th class="px-6 py-3 text-right font-semibold text-text-300 w-1/3">Arabic</th>
            <th class="px-6 py-3 text-left font-semibold text-text-300 w-1/3">Transliteration</th>
            <th class="px-6 py-3 text-left font-semibold text-text-300 w-1/3">English</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-tile-600 bg-tile-400">
          {#each words as word, i (word.arabic_word + i)}
            <tr class="hover:bg-tile-300 transition-colors">
              <td class="px-6 py-4 text-right text-lg font-medium text-text-300" dir="rtl">
                {word.arabic_word}
              </td>
              <td class="px-6 py-4 text-left text-text-200 italic">
                {word.transliterated_word}
              </td>
              <td class="px-6 py-4 text-left text-text-300">
                {word.english_word}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="py-16 text-center text-text-200 border-2 border-tile-600 rounded-lg mb-12 bg-tile-400">
      <p class="text-lg">No words found for this category yet.</p>
      <p class="text-sm mt-2">Check back soon — we add new content regularly.</p>
    </div>
  {/if}

  <section class="bg-tile-400 rounded-lg border-2 border-tile-600 p-8 text-center shadow-lg">
    <h2 class="text-xl font-semibold text-text-300 mb-2">Ready to go deeper?</h2>
    <p class="text-text-200 mb-6">
      Explore thousands of Arabic words across dialects, or sign up to start practicing with
      interactive lessons.
    </p>
    <div class="flex flex-col sm:flex-row gap-3 justify-center">
      <a
        href="/vocabulary"
        class="inline-block px-6 py-3 bg-tile-500 border-2 border-tile-600 text-text-300 font-medium hover:bg-tile-600 transition-all duration-300 shadow-md"
      >
        Browse Vocabulary
      </a>
      <a
        href="/signup"
        class="inline-block px-6 py-3 border-2 border-tile-600 text-text-200 font-medium hover:bg-tile-500 transition-all duration-300 shadow-md"
      >
        Start Learning Free
      </a>
    </div>
  </section>
</div>
