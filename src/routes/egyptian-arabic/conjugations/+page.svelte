<script lang="ts">
  interface VerbIndexEntry {
    slug: string;
    arabic: string;
    transliteration: string;
    english: string;
    wordId: string;
    rootLetters: string;
    verbClass: 'sound' | 'hollow' | 'defective' | 'irregular' | 'doubled';
  }

  let { data }: { data: { verbs: VerbIndexEntry[]; hasActiveSubscription: boolean } } = $props();

  let searchQuery = $state('');
  let selectedClass = $state<string>('all');

  const verbClassColors: Record<string, string> = {
    sound: 'bg-green-700 text-white',
    hollow: 'bg-amber-600 text-white',
    defective: 'bg-orange-600 text-white',
    irregular: 'bg-red-600 text-white',
    doubled: 'bg-purple-600 text-white',
  };

  const filteredVerbs = $derived.by(() => {
    const query = searchQuery.trim().toLowerCase();
    return data.verbs.filter((verb) => {
      const matchesSearch =
        query === '' ||
        verb.english.toLowerCase().includes(query) ||
        verb.transliteration.toLowerCase().includes(query);
      const matchesClass = selectedClass === 'all' || verb.verbClass === selectedClass;
      return matchesSearch && matchesClass;
    });
  });
</script>

<svelte:head>
  <title>Egyptian Arabic Verb Conjugations — Complete Conjugation Tables</title>
  <meta name="description" content="Browse full conjugation tables for Egyptian Arabic verbs. Past, present, and future tense with affirmative and negative forms, Arabic script, and transliteration." />
</svelte:head>

<div class="max-w-5xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-text-300 mb-2">Egyptian Arabic Verb Conjugations</h1>
  <p class="text-text-200 mb-6">
    Practice all conjugations: past &amp; present, affirmative &amp; negative, all 8 pronouns.
  </p>

  <div class="flex flex-wrap gap-3 mb-6">
    <input
      type="text"
      placeholder="Search verbs..."
      bind:value={searchQuery}
      class="flex-1 min-w-48 px-4 py-2 bg-tile-300 border border-tile-500 rounded-lg text-text-300 placeholder:text-text-200 focus:outline-none focus:border-tile-600"
    />

    <div class="flex flex-wrap gap-2">
      {#each ['all', 'sound', 'hollow', 'defective', 'irregular', 'doubled'] as cls (cls)}
        <button
          onclick={() => (selectedClass = cls)}
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all
            {selectedClass === cls
            ? 'bg-amber-600 text-white'
            : 'bg-tile-500 text-text-300 border border-tile-600 hover:bg-tile-600'}"
        >
          {cls.charAt(0).toUpperCase() + cls.slice(1)}
        </button>
      {/each}
    </div>
  </div>

  <p class="text-sm text-text-200 mb-4">
    {filteredVerbs.length} verb{filteredVerbs.length !== 1 ? 's' : ''}
  </p>

  {#if data.verbs.length === 0}
    <div class="text-center py-12 bg-tile-300 border border-tile-500 rounded-xl">
      <p class="text-2xl mb-3">📚</p>
      <p class="text-text-300 font-semibold mb-2">Conjugation data not yet generated</p>
      <p class="text-text-200 text-sm">
        Run <code class="bg-tile-500 px-1 rounded">npm run generate:conjugations</code> to generate
        the verb conjugation data.
      </p>
    </div>
  {:else if filteredVerbs.length === 0}
    <div class="text-center py-8">
      <p class="text-text-200">No verbs match your search.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {#each filteredVerbs as verb (verb.slug)}
        <a
          href="/egyptian-arabic/conjugations/{verb.slug}"
          class="block bg-tile-300 border border-tile-500 rounded-xl p-4 hover:border-tile-600 hover:bg-tile-400 transition-all group"
        >
          <p class="text-3xl font-bold text-text-300 mb-1 text-center" dir="rtl">{verb.arabic}</p>
          <p class="text-sm text-text-200 text-center mb-1">{verb.transliteration}</p>
          <p class="text-base font-semibold text-text-300 text-center mb-2">{verb.english}</p>
          <div class="flex items-center justify-between">
            <p class="text-xs text-text-200">{verb.rootLetters}</p>
            <span
              class="text-xs px-2 py-0.5 rounded-full font-medium {verbClassColors[verb.verbClass] ??
                'bg-tile-500 text-text-200'}"
            >
              {verb.verbClass}
            </span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
