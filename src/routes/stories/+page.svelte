<script>
  import { stories } from '$lib/constants/stories';
  import PaywallModal from '$lib/components/PaywallModal.svelte';

  export let data;
  
  $:isModalOpen = false;

  function openPaywallModal() {
  isModalOpen = true;
}

function handleCloseModal() {
  isModalOpen = false;
}
</script>

<PaywallModal isOpen={isModalOpen} {handleCloseModal}></PaywallModal>

<section class="px-4 sm:mt-8 sm:px-16 mt-4">
<h1 class="text-4xl font-bold text-text-300">Read</h1>
<p class="text-text-200 text-lg">Improve your Egyptian Arabic reading and listening comprehension skills with these conversations written by professional arabic teachers</p>
<ul class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
    {#each Object.entries(stories) as [key, value]}
      {#if value.isPaywalled && !data.hasActiveSubscription}
      <li>
        <button on:click={openPaywallModal} class="flex w-full">
          <article class="w-full px-4 py-8 flex-col flex gap-2 border-2 border-tile-600 text-center bg-tile-400 hover:bg-tile-500 transitional-all duration-300 cursor-pointer font-semibold">
            <p class="text-3xl text-text-300 flex flex-row items-center w-fit gap-2 mx-auto">
              {#if value.isPaywalled}
                <span class="text-lg">🔒</span>
              {/if}
              {value.story.title.english}
            </p>
            <p class="text-xl text-text-200">{value.story.title.arabic}</p>
            <p class="text-base text-text-200">{value.story.sentences.length} Sentences</p>
          </article>
        </button>
      </li>
      {:else}
      <li>
        <a href={`/stories/${key}`}>
          <article class="px-4 py-8 flex-col flex gap-2 border-2 border-tile-600 text-center bg-tile-400 hover:bg-tile-500 transitional-all duration-300 cursor-pointer font-semibold">
            <p class="text-3xl text-text-300 ">
              {value.story.title.english}
            </p>
            <p class="text-xl text-text-200">{value.story.title.arabic}</p>
            <p class="text-base text-text-200">{value.story.sentences.length} Sentences</p>
          </article>
        </a>
      </li>
      {/if}

    {/each}
  </ul>
</section>