<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
  const { stories } = data;
</script>

<section class="h-full">
  <h1 class="text-2xl font-bold">Stories</h1>
  <ul>
    {#each stories as story}
      <li>
        <article class="border bg-tile-400 border-tile-600 w-min whitespace-nowrap p-8">
          <a href={`/story/${story.id}`} class="text-3xl font-bold">{story.title}</a>
        </article>
      </li>
    {/each}
  </ul>
</section>