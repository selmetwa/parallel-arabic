<script>
  import { stories } from '$lib/constants/stories';
</script>

<section class=" px-4 sm:mt-12 sm:px-16 mt-4">
<h1 class="text-4xl font-bold text-text-300">Read</h1>
<p class="text-text-200 text-lg">Improve your Egyptian Arabic reading and listening comprehension skills with these conversations written by professional arabic teachers</p>
<ul class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
    {#each Object.entries(stories) as [key, value]}
      <li>
        <a href={`/stories/${key}`}>
          <article class="px-4 py-8 flex-col flex gap-2 border-2 border-tile-600 text-center bg-tile-400 hover:bg-tile-500 transitional-all duration-300 cursor-pointer font-semibold">
            <p class="text-3xl text-text-300">{value.title.english}</p>
            <p class="text-xl text-text-200">{value.title.arabic}</p>
            <p class="text-base text-text-200">{value.sentences.length} Sentences</p>
          </article>
        </a>
      </li>
    {/each}
  </ul>
</section>