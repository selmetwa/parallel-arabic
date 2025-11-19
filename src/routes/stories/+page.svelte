<script lang="ts">
  import { stories } from '$lib/constants/stories';
  import PaywallModal from '$lib/components/PaywallModal.svelte';
  import CreateStoryModal from '$lib/components/dialect-shared/story/components/CreateStoryModal.svelte';
  import { BLOCKED_STORY_IDS } from '$lib/constants/stories/blocked';

  let { data } = $props();
  let isModalOpen = $state(false);
  let selectedDialect = $state('egyptian-arabic');

  // Function to filter out incomplete sentences
  function filterValidSentences(sentences: any[]) {
    if (!Array.isArray(sentences)) return [];
    return sentences.filter(sentence => 
      sentence && 
      sentence.arabic?.text && 
      sentence.english?.text && 
      sentence.transliteration?.text &&
      typeof sentence.arabic.text === 'string' &&
      typeof sentence.english.text === 'string' &&
      typeof sentence.transliteration.text === 'string' &&
      sentence.arabic.text.trim() !== '' &&
      sentence.english.text.trim() !== '' &&
      sentence.transliteration.text.trim() !== ''
    );
  }

  let userGeneratedStories = $derived.by(() => {
    const output = []

    for (const story of data.user_generated_stories) {
      const storyBody = story.story_body

      if (BLOCKED_STORY_IDS.includes(story.id)) {
        continue
      }

      // Filter valid sentences and get the count
      const validSentences = filterValidSentences(storyBody?.sentences || []);

      output.push({
        id: story.id,
        title: `${storyBody?.title?.english || ''} / ${storyBody?.title?.arabic || ''}`,
        description: story.description,
        createdAt: story.created_at,
        difficulty: story.difficulty,
        dialect: story.dialect,
        dialectName: story.dialect_name,
        length: validSentences.length
      })
    }
    return output
  })

  function openPaywallModal() {
    isModalOpen = true;
  }

  function handleCloseModal() {
    isModalOpen = false;
  }

  const dialectOptions = [
    { value: 'egyptian-arabic', label: 'Egyptian Arabic' },
    { value: 'fusha', label: 'Modern Standard Arabic' },
    { value: 'levantine', label: 'Levantine Arabic' },
    { value: 'darija', label: 'Moroccan Darija' },
  ];

  // Get dialect badge color
  function getDialectBadgeColor(dialect: string) {
    const colors = {
      'egyptian-arabic': 'bg-tile-500 text-text-300',
      'levantine': 'bg-orange-100 text-orange-800',
      'darija': 'bg-green-100 text-green-800',
      'fusha': 'bg-purple-100 text-purple-800',
    };
    return colors[dialect as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }
</script>

<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>

<section class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
  <div class="text-left mb-6">
    <h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-1 tracking-tight">Stories</h1>
    <p class="text-text-200 text-lg sm:text-xl leading-snug">Improve your Arabic reading and listening comprehension skills with stories from all dialects</p>
    
    <!-- Dialect Selection for Story Creation -->
    <div class="mt-4 mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div class="flex flex-col gap-2">
        <label for="dialect-select" class="text-sm text-text-300 font-medium">Choose dialect for new story:</label>
        <select 
          id="dialect-select"
          bind:value={selectedDialect}
          class="px-3 py-2 border border-tile-600 bg-tile-200 text-text-300 rounded focus:outline-none focus:border-tile-500"
        >
          {#each dialectOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
      <div class="mt-2 sm:mt-6">
        <CreateStoryModal dialect={selectedDialect as any} data={data}></CreateStoryModal>
      </div>
    </div>
  </div>
  
  <!-- Static Stories Section -->
  <div class="text-left mb-6">
    <h2 class="text-2xl text-text-300 font-bold mb-1">Featured Stories</h2>
    <p class="text-text-200 text-lg leading-snug">
      Professional Arabic stories and conversations
    </p>
  </div>
  
  <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 auto-rows-fr mb-12">
    {#each Object.entries(stories) as [key, value]}
      {#if value.isPaywalled && !data.hasActiveSubscription}
      <li class="flex">
        <button onclick={openPaywallModal} class="flex w-full">
          <article class="group w-full px-3 py-4 flex flex-col justify-between border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
            <div class="flex flex-col gap-2">
              <div class="flex flex-row items-center gap-2">
                {#if value.isPaywalled}
                  <span class="text-lg leading-none flex-shrink-0 self-start mt-[4px]">🔒</span>
                {/if}
                <p class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300 flex-1">
                  {value.story.title.english} / {value.story.title.arabic}
                </p>
              </div>
              <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full w-fit">
                Egyptian Arabic
              </span>
            </div>
            <div class="flex flex-col gap-0 mt-2">
              <p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">{value.story.sentences.length} Sentences</p>
              <p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">{value.description}</p>
            </div>
          </article>
        </button>
      </li>
      {:else}
      <li class="flex">
        <a href={`/egyptian-arabic/stories/${key}`} class="flex w-full">
          <article class="group w-full px-3 py-4 flex flex-col justify-between border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
            <div class="flex flex-col gap-2">
              <p class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">
                {value.story.title.english} / {value.story.title.arabic}
              </p>
              <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full w-fit">
                Egyptian Arabic
              </span>
            </div>
            <div class="flex flex-col gap-0 mt-2">
              <p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">{value.story.sentences.length} Sentences</p>
              <p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">{value.description}</p>
            </div>
          </article>
        </a>
      </li>
      {/if}
    {/each}
  </ul>
</section>

<section class="px-3 mt-8 sm:px-8 max-w-5xl mx-auto pb-12 sm:pb-0">
  <div class="text-left mb-6">
    <h2 class="text-2xl text-text-300 font-bold mb-1">User Generated Stories</h2>
    <p class="text-text-200 text-lg leading-snug">
      Read stories created by Parallel Arabic learners from all dialects.
    </p>
  </div>
  
  <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 auto-rows-fr">
    {#each userGeneratedStories as story}
    <li class="flex">
      <a href={`/generated_story/${story.id}`} class="flex w-full">
        <article class="group w-full px-3 py-4 flex flex-col justify-between border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
          <div class="flex flex-col gap-2">
            <p class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">
              {story.title}
            </p>
            <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full w-fit {getDialectBadgeColor(story.dialect)}">
              {story.dialectName}
            </span>
          </div>
          <div class="flex flex-col gap-0 mt-2">
            <p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">{story.length} Sentences</p>
            <p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">Difficulty: {story.difficulty}</p>
          </div>
        </article>
      </a>
    </li>
    {/each}
  </ul>
</section>
