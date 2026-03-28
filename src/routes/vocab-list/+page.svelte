<script lang="ts">
  interface Section {
    name: string;
    path: string;
    count: number;
  }

  interface Dialect {
    key: string;
    name: string;
    sections: Section[];
  }

  interface PageData {
    dialects: Dialect[];
  }

  let { data }: { data: PageData } = $props();

  const title = 'Arabic Vocabulary by Dialect and Category | Parallel Arabic';
  const description =
    'Browse Arabic vocabulary organized by dialect and category. Learn Egyptian Arabic, Levantine Arabic, Moroccan Darija, and Modern Standard Arabic words with English translations and transliterations.';
  const canonical = 'https://www.parallel-arabic.com/vocab-list';
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
  <h1 class="text-3xl sm:text-4xl font-bold text-text-300 mb-3 tracking-tight">
    Arabic Vocabulary by Dialect &amp; Category
  </h1>
  <p class="text-text-200 text-base sm:text-lg mb-12 max-w-2xl">
    A reference of Arabic words organized by dialect and category, with English
    translations and transliterations. Choose a dialect below to browse
    vocabulary by topic.
  </p>

  {#each data.dialects as dialect (dialect.key)}
    <section class="mb-12">
      <h2 class="text-xl font-semibold text-text-300 mb-4">{dialect.name}</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {#each dialect.sections as section (section.path)}
          {@const href = `/vocab-list/${dialect.key}/${section.path}`}
          <a
            {href}
            class="block rounded-lg border-2 border-tile-600 bg-tile-400 px-4 py-3 hover:bg-tile-500 hover:shadow-md transition-all duration-150"
          >
            <span class="block text-sm font-medium text-text-300">
              {section.name}
            </span>
            <span class="block text-xs text-text-200 mt-0.5">
              {section.count} words
            </span>
          </a>
        {/each}
      </div>
    </section>
  {/each}
</div>
