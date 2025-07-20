<script lang="ts">
  import { stories } from '$lib/constants/stories';
    import PaywallModal from '$lib/components/PaywallModal.svelte';
  import CreateStoryModal from './components/CreateStoryModal.svelte';
  import { BLOCKED_STORY_IDS } from '$lib/constants/stories/blocked';

  let { data } = $props();
  let isModalOpen = $state(false);

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
      const a = JSON.parse(story.story_body)

      if (BLOCKED_STORY_IDS.includes(story.id)) {
        continue
      }

      // Filter valid sentences and get the count
      const validSentences = filterValidSentences(a.sentences || []);

      output.push({
        id: story.id,
        title: `${a.title?.english || ''} / ${a.title?.arabic || ''}`,
        description: story.description,
        createdAt: story.created_at,
        difficulty: story.difficulty,
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

</script>

<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>

<section class="px-3 mt-6 sm:px-8 max-w-5xl mx-auto">
  <div class="text-left mb-6">
    <h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-1 tracking-tight">Read</h1>
    <p class="text-text-200 text-lg sm:text-xl leading-snug">Improve your Egyptian Arabic reading and listening comprehension skills with these conversations written by professional arabic teachers</p>
    <CreateStoryModal></CreateStoryModal>
  </div>
  
  <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 auto-rows-fr">
    {#each Object.entries(stories) as [key, value]}
      {#if value.isPaywalled && !data.hasActiveSubscription}
      <li class="flex">
        <button onclick={openPaywallModal} class="flex w-full">
          <article class="group w-full px-3 py-4 flex flex-col justify-between border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
            <div class="flex flex-col gap-1">
              <div class="flex flex-row items-center gap-2">
                {#if value.isPaywalled}
                  <span class="text-lg leading-none flex-shrink-0 self-start mt-[4px]">🔒</span>
                {/if}
                <p class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300 flex-1">
                  {value.story.title.english} / {value.story.title.arabic}
                </p>
              </div>
            </div>
            <div class="flex flex-col gap-0 mt-1">
              <p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">{value.story.sentences.length} Sentences</p>
              <p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">{value.description}</p>
            </div>
          </article>
        </button>
      </li>
      {:else}
      <li class="flex">
        <a href={`/stories/${key}`} class="flex w-full">
          <article class="group w-full px-3 py-4 flex flex-col justify-between border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
            <div class="flex flex-col gap-1">
              <p class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">
                {value.story.title.english} / {value.story.title.arabic}
              </p>
            </div>
            <div class="flex flex-col gap-0 mt-1">
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
      Read stories created by other parallel arabic learners.
    </p>
  </div>
  
  <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 auto-rows-fr">
    {#each userGeneratedStories as story}
    <li class="flex">
      <a href={`/generated-stories/${story.id}`} class="flex w-full">
        <article class="group w-full px-3 py-4 flex flex-col justify-between border-2 border-tile-600 text-left bg-tile-400 hover:bg-tile-500 hover:border-tile-500 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
          <div class="flex flex-col gap-1">
            <p class="text-xl text-text-300 font-bold group-hover:text-text-200 transition-colors duration-300">
              {story.title}
            </p>
          </div>
          <div class="flex flex-col gap-0 mt-1">
            <p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">{story.length} Sentences</p>
            <p class="text-sm text-text-200 opacity-90 group-hover:opacity-100 transition-opacity duration-300">Difficulty: {story.difficulty}</p>
          </div>
        </article>
      </a>
    </li>
  {/each}
  </ul>
</section>