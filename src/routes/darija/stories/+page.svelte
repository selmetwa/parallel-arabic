<script lang="ts">
  import PaywallModal from '$lib/components/PaywallModal.svelte';
  import CreateStoryModal from '$lib/components/dialect-shared/story/components/CreateStoryModal.svelte';
  import { BLOCKED_STORY_IDS } from '$lib/constants/stories/blocked';
  import { onMount } from 'svelte';
  import { currentDialect } from '$lib/store/store';

  let { data } = $props();
  let isModalOpen = $state(false);

  onMount(() => {
    currentDialect.set('darija');
  });

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

  // Filter stories for darija dialect and remove the dialect suffix from title
  let darijaGeneratedStories = $derived.by(() => {
    const output = []

    for (const story of data.user_generated_stories) {
      const a = JSON.parse(story.story_body)

      if (BLOCKED_STORY_IDS.includes(story.id)) {
        continue
      }

      // Only include stories that end with _darija
      if (!story.title?.endsWith('_darija')) {
        continue
      }

      // Filter valid sentences and get the count
      const validSentences = filterValidSentences(a.sentences || []);

      // Remove the _darija suffix from the title for display
      const displayTitle = story.title.replace('_darija', '');

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
    <h1 class="text-3xl sm:text-4xl text-text-300 font-bold mb-1 tracking-tight">Darija Stories</h1>
    <p class="text-text-200 text-lg sm:text-xl leading-snug">
      Practice reading Darija with AI-generated Stories.
    </p>
    <CreateStoryModal dialect="darija" data={data}></CreateStoryModal>
  </div>
  
  {#if darijaGeneratedStories.length === 0}
    <div class="text-center py-12">
      <div class="text-6xl mb-4">📚</div>
      <h2 class="text-2xl text-text-300 font-bold mb-4">No darija Stories Yet</h2>
      <p class="text-text-200 mb-6">Create your first Modern Standard Arabic story to get started!</p>
    </div>
  {:else}
    <h2 class="text-2xl text-text-300 font-bold mb-4">AI-Generated darija Stories</h2>
    <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 auto-rows-fr">
      {#each darijaGeneratedStories as story}
      <li class="flex">
        <a href={`/darija/generated-stories/${story.id}`} class="flex w-full">
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
  {/if}
</section> 