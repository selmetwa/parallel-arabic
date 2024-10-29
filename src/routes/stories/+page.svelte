<script>
  import { stories } from '$lib/constants/stories';
    import PaywallModal from '$lib/components/PaywallModal.svelte';
  import CreateStoryModal from './components/CreateStoryModal.svelte';

  let { data } = $props();
  console.log({ data });
  let isModalOpen = $state(false);

  // let userGeneratedStories = $derived.by(() => {
  //   const output = []

  //   for (const story of data.user_generated_stories) {
  //     const a = JSON.parse(story.story_body)
  
  //     output.push({
  //       id: story.id,
  //       title: `${a.title.arabic} / ${a.title.english}`,
  //       description: story.description,
  //       createdAt: story.created_at,
  //       difficulty: story.difficulty,
  //       length: a.sentences.length
  //     })
  //   }
  //   return output
  // })

  function openPaywallModal() {
  isModalOpen = true;
}

function handleCloseModal() {
  isModalOpen = false;
}

</script>

<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>

<section class="px-4 sm:mt-8 sm:px-16 mt-4 pb-12 sm:pb-0">
<h1 class="text-4xl font-bold text-text-300">Read</h1>
<p class="text-text-200 text-lg">Improve your Egyptian Arabic reading and listening comprehension skills with these conversations written by professional arabic teachers</p>
<!-- <CreateStoryModal></CreateStoryModal> -->
<ul class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
    {#each Object.entries(stories) as [key, value]}
      {#if value.isPaywalled && !data.hasActiveSubscription}
      <li>
        <button onclick={openPaywallModal} class="flex w-full">
          <article class="w-full px-4 py-8 flex-col flex gap-2 border-2 border-tile-600 text-center bg-tile-400 hover:bg-tile-500 transitional-all duration-300 cursor-pointer font-semibold">
            <p class="text-xl text-text-300 flex flex-row items-center w-fit gap-2 mx-auto">
              {#if value.isPaywalled}
                <span class="text-lg">🔒</span>
              {/if}
              {value.story.title.english} / {value.story.title.arabic}
            </p>
            <div>
              <p class="text-base text-text-200">{value.story.sentences.length} Sentences</p>
              <p class="text-base text-text-200">{value.description}</p>
            </div>
          </article>
        </button>
      </li>
      {:else}
      <li>
        <a href={`/stories/${key}`}>
          <article class="px-4 py-8 flex-col flex gap-2 border-2 border-tile-600 text-center bg-tile-400 hover:bg-tile-500 transitional-all duration-300 cursor-pointer font-semibold">
            <p class="text-xl text-text-300 ">
              {value.story.title.english} / {value.story.title.arabic}
            </p>
            <div>
              <p class="text-base text-text-200">{value.story.sentences.length} Sentences</p>
              <p class="text-base text-text-200">{value.description}</p>
            </div>
          </article>
        </a>
      </li>
      {/if}
    {/each}
  </ul>
</section>

<!-- 
<section class="px-4 sm:mt-8 sm:px-16 mt-4 pb-12 sm:pb-0">
  <h2 class="text-2xl font-bold text-text-300">User Generated Stories</h2>
  <p class="text-lg text-text-200">
    Read stories created by other parallel arabic learners.
  </p>
  <ul class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
    {#each userGeneratedStories as story}
    <li>
      <a href={`/generated-stories/${story.id}`}>
        <article class="px-4 py-8 flex-col flex gap-2 border-2 border-tile-600 text-center bg-tile-400 hover:bg-tile-500 transitional-all duration-300 cursor-pointer font-semibold">
          <p class="text-xl text-text-300 ">
            {story.title}
          </p>
          <div>
            <p class="text-base text-text-200">{story.length} Sentences</p>
            <p class="text-base text-text-200">{story.description}</p>
            <p class="text-base text-text-200">Difficulty: {story.difficulty}</p>
          </div>
        </article>
      </a>
    </li>
  {/each}
  </ul>
</section> -->