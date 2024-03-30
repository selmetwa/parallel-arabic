<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
  const { stories } = data;
</script>

<section class="h-full p-8">
  <h1 class="text-2xl font-bold">Stories</h1>
  <ul>
    {#each stories as story}
      <li>
        <a href={`/stories/${story.id}`} class="text-3xl font-bold">
        <article class="px-4 py-8 flex-col flex gap-2 border-2 border-tile-600 text-center bg-tile-400 hover:bg-tile-500 transitional-all duration-300 cursor-pointer font-semibold">
          <p class="text-2xl text-text-300">{story.title} (عُمَروسَارة)</p>
          <p class="text-base text-text-200">14 Sentances</p>
          <p class="text-base text-text-200">Difficulty: Easy</p>
        </article>
      </a>
      </li>
    {/each}
  </ul>
</section>